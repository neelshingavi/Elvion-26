import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { addStartupMemory, updateStartupStage } from "@/lib/startup-service";

export async function POST(req: Request) {
    try {
        const { idea, startupId, userId } = await req.json();

        const prompt = `
      You are the "Idea Validation Agent" for FounderFlow. 
      Analyze the following startup idea: "${idea}"
      
      Return a structured JSON response with:
      1. scoring: A numeric score from 1-100.
      2. summary: A 2-sentence summary of the potential.
      3. risks: An array of 3 key risks.
      4. suggestions: An array of 3 actionable next steps.
      
      Format: JSON only.
    `;

        const validationResult = await callGemini(prompt);

        // Persist to Startup Memory
        await addStartupMemory(startupId, "agent-output", JSON.stringify(validationResult));

        // Progress stage to planning if valid enough
        if (validationResult.scoring > 40) {
            await updateStartupStage(startupId, "planning");
        }

        return NextResponse.json(validationResult);
    } catch (error) {
        console.error("Validation route error:", error);
        return NextResponse.json({ error: "Failed to validate idea" }, { status: 500 });
    }
}
