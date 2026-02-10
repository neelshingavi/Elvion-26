import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getStartupMemory } from "@/lib/startup-service";
import { Startup } from "@/lib/types/founder";
import { executeAgent } from "@/lib/agents/agent-system";

export async function POST(req: Request) {
    try {
        const { startupId, message, userId, history = [] } = await req.json();

        if (!message || !startupId || !userId) {
            return NextResponse.json(
                { error: "Missing required fields: message, startupId, or userId" },
                { status: 400 }
            );
        }

        // 1. Get Startup Context
        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = { startupId, ...startupSnap.data() } as Startup;
        
        // 2. Get Memories for Context
        const memories = await getStartupMemory(startupId);

        // 3. Construct Chat History Context
        const historyContext = history.length > 0 
            ? "\nRECENT CHAT HISTORY:\n" + history.map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Founder' : 'Sidekick'}: ${h.content}`).join("\n") 
            : "";

        // 4. Execute Strategist Agent
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
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
