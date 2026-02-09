/**
 * FounderFlow AI Agent System
 * Implements the multi-agent architecture with specialized AI co-founders
 */

import { callGemini } from "../gemini";
import {
    AgentType,
    AgentRun,
    AgentRunStatus,
    AgentState,
    Startup,
    StartupMemory,
    Task
} from "../types/founder";

// ============================================
// AGENT CONFIGURATION
// ============================================

interface AgentConfig {
    name: string;
    description: string;
    systemPrompt: string;
    capabilities: string[];
    maxTokens: number;
    temperature: number;
}

export const AGENT_CONFIGS: Partial<Record<AgentType, AgentConfig>> = {
    executor: {
        name: "Executor Agent",
        description: "Converts strategy into actionable tasks and operational content",
        systemPrompt: `You are an execution specialist for a startup founder. Your role is to:
- Break down strategic initiatives into concrete, actionable tasks
- Draft operational content (emails, documents, pitches)
- Create checklists and workflows
- Estimate time and resource requirements
- Prioritize tasks based on impact and urgency

Be extremely specific and practical. Every output should be immediately actionable.
Include time estimates and dependencies where relevant.`,
        capabilities: ["task_generation", "content_drafting", "workflow_creation", "prioritization"],
        maxTokens: 3000,
        temperature: 0.4
    },

    validator: {
        name: "Validator Agent",
        description: "Validates startup ideas with comprehensive India-focused analysis",
        systemPrompt: `You are an idea validation specialist for Indian startups. Your role is to:
- Score ideas on viability (0-100 scale)
- Analyze market size with India-specific data
- Identify competitors in the Indian market
- Evaluate regulatory requirements in India
- Assess capital requirements in INR
- Suggest team composition

Provide structured output with:
- Viability Score (0-100)
- Executive Summary
- Market Analysis (India-focused)
- Competitor Landscape
- Capital Requirements (in INR)
- Team Requirements
- Key Risks
- Actionable Improvements`,
        capabilities: ["idea_scoring", "market_validation", "competitor_identification", "feasibility_analysis"],
        maxTokens: 4000,
        temperature: 0.4
    },

    planner: {
        name: "Planner Agent",
        description: "Generates strategic roadmaps with milestones and dependencies",
        systemPrompt: `You are a roadmap planning specialist for startups. Your role is to:
- Create phased execution roadmaps
- Define clear milestones with success criteria
- Map dependencies between goals
- Allocate realistic timeframes
- Consider resource constraints

Structure roadmaps in phases:
Phase 1: Foundation (0-3 months)
Phase 2: Validation (3-6 months)
Phase 3: Growth (6-12 months)
Phase 4: Scale (12+ months)

Each phase should have: Goals, Milestones, Key Tasks, Success Metrics`,
        capabilities: ["roadmap_generation", "milestone_definition", "dependency_mapping", "timeline_estimation"],
        maxTokens: 4000,
        temperature: 0.5
    }
};

// ============================================
// AGENT EXECUTION ENGINE
// ============================================

export interface AgentExecutionContext {
    startup: Startup;
    memories?: StartupMemory[];
    tasks?: Task[];
    additionalContext?: string;
}

export interface AgentExecutionResult {
    success: boolean;
    output: string;
    structuredData?: Record<string, any>;
    tokensUsed?: number;
    executionTime: number;
    error?: string;
}

/**
 * Execute an agent with the given context
 */
export async function executeAgent(
    agentType: AgentType,
    userPrompt: string,
    context: AgentExecutionContext
): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const config = AGENT_CONFIGS[agentType];

    if (!config) {
        return {
            success: false,
            output: "",
            executionTime: Date.now() - startTime,
            error: `Unknown agent type: ${agentType}`
        };
    }

    try {
        // Build context string
        const contextString = buildContextString(context);

        // Construct full prompt
        const fullPrompt = `
${config.systemPrompt}

---
STARTUP CONTEXT:
Name: ${context.startup.name}
Stage: ${context.startup.stage}
Industry: ${context.startup.industry}
Idea: ${context.startup.idea}
${context.startup.oneSentencePitch ? `Pitch: ${context.startup.oneSentencePitch}` : ""}
${context.startup.targetDemographic ? `Target Demographic: ${context.startup.targetDemographic}` : ""}
${context.startup.vision ? `Vision: ${context.startup.vision}` : ""}
${context.startup.problemStatement ? `Problem: ${context.startup.problemStatement}` : ""}

${contextString}
---

USER REQUEST:
${userPrompt}

Provide a comprehensive, actionable response:`;

        // Call AI
        const response = await callGemini(fullPrompt, false);

        return {
            success: true,
            output: response,
            executionTime: Date.now() - startTime
        };

    } catch (error: any) {
        console.error(`Agent ${agentType} execution failed:`, error);
        return {
            success: false,
            output: "",
            executionTime: Date.now() - startTime,
            error: error.message || "Agent execution failed"
        };
    }
}

/**
 * Build context string from available data
 */
