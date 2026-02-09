import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { addStartupMemory, getStartupMemory } from "@/lib/startup-service";
import { Startup } from "@/lib/types/founder";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { startupId, founderBackground, problemStatement, targetDemographic, industry, idea } = await req.json();

        if (!startupId) {
            return NextResponse.json(
                { error: "Missing required field: startupId" },
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

        // Build context for AI
        const context = `
Startup Context:
- Name: ${startup.name}
- Industry: ${industry || startup.industry}
- Idea: ${idea || startup.idea || startup.oneSentencePitch}
- Problem Statement: ${problemStatement || startup.problemStatement || "Not specified"}
- Target Demographic: ${targetDemographic || "Not specified"}
- Founder Background: ${founderBackground || "Not specified"}

Previous Context:
${memories.slice(0, 5).map(m => `- ${m.type}: ${m.content.substring(0, 200)}`).join("\n")}
`;

        const prompt = `You are the Planner Agent for an AI-powered startup operating system. Generate a comprehensive "First 48 Hours" action plan for this startup founder.

${context}

Generate a structured plan with exactly 6-8 high-priority tasks that the founder should complete in the first 48 hours. These should be actionable, specific, and designed to validate the core idea and set up initial execution.

For each task, provide:
1. A clear, actionable title
2. A detailed instruction that tells the founder exactly what to do
3. Priority level (high, medium, low)
4. Estimated time in hours
5. The agent type that will help execute this (strategist, researcher, critic, executor, planner, validator)

Focus on:
- Customer discovery and validation
- Market research specific to India
- Initial MVP scoping
- Competitor analysis
- Problem validation
- Building initial documentation

Return ONLY valid JSON in this exact format:
{
    "planTitle": "Your First 48 Hours: [Startup Name] Launch Sprint",
    "summary": "Brief 2-3 sentence summary of the plan's focus",
    "tasks": [
        {
            "title": "Task title",
            "instruction": "Detailed instruction for the AI agent to execute",
            "priority": "high|medium|low",
            "estimatedHours": 2,
            "agentType": "strategist|researcher|critic|executor|planner|validator",
            "category": "validation|research|planning|execution"
        }
    ],
    "weeklyMilestone": "What the founder should achieve by end of week 1",
    "criticalAssumptions": ["List of 3 key assumptions to validate"]
}`;

        const response = await callGemini(prompt, false);

        // Parse the response
        let planData;
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                planData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Fallback to a structured default
            planData = {
                planTitle: `Your First 48 Hours: ${startup.name} Launch Sprint`,
                summary: "A focused sprint to validate your core assumptions and set up execution foundations.",
                tasks: [
                    {
                        title: "Customer Problem Interview Script",
                        instruction: `Create a structured interview script to validate the problem: "${idea || startup.idea}". Include 10 open-ended questions focusing on pain points, current solutions, and willingness to pay.`,
                        priority: "high",
                        estimatedHours: 1,
                        agentType: "researcher",
                        category: "validation"
                    },
                    {
                        title: "Competitive Landscape Analysis",
                        instruction: `Research and analyze the top 5 competitors in the ${industry || startup.industry} space in India. Document their pricing, features, strengths, and weaknesses.`,
                        priority: "high",
                        estimatedHours: 2,
                        agentType: "researcher",
                        category: "research"
                    },
                    {
                        title: "Define Core Value Proposition",
                        instruction: "Draft a clear value proposition canvas identifying customer jobs, pains, gains, and how your solution addresses each.",
                        priority: "high",
                        estimatedHours: 1,
                        agentType: "strategist",
                        category: "planning"
                    },
                    {
                        title: "MVP Feature Prioritization",
                        instruction: "Create a prioritized list of features for your MVP using the RICE framework (Reach, Impact, Confidence, Effort).",
                        priority: "medium",
                        estimatedHours: 2,
                        agentType: "planner",
                        category: "planning"
                    },
                    {
                        title: "Initial Market Size Estimation",
                        instruction: `Calculate TAM, SAM, and SOM for ${industry || startup.industry} in India with data sources and assumptions clearly documented.`,
                        priority: "medium",
                        estimatedHours: 2,
                        agentType: "researcher",
                        category: "research"
                    },
                    {
                        title: "Regulatory Compliance Check",
                        instruction: `Identify key regulatory requirements for operating in the ${industry || startup.industry} sector in India.`,
                        priority: "medium",
                        estimatedHours: 1,
                        agentType: "validator",
                        category: "validation"
                    }
                ],
                weeklyMilestone: "Complete 5 customer interviews and validate primary problem hypothesis",
                criticalAssumptions: [
                    "Target customers experience this problem frequently",
                    "Customers are willing to pay for a solution",
                    "The market size is large enough to build a venture-scale business"
                ]
            };
        }

        // Create tasks in Firestore
        const tasksRef = collection(db, "tasks");
        const createdTasks = [];

        for (const task of planData.tasks) {
            const taskDoc = await addDoc(tasksRef, {
                startupId,
                title: task.title,
                instruction: task.instruction,
                priority: task.priority,
                estimatedHours: task.estimatedHours,
                agentType: task.agentType,
                category: task.category,
                status: "pending",
                reason: "Generated by First 48 Hours Plan",
                createdByAgent: "Planner",
                createdAt: serverTimestamp()
            });
            createdTasks.push({ id: taskDoc.id, ...task });
        }

        // Save plan to memory
        await addStartupMemory(
            startupId,
            "agent-output",
            "agent",
            JSON.stringify({
                type: "first-48-hours-plan",
                ...planData,
                generatedAt: new Date().toISOString(),
                taskIds: createdTasks.map(t => t.id)
            })
        );

        return NextResponse.json({
            success: true,
            plan: planData,
            tasks: createdTasks
        });

    } catch (error: any) {
        console.error("First 48 Hours generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate First 48 Hours plan" },
            { status: 500 }
        );
    }
}
