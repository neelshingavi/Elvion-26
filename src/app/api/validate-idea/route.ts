import { NextResponse } from "next/server";
import { validateIdea } from "@/lib/agents/agent-system";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { addStartupMemoryAdmin, getStartupMemoryAdmin, updateStartupStageAdmin } from "@/lib/server/startup-data";

export async function POST(req: Request) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string; idea?: string }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    const idea = String(body.idea || "").trim();

    if (!startupId || !idea) {
        return NextResponse.json(
            { error: { message: "startupId and idea are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }

    if (idea.length < 10 || idea.length > 4000) {
        return NextResponse.json(
            { error: { message: "Idea length must be between 10 and 4000 characters.", code: "request/invalid-idea" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = { startupId, ...access.startup } as any;
        const memories = await getStartupMemoryAdmin(startupId);

        const result = await validateIdea({ startup, memories: memories as any }, idea);

        if (!result.success || !result.structuredData) {
            throw new Error(result.error || "Failed to validate idea");
        }

        const validationResult = result.structuredData;

        await addStartupMemoryAdmin(startupId, "agent-output", "agent", JSON.stringify(validationResult));

        if (validationResult.scoring > 40) {
            await updateStartupStageAdmin(startupId, "idea_validated");
        }

        return NextResponse.json(validationResult);
    } catch (error: any) {
        console.error("Validation route error:", error);
        return NextResponse.json(
            { error: { message: error.message || "Failed to validate idea", code: "validate-idea/failed" } },
            { status: 500 }
        );
    }
}