function buildContextString(context: AgentExecutionContext): string {
    const parts: string[] = [];

    // Add memories
    if (context.memories && context.memories.length > 0) {
        parts.push("MEMORY CONTEXT:");
        context.memories.slice(0, 10).forEach(m => {
            parts.push(`- [${m.type}] ${m.content.substring(0, 200)}...`);
        });
    }

    // Add tasks
    if (context.tasks && context.tasks.length > 0) {
        parts.push("\nRECENT TASKS:");
        context.tasks.slice(0, 5).forEach(t => {
            parts.push(`- [${t.status}] ${t.title}`);
        });
    }

    // Add additional context
    if (context.additionalContext) {
        parts.push("\nADDITIONAL CONTEXT:");
        parts.push(context.additionalContext);
    }

    return parts.join("\n");
}

// ============================================
// SPECIALIZED AGENT FUNCTIONS
// ============================================

/**
 * Executor: Generate actionable tasks from a strategy
 */
export async function generateTasks(
    context: AgentExecutionContext,
    strategy: string
): Promise<AgentExecutionResult> {
    const prompt = `
Convert this strategic initiative into actionable tasks:

"${strategy}"

Return a JSON array of objects. Each object should have:
- "title": (clear, action-oriented)
- "description": (specific deliverable)
- "priority": ("critical" | "high" | "medium" | "low")
- "reason": "Why this task is important"

Generate 5-10 tasks ordered by priority.
IMPORTANT: Return ONLY valid JSON.
`;

    const result = await executeAgent("executor", prompt, context);
    if (result.success) {
        try {
            const jsonMatch = result.output.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                result.structuredData = { tasks: JSON.parse(jsonMatch[0]) };
            }
        } catch (e) {
            console.error("Failed to parse tasks JSON:", e);
        }
    }
    return result;
}

/**
 * Validator: Score and analyze an idea
 */
export async function validateIdea(
    context: AgentExecutionContext,
    idea: string
): Promise<AgentExecutionResult> {
    const prompt = `
Provide a comprehensive validation analysis for this startup idea:

"${idea}"

Industry Context: ${context.startup.industry}
Target Market: India-focused with demographic segment: ${context.startup.targetDemographic || "General"}

Provide structured JSON output with the following keys:
1. "scoring": number (0-100)
2. "implementation_verdict": string ("Go for it", "Proceed with caution", or "Pivot needed")
3. "summary": string (2-3 sentences)
4. "market_size_india": string (Estimated TAM/SAM in India)
5. "capital_staging": {
      "initial_funds": "₹X",
      "registration_legal": "₹X",
      "infrastructure_hardware": "₹X",
      "marketing_launch": "₹X"
   }
6. "team_required": string[] (List of roles)
7. "competitors": string[] (List of key competitors in India)
8. "pros": string[] (3 main strengths)
9. "cons": string[] (3 main weaknesses)
10. "risks": string[] (3 main risks)
11. "suggestions": string[] (3 high-level next steps)
12. "score_improvement_plan": string[] (5 specific actions to increase viability)
13. "research_papers": [{"title": "...", "url": "..."}] (Optional)

IMPORTANT: Return ONLY valid JSON.
`;

    const result = await executeAgent("validator", prompt, context);
    if (result.success) {
        try {
            const jsonMatch = result.output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result.structuredData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("Failed to parse validator JSON:", e);
        }
    }
    return result;
}

/**
 * Planner: Generate a strategic roadmap
 */
export async function generateRoadmap(
    context: AgentExecutionContext,
    objectives: string
): Promise<AgentExecutionResult> {
    const prompt = `
Generate a comprehensive strategic roadmap for:

"${objectives}"

Structure the roadmap exactly as a JSON object with a "roadmap" key. 
The "roadmap" object should have 4 keys: "foundation", "validation", "growth", "scale".
Each phase should contain a "goals" array.
Each goal should have:
- "id": string (unique)
- "title": string
- "description": string
- "targetDate": string (ISO date string)
- "status": "active"
- "progress": number (0)
- "milestones": array of objects:
  - "id": string
  - "title": string
  - "targetDate": string
  - "status": "pending"
  - "dependsOn": []

IMPORTANT: Return ONLY valid JSON.
`;

    const result = await executeAgent("planner", prompt, context);
    if (result.success) {
        try {
            const jsonMatch = result.output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result.structuredData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("Failed to parse planner JSON:", e);
        }
    }
    return result;
}

// ============================================
// AGENT STATE MANAGEMENT
// ============================================

const agentStates: Map<string, AgentState[]> = new Map();

export function getAgentStates(startupId: string): AgentState[] {
    if (!agentStates.has(startupId)) {
        // Initialize with default states
        const defaultStates: AgentState[] = Object.keys(AGENT_CONFIGS).map(type => ({
            agentType: type as AgentType,
            isActive: false,
            queuedTasks: 0
        }));
        agentStates.set(startupId, defaultStates);
    }
    return agentStates.get(startupId)!;
}

export function updateAgentState(
    startupId: string,
    agentType: AgentType,
    updates: Partial<AgentState>
): void {
    const states = getAgentStates(startupId);
    const index = states.findIndex(s => s.agentType === agentType);
    if (index >= 0) {
        states[index] = { ...states[index], ...updates };
    }
}
