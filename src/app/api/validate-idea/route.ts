import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { addStartupMemory, updateStartupStage } from "@/lib/startup-service";

export async function POST(req: Request) {
    try {
        const { idea, startupId, userId } = await req.json();

        const prompt = `
      You are the "Idea Validation Agent" for FounderFlow. 
      Analyze the following startup idea: "${idea}"

      CONTEXT: The target market is INDIA. All currency estimations must be in Indian Rupees (₹).
      CRITICAL INSTRUCTION: Be highly realistic and accurate with costs. Do not use generic ranges. Breakdown costs specifically for the Indian market context.

      Return a structured JSON response with:
      1. scoring: A numeric score from 1-100.
      2. summary: A 2-sentence summary of the potential.
      3. risks: An array of 3 key risks.
      4. suggestions: An array of 3 actionable next steps.
      5. implementation_verdict: string ("Go for it", "Proceed with caution", or "Pivot needed")
      6. capital_staging: Object with fields:
         - initial_funds: string (e.g. "₹X") - Bare minimum to start
         - registration_legal: string (e.g. "₹Y") - Cost to register Pvt Ltd/LLP in India
         - infrastructure_hardware: string (e.g. "₹Z") - Servers, Laptops, or Physical equipment
         - marketing_launch: string (e.g. "₹W") - Initial Go-to-market cost
      7. team_required: array of strings (e.g. ["Technical Co-founder", "Marketing Lead"])
      8. competitors: array of strings (existing solutions, especially in India)
      9. existing_implementation: string (briefly mention if this exists elsewhere)
      10. pros: An array of 3 potential benefits/strengths.
      11. cons: An array of 3 potential drawbacks/weaknesses.
      12. research_papers: An array of 3 objects { "title": "Paper Title", "url": "URL or search query" } related to the domain.
      13. market_size_india: string (Estimated TAM/SAM in India).
      14. score_improvement_plan: An array of 3 specific, high-impact changes to improve the viability score.
      
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
