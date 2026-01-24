import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const { taskId, instruction, startupId } = await request.json();

        if (!taskId || !instruction) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prompt = `
            You are an elite AI Startup Assistant.
            
            USER INSTRUCTION: "${instruction}"
            
            YOUR GOAL: Perform the requested action professionally and thoroughly. 
            If you are asked for info, provide detailed data. 
            If you are asked for a report, format it beautifully with sections.
            If you are asked for a summary, be concise yet comprehensive.
            
            CONTEXT: This is for a startup with ID "${startupId}".
            
            RESPONSE FORMAT: Return your response in clear Markdown. Use bold headers, bullet points, and tables where appropriate to make it look professional.
        `;

        const text = await callGemini(prompt, false);

        // Update task in Firestore
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            aiResponse: text,
            status: "done",
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true, aiResponse: text });
    } catch (error: any) {
        console.error("Task execution error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
