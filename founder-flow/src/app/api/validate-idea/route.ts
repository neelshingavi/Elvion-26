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
      5. implementation_verdict: string ("Go for it", "Proceed with caution", or "Pivot needed")
      6. capital_required: string (e.g. "$50k - $100k for MVP")
      7. team_required: array of strings (e.g. ["Technical Co-founder", "Marketing Lead"])
      8. competitors: array of strings (existing solutions)
      9. existing_implementation: string (briefly mention if this exists elsewhere)
      
      Format: JSON only.
    `;

        const validationResult = await callGemini(prompt);

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
