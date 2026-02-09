import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { updateStartupStage, addStartupMemory, getStartupMemory } from "@/lib/startup-service";
import { generateRoadmap } from "@/lib/agents/agent-system";
import { Startup } from "@/lib/types/founder";

export async function POST(req: Request) {
    try {
        const { startupId, idea, context } = await req.json();

        if (!startupId || !idea) {
            return NextResponse.json({ error: "Missing startupId or idea" }, { status: 400 });
        }

        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = { startupId, ...startupSnap.data() } as Startup;
        const memories = await getStartupMemory(startupId);

        const result = await generateRoadmap({ startup, memories, additionalContext: context }, idea);

        if (!result.success || !result.structuredData) {
            throw new Error(result.error || "Failed to generate roadmap");
        }

        const roadmap = result.structuredData;

        await updateStartupStage(startupId, "roadmap_created");
        await addStartupMemory(startupId, "agent-output", "agent", JSON.stringify(roadmap));

        return NextResponse.json(roadmap);
    } catch (error: any) {
        console.error("Roadmap generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate roadmap" }, { status: 500 });
    }
}
