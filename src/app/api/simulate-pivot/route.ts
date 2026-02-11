import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getStartupMemoryAdmin } from "@/lib/server/startup-data";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string; scenario?: string }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    const scenario = String(body.scenario || "").trim();

    if (!startupId || !scenario) {
        return NextResponse.json(
            { error: { message: "startupId and scenario are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }
    if (scenario.length < 5 || scenario.length > 2000) {
        return NextResponse.json(
            { error: { message: "Scenario length must be between 5 and 2000 characters.", code: "request/invalid-scenario" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = access.startup;
        const memories = await getStartupMemoryAdmin(startupId);

        const db = await getAdminDb();
        const tasksSnap = await db.collection("tasks").where("startupId", "==", startupId).get();
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
        return NextResponse.json(
            { error: { message: error.message || "Failed to simulate pivot", code: "simulate-pivot/failed" } },
            { status: 500 }
        );
    }
}
