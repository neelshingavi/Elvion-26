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

        const prompt = `You are an expert pitch deck creator. Generate a professional investor pitch deck for this startup.

Startup Details:
- Name: ${startup.name}
- Industry: ${startup.industry}
- Idea: ${startup.idea || startup.oneSentencePitch}
- Stage: ${startup.stage}
- Problem Statement: ${startup.problemStatement || "Not specified"}

Additional Context from Canvas:
${canvasContent.substring(0, 2000)}

Previous Work:
${memories.slice(0, 3).map((m: any) => m.content.substring(0, 300)).join("\n")}

Generate a 7-slide pitch deck with the following structure. For each slide, provide 3-4 bullet points of real content (not placeholders).

Return ONLY valid JSON:
{
    "slides": [
        { "id": "s1", "type": "title", "title": "Company Name", "content": ["One-line pitch", "Key tagline"] },
        { "id": "s2", "type": "problem", "title": "The Problem", "content": ["Pain point 1", "Pain point 2", "Current solution issues"] },
        { "id": "s3", "type": "solution", "title": "Our Solution", "content": ["Solution overview", "Key feature 1", "Key feature 2"] },
        { "id": "s4", "type": "market", "title": "Market Opportunity", "content": ["TAM estimation", "SAM estimation", "SOM estimation"] },
        { "id": "s5", "type": "traction", "title": "Traction", "content": ["Key metrics", "Growth indicators", "Milestones"] },
        { "id": "s6", "type": "team", "title": "The Team", "content": ["Founder backgrounds", "Key expertise", "Advisory support"] },
        { "id": "s7", "type": "ask", "title": "The Ask", "content": ["Funding amount", "Use of funds breakdown", "Expected runway"] }
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
