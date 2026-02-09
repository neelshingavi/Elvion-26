import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { generateTasks } from "@/lib/agents/agent-system";
import { getStartupMemory } from "@/lib/startup-service";
import { Startup } from "@/lib/types/founder";

export async function POST(req: Request) {
    try {
        const { startupId, idea, strategy } = await req.json();

        if (!startupId || (!idea && !strategy)) {
            return NextResponse.json(
                { error: "Missing startupId, idea, or strategy" },
                { status: 400 }
            );
        }

        const startupRef = doc(db, "startups", startupId);
        const startupSnap = await getDoc(startupRef);

        if (!startupSnap.exists()) {
            return NextResponse.json({ error: "Startup not found" }, { status: 404 });
        }

        const startup = { startupId, ...startupSnap.data() } as Startup;
        const memories = await getStartupMemory(startupId);

        const result = await generateTasks({ startup, memories }, strategy || idea);

        if (!result.success || !result.structuredData || !Array.isArray(result.structuredData.tasks)) {
            throw new Error(result.error || "Failed to generate tasks");
        }

        const tasks = result.structuredData.tasks;

        // Batch add to Firestore
        const results = await Promise.all(tasks.map((task: any) =>
            addDoc(collection(db, "tasks"), {
                startupId,
                title: task.title,
                description: task.description || "",
                priority: task.priority || "medium",
                reason: task.reason || "",
                status: "pending",
                createdByAgent: "Executor Agent",
                createdAt: serverTimestamp(),
            })
        ));

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error("Task generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate tasks" }, { status: 500 });
    }
}
