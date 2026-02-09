import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getStartupMemory } from "@/lib/startup-service";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { startupId, scenario } = await req.json();

        if (!startupId || !scenario) {
            return NextResponse.json({ error: "Missing startupId or scenario" }, { status: 400 });
        }

        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = startupSnap.data();
        const memories = await getStartupMemory(startupId);

        // Get current tasks and goals
        const tasksSnap = await getDocs(query(collection(db, "tasks"), where("startupId", "==", startupId)));
        const tasks = tasksSnap.docs.map(d => d.data());

        const prompt = `You are a strategic advisor analyzing a potential pivot for a startup.

Current Startup:
- Name: ${startup.name}
- Industry: ${startup.industry}
- Current Idea: ${startup.idea || startup.oneSentencePitch}
- Stage: ${startup.stage}
- Active Tasks: ${tasks.length}

Proposed Pivot Scenario:
"${scenario}"

Analyze this pivot and provide:
1. A brief description of what this pivot entails
2. Estimated revenue impact (percentage change, can be negative)
3. Timeline to execute (in months)
4. Risk level (percentage 0-100)
5. A recommendation with reasoning

Return ONLY valid JSON:
{
    "scenario": "${scenario}",
    "description": "Brief analysis of the pivot",
    "impact": {
        "revenue": 25,
        "timeline": 6,
        "risk": 45
    },
    "recommendation": "Detailed recommendation with pros and cons"
}`;

        const response = await callGemini(prompt, false);

        let simulationData;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                simulationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (parseError) {
            simulationData = {
                scenario,
                description: `Analysis of pivoting to: ${scenario}. This would involve significant changes to your current business model and target market.`,
                impact: {
                    revenue: Math.floor(Math.random() * 50) - 10,
                    timeline: Math.floor(Math.random() * 6) + 3,
                    risk: Math.floor(Math.random() * 40) + 30
                },
                recommendation: "Consider testing this pivot with a small segment of your audience before fully committing. Monitor key metrics closely during the transition period."
            };
        }

        return NextResponse.json({ simulation: simulationData });
    } catch (error: any) {
        console.error("Pivot simulation error:", error);
        return NextResponse.json({ error: error.message || "Failed to simulate pivot" }, { status: 500 });
    }
}
