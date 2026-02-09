import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { getStartupMemory } from "@/lib/startup-service";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { startupId } = await req.json();

        if (!startupId) {
            return NextResponse.json({ error: "Missing startupId" }, { status: 400 });
        }

        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = startupSnap.data();
        const memories = await getStartupMemory(startupId);

        // Get canvas content if available
        const canvasDoc = await getDoc(doc(db, "canvases", startupId));
        const canvasContent = canvasDoc.exists() ? canvasDoc.data().blocks?.map((b: any) => b.content).join("\n") : "";

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
        await setDoc(doc(db, "pitchDecks", startupId), {
            ...deckData,
            generatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return NextResponse.json(deckData);
    } catch (error: any) {
        console.error("Pitch deck generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate pitch deck" }, { status: 500 });
    }
}
