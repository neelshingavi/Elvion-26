import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { requireUser, requireStartupAccess, safeJson } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const body = await safeJson<{ taskId?: string; instruction?: string; startupId?: string }>(request);
    if (!body) {
        return NextResponse.json(
            { error: { message: "Invalid JSON payload.", code: "request/invalid-json" } },
            { status: 400 }
        );
    }

    const taskId = String(body.taskId || "");
    const instruction = String(body.instruction || "").trim();
    const startupId = String(body.startupId || "");

    if (!taskId || !instruction || !startupId) {
        return NextResponse.json(
            { error: { message: "taskId, instruction, and startupId are required.", code: "request/missing-fields" } },
            { status: 400 }
        );
    }
    if (instruction.length < 3 || instruction.length > 4000) {
        return NextResponse.json(
            { error: { message: "Instruction length must be between 3 and 4000 characters.", code: "request/invalid-instruction" } },
            { status: 400 }
        );
    }

    const access = await requireStartupAccess(startupId, auth.uid);
    if (!access.ok) return access.response;

    try {
        const db = await getAdminDb();
        const taskSnap = await db.collection("tasks").doc(taskId).get();
        if (!taskSnap.exists) {
            return NextResponse.json(
                { error: { message: "Task not found.", code: "task/not-found" } },
                { status: 404 }
            );
        }
        const taskData = taskSnap.data() || {};
        if (taskData.startupId !== startupId) {
            return NextResponse.json(
                { error: { message: "Task does not belong to this startup.", code: "task/invalid-startup" } },
                { status: 403 }
            );
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

        await db.collection("tasks").doc(taskId).update({
            aiResponse: text,
            status: "done",
            updatedAt: FieldValue.serverTimestamp(),
            completedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true, aiResponse: text });
    } catch (error: any) {
        console.error("Task execution error:", error);
        return NextResponse.json(
            { error: { message: error.message || "Failed to execute task", code: "execute-task/failed" } },
            { status: 500 }
        );
    }
}
