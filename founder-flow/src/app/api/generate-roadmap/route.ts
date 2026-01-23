import { NextResponse } from "next/server";
import { updateStartupStage, addStartupMemory } from "@/lib/startup-service";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { startupId, idea, context } = await req.json();

        const prompt = `
      You are the "Strategic Planning Agent" for FounderFlow.
      The user has a validated startup idea: "${idea}"
      Context from validation: ${context}

      Generate a detailed 3-phase strategic roadmap. 
      Return a JSON object with:
      1. phases: An array of 3 objects. Each object should have:
         - title: string (e.g., "Phase 1: MVP Development")
         - duration: string (e.g., "2-3 months")
         - description: string
         - milestones: array of 3 strings
      2. pros: array of 3 strategic advantages of this path.
      3. cons: array of 3 potential challenges or trade-offs.

      Format: JSON only.
    `;

        const roadmap = await callGemini(prompt);

        await updateStartupStage(startupId, "roadmap_created");
        await addStartupMemory(startupId, "agent-output", "agent", JSON.stringify(roadmap));

        return NextResponse.json(roadmap);
    } catch (error: any) {
        console.error("Roadmap generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
    }
}
