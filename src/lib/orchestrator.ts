import { Startup } from "./startup-service";

export type AgentType = "idea-validation" | "planning" | "execution" | "networking";

export interface PrimaryAction {
    label: string;
    description: string;
    agentType: AgentType;
    icon: string;
}

export const getNextRequiredAgent = (startup: Startup | null): AgentType => {
    if (!startup) return "idea-validation";

    switch (startup.stage) {
        case "idea_submitted":
            return "idea-validation";
        case "idea_validated":
            return "planning";
        case "roadmap_created":
            return "execution";
        case "execution_active":
            return "networking";
        default:
            return "idea-validation";
    }
};

export const getPrimaryAction = (startup: Startup | null): PrimaryAction => {
    if (!startup) {
        return {
            label: "Validate Your Idea",
            description: "Start the engine by letting our agents stress-test your core premise.",
            agentType: "idea-validation",
            icon: "Rocket"
        };
    }

    switch (startup.stage) {
        case "idea_submitted":
            return {
                label: "Validate Your Idea",
                description: "Agents are ready to analyze your submission for market fit.",
                agentType: "idea-validation",
                icon: "Zap"
            };
        case "idea_validated":
            return {
                label: "Generate Roadmap",
                description: "Your idea is solid. Let's draft a strategic execution plan.",
                agentType: "planning",
                icon: "Target"
            };
        case "roadmap_created":
            return {
                label: "Activate Execution",
                description: "Roadmap is ready. Deploy tasks to your board.",
                agentType: "execution",
                icon: "Rocket"
            };
        case "execution_active":
            return {
                label: "Connect with Founders",
                description: "Ecosystem active. Network with other founders to grow together.",
                agentType: "networking",
                icon: "Users"
            };
        default:
            return {
                label: "Continue Journey",
                description: "Checking next steps with your agents...",
                agentType: "idea-validation",
                icon: "Zap"
            };
    }
};

export const getAgentInstructions = (agent: AgentType) => {
    switch (agent) {
        case "idea-validation":
            return "Review the startup's core premise and provide a validation score.";
        case "planning":
            return "Generate a strategic roadmap with 4 distinct phases based on the validated idea.";
        case "execution":
            return "Deconstruct the current phase into actionable tasks for the founder.";
        case "networking":
            return "Connect with other founders in the ecosystem for collaboration and growth.";
    }
};
