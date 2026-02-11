import { NextResponse } from "next/server";
import { generateTasks } from "@/lib/agents/agent-system";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getStartupMemoryAdmin, updateStartupStageAdmin } from "@/lib/server/startup-data";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string; idea?: string; strategy?: string }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    const idea = body.idea ? String(body.idea).trim() : "";
    const strategy = body.strategy ? String(body.strategy).trim() : "";

    if (!startupId || (!idea && !strategy)) {
        return NextResponse.json(
            { error: { message: "startupId and idea or strategy are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }
    const sourceText = strategy || idea;
    if (sourceText.length < 5 || sourceText.length > 6000) {
        return NextResponse.json(
            { error: { message: "Strategy/idea length must be between 5 and 6000 characters.", code: "request/invalid-strategy" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = { startupId, ...access.startup } as any;
        const memories = await getStartupMemoryAdmin(startupId);

        const result = await generateTasks({ startup, memories }, strategy || idea);

        if (!result.success || !result.structuredData || !Array.isArray(result.structuredData.tasks)) {
            throw new Error(result.error || "Failed to generate tasks");
        }

        const tasks = result.structuredData.tasks;
        const db = await getAdminDb();

        const results = await Promise.all(
            tasks.map((task: any) =>
                db.collection("tasks").add({
                    startupId,
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority || "medium",
                    reason: task.reason || "",
                    status: "pending",
                    createdByAgent: "Executor Agent",
                    createdAt: FieldValue.serverTimestamp()
                })
            )
        );

        await updateStartupStageAdmin(startupId, "execution_active");
        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error("Task generation error:", error);
        return NextResponse.json(
            { error: { message: error.message || "Failed to generate tasks", code: "generate-tasks/failed" } },
            { status: 500 }
        );
    }
}
