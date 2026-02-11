import { NextResponse } from "next/server";
import { executeAgent } from "@/lib/agents/agent-system";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getStartupMemoryAdmin } from "@/lib/server/startup-data";

export async function POST(req: Request) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string; message?: string; history?: any[] }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message || !startupId) {
        return NextResponse.json(
            { error: { message: "startupId and message are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }
    if (message.length < 2 || message.length > 4000) {
        return NextResponse.json(
            { error: { message: "Message length must be between 2 and 4000 characters.", code: "request/invalid-message" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = { startupId, ...access.startup } as any;
        const memories = await getStartupMemoryAdmin(startupId);

        const historyContext = history.length > 0
            ? "\nRECENT CHAT HISTORY:\n" + history.map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Founder' : 'Sidekick'}: ${h.content}`).join("\n")
            : "";

        const result = await executeAgent("strategist", message, {
            startup,
            memories,
            additionalContext: historyContext
        });

        if (!result.success) {
            throw new Error(result.error || "Failed to get sidekick response");
        }

        return NextResponse.json({
            response: result.output,
            executionTime: result.executionTime
        });
    } catch (error: unknown) {
        console.error("Sidekick route error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process request";
        return NextResponse.json(
            { error: { message: errorMessage, code: "sidekick/failed" } },
            { status: 500 }
        );
    }
}
