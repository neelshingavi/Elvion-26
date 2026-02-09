import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { addStartupMemory, updateStartupStage, getStartupMemory } from "@/lib/startup-service";
import { Startup } from "@/lib/types/founder";
import { validateIdea } from "@/lib/agents/agent-system";

export async function POST(req: Request) {
    try {
        const { startupId, idea, userId } = await req.json();

        if (!idea || !startupId || !userId) {
            return NextResponse.json(
                { error: "Missing required fields: idea, startupId, or userId" },
                { status: 400 }
            );
        }

        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = { startupId, ...startupSnap.data() } as Startup;
        const memories = await getStartupMemory(startupId);

        const result = await validateIdea({ startup, memories }, idea);

        if (!result.success || !result.structuredData) {
            throw new Error(result.error || "Failed to validate idea");
        }

        const validationResult = result.structuredData;

        // Persist to Startup Memory
        await addStartupMemory(startupId, "agent-output", "agent", JSON.stringify(validationResult));

        // Progress stage to planning if valid enough
        if (validationResult.scoring > 40) {
            await updateStartupStage(startupId, "idea_validated");
        }

        return NextResponse.json(validationResult);
    } catch (error: any) {
        console.error("Validation route error:", error);
        return NextResponse.json({ error: error.message || "Failed to validate idea" }, { status: 500 });
    }
}
