import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startupId, idea } = body;

        if (!startupId || !idea) {
            return NextResponse.json(
                { error: "Missing startupId or idea" },
                { status: 400 }
            );
        }

        const prompt = `
      You are the "Execution Agent" for FounderFlow. 
      Generate 4 immediate atomic tasks to start building this idea: "${idea}"
      
      Return a structured JSON array of objects with:
      1. title: Short task title.
      2. priority: "high", "medium", or "low".
      3. reason: Why this task is important.
      
      Format: JSON array only.
    `;

        const tasks = await callGemini(prompt);

        if (!Array.isArray(tasks)) {
            throw new Error("Invalid AI response format");
        }

        // Batch add to Firestore
        const results = await Promise.all(tasks.map((task: any) =>
            addDoc(collection(db, "tasks"), {
                startupId,
                title: task.title,
                priority: task.priority,
                reason: task.reason,
                status: "pending",
                createdByAgent: "Execution Agent",
                createdAt: serverTimestamp(),
            })
        ));

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error("Task generation error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate tasks" }, { status: 500 });
    }
}
