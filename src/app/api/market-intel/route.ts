import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { executeAgent } from "@/lib/agents/agent-system";
import { Startup } from "@/lib/types/founder";

export async function POST(req: NextRequest) {
    try {
        const { startupId, userId } = await req.json();

        if (!startupId || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch Startup Context
        const startupDoc = await getDoc(doc(db, "startups", startupId));
        if (!startupDoc.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }
        const startup = startupDoc.data() as Startup;

        // 2. Construct Prompt
        const prompt = `
            Analyze the market for this startup:
            
            Name: ${startup.name}
            One-Liner: ${startup.oneSentencePitch}
            Industry: ${startup.industry}
            Target Audience: ${startup.targetDemographic}
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
            additionalContext: `User ID: ${userId}`
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
        await setDoc(doc(db, "marketIntel", startupId), {
            ...data,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        // 6. Return Data
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error("Market Intel API Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
