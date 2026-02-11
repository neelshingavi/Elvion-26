import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getStartupMemoryAdmin } from "@/lib/server/startup-data";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
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
        const db = await getAdminDb();
        const startup = access.startup;
        const memories = await getStartupMemoryAdmin(startupId);

        const canvasDoc = await db.collection("canvases").doc(`${startupId}_main`).get();
        const canvasContent = canvasDoc.exists ? (canvasDoc.data()?.blocks || []).map((b: any) => b.content).join("\n") : "";

        const prompt = `You are a Tier-1 Venture Capital Pitch Strategist. Generate a fundable, psychological, investor-grade pitch deck for this startup.

Startup Details:
- Name: ${startup.name}
- Industry: ${startup.industry}
- Stage: ${startup.stage}
- Concept: ${startup.idea || startup.oneSentencePitch}
- Problem: ${startup.problemStatement || "Not specified"}

Context:
${canvasContent.substring(0, 2000)}

Memories:
${memories.slice(0, 3).map((m: any) => m.content.substring(0, 300)).join("\n")}

Strict Rules:
- 12 Slides exactly.
- No fluff ("Revolutionary", "Disruptive"). Use data-backed claims.
- Bottom-up market sizing only.
- Focus on "Inevitability" and "Unfair Advantage".

Return ONLY valid JSON with this exact structure:
{
    "slides": [
        { "id": "s1", "type": "vision", "title": "The Vision", "content": ["One-line category defining statement", "Clear customer identification"] },
        { "id": "s2", "type": "problem", "title": "The Problem", "content": ["The broken status quo", "Quantified pain point", "Why current solutions fail"] },
        { "id": "s3", "type": "solution", "title": "The Solution", "content": ["High-level value prop", "The 'Aha' moment", "Outcome (Speed/Cost/Quality)"] },
        { "id": "s4", "type": "whynow", "title": "Why Now", "content": ["Regulatory/Tech/Behavioral shift", "Why this wasn't possible 5 years ago"] },
        { "id": "s5", "type": "market", "title": "Market Size", "content": ["TAM (Total Addressable)", "SAM (Serviceable)", "SOM (Obtainable - 3 yrs)"] },
        { "id": "s6", "type": "product", "title": "The Product", "content": ["Core workflow", "Defensible moat", "Secret sauce"] },
        { "id": "s7", "type": "traction", "title": "Traction", "content": ["Revenue/Users metrics", "Growth rate", "Key partnerships/LOIs"] },
        { "id": "s8", "type": "business_model", "title": "Business Model", "content": ["Revenue streams", "Pricing logic", "Unit economics (LTV/CAC)"] },
        { "id": "s9", "type": "competition", "title": "Competition", "content": ["Competitor 1 vs Us", "Competitor 2 vs Us", "Our unfair advantage"] },
        { "id": "s10", "type": "gtm", "title": "Go-To-Market", "content": ["Acquisition channels", "Distribution strategy", "First 10k users plan"] },
        { "id": "s11", "type": "team", "title": "The Team", "content": ["CEO superpower", "CTO superpower", "Why this team wins"] },
        { "id": "s12", "type": "ask", "title": "The Ask", "content": ["Raise amount", "Runway length", "Key milestones to hit"] }
    ]
}`;

        const response = await callGemini(prompt, false);

        let deckData;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                deckData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found");
            }
        } catch (parseError) {
            // Fallback deck
            deckData = {
                slides: [
                    { id: "s1", type: "title", title: startup.name, content: [startup.oneSentencePitch || "Transforming an industry"] },
                    { id: "s2", type: "problem", title: "The Problem", content: ["Key pain point in the market", "Current solutions are inadequate", "Growing demand for better alternatives"] },
                    { id: "s3", type: "solution", title: "Our Solution", content: ["Innovative approach using modern technology", "User-centric design", "Scalable architecture"] },
                    { id: "s4", type: "market", title: "Market Opportunity", content: ["Large and growing TAM", "Focused SAM for initial traction", "Achievable SOM targets"] },
                    { id: "s5", type: "traction", title: "Traction", content: ["Early user validation", "Key partnership discussions", "Development milestones achieved"] },
                    { id: "s6", type: "team", title: "The Team", content: ["Experienced founding team", "Domain expertise", "Complementary skill sets"] },
                    { id: "s7", type: "ask", title: "The Ask", content: ["Seed funding round", "18-month runway target", "Focus on product and growth"] }
                ]
            };
        }

        // Save to Firestore
        await db.collection("pitchDecks").doc(startupId).set({
            ...deckData,
            startupId,
            generatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        return NextResponse.json(deckData);
    } catch (error: any) {
        console.error("Pitch deck generation error:", error);
        return NextResponse.json(
            { error: { message: error.message || "Failed to generate pitch deck", code: "pitch-deck/failed" } },
            { status: 500 }
        );
    }
}
