import { NextResponse } from "next/server";
import { generateRoadmap } from "@/lib/agents/agent-system";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { addStartupMemoryAdmin, getStartupMemoryAdmin, updateStartupStageAdmin } from "@/lib/server/startup-data";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string; idea?: string; context?: string }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    const idea = String(body.idea || "").trim();
    const context = body.context ? String(body.context) : undefined;

    if (!startupId || !idea) {
        return NextResponse.json(
            { error: { message: "startupId and idea are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }
    if (idea.length < 5 || idea.length > 4000) {
        return NextResponse.json(
            { error: { message: "Idea length must be between 5 and 4000 characters.", code: "request/invalid-idea" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = { startupId, ...access.startup } as any;
        const memories = await getStartupMemoryAdmin(startupId);

        const result = await generateRoadmap({ startup, memories, additionalContext: context }, idea);

        if (!result.success || !result.structuredData) {
            throw new Error(result.error || "Failed to generate roadmap");
        }

        const roadmap = result.structuredData;

        await updateStartupStageAdmin(startupId, "roadmap_created");
        await addStartupMemoryAdmin(startupId, "agent-output", "agent", JSON.stringify(roadmap));

        const db = await getAdminDb();
        await db.collection("roadmaps").doc(startupId).set(
            {
                startupId,
                generatedRoadmap: roadmap,
                updatedAt: FieldValue.serverTimestamp(),
                generatedAt: FieldValue.serverTimestamp()
            },
            { merge: true }
        );

        return NextResponse.json(roadmap);
    } catch (error: any) {
        console.error("Roadmap generation error:", error);
        return NextResponse.json(
            { error: { message: error.message || "Failed to generate roadmap", code: "generate-roadmap/failed" } },
            { status: 500 }
        );
    }
}
