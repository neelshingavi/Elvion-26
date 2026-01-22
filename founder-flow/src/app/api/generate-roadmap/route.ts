import { NextResponse } from "next/server";
import { updateStartupStage, addStartupMemory } from "@/lib/startup-service";

export async function POST(req: Request) {
    try {
        const { startupId, idea } = await req.json();

        // In a more complex agent flow, we would call Gemini here to generate specific milestones.
        // For now, we progress the stage and log the activity to memory.

        await updateStartupStage(startupId, "roadmap_created");
        await addStartupMemory(startupId, "decision", "agent", "Strategic Roadmap generated based on idea: " + idea);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Roadmap generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
    }
}
