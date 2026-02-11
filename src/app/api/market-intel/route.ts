import { NextRequest, NextResponse } from "next/server";
import { executeAgent } from "@/lib/agents/agent-system";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ startupId?: string }>(req);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const startupId = String(body.startupId || "");
    if (!startupId) {
        return NextResponse.json(
            { error: { message: "startupId is required.", code: "request/missing-startup" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const startup = access.startup as any;

        // 2. Construct Prompt
        const prompt = `
            Analyze the market for this startup:
            
            Name: ${startup.name}
            One-Liner: ${startup.oneSentencePitch}
            Industry: ${startup.industry}
            Target Audience: ${startup.targetDemographic || "Not specified"}
            Description: ${startup.idea}

            Generate a comprehensive market intelligence report in JSON format with the following 3 sections:

            1. "pulse": MarketPulse object
               - "overallSentiment": number (-100 to 100)
               - "trendingTopics": string[] (3-5 items)
               - "fundingActivity": { "totalDeals": number, "totalAmount": string (e.g. "₹X Cr"), "change": number }
               - "trends": { "keyword": string, "volume": number, "trend": "up"|"stable"|"down", "relevanceScore": number, "change": number }[]

            2. "competitors": Competitor[] (Generate 3-5 REAL or Realistic Indian competitors)
               - "id": string (unique)
               - "name": string
               - "website": string
               - "description": string
               - "pricing": string[]
               - "features": string[]
               - "lastFunding": { "amount": string, "round": string, "date": string (ISO), "investors": string[] } (Optional)
               - "alerts": [] (Empty array)

            3. "regulatory": RegulatoryUpdate[] (3-4 RELEVANT Indian regulations)
               - "id": string
               - "title": string
               - "summary": string
               - "impact": "high"|"medium"|"low"
               - "source": string (e.g. "RBI", "SEBI", "MeitY")
               - "date": string (ISO)
               - "category": string

            Ensure all data is specific to the Indian market context.
            Return ONLY raw JSON. No code blocks.
        `;

        // 3. Execute Agent
        const result = await executeAgent("market_analyst", prompt, {
            startup,
            additionalContext: `User ID: ${auth.uid}`
        });

        if (!result.success) {
            throw new Error(result.error || "Agent execution failed");
        }

        // 4. Parse & Validate
        let data;
        try {
             // Clean potential markdown code blocks if any
            const cleanJson = result.output.replace(/```json\n?|\n?```/g, "").trim();
            data = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse agent output:", result.output, e);
            return NextResponse.json({ error: "Failed to generate valid data" }, { status: 500 });
        }

        // 5. Save to Firestore
        // We save it as a "marketIntel" document keyed by startupId, acting as a cache/state
        const db = await getAdminDb();
        await db.collection("marketIntel").doc(startupId).set({
            ...data,
            startupId,
            lastUpdated: FieldValue.serverTimestamp()
        }, { merge: true });

        // 6. Return Data
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error("Market Intel API Error:", error);
        return NextResponse.json(
            { error: { message: error instanceof Error ? error.message : "Internal Server Error", code: "market-intel/failed" } },
            { status: 500 }
        );
    }
}
