import { Startup } from "./startup-service";

export type AgentType = "idea-validation" | "planning" | "execution" | "matching";

export const getNextRequiredAgent = (startup: Startup | null): AgentType => {
    if (!startup) return "idea-validation";

    switch (startup.stage) {
        case "validation":
            return "idea-validation";
        case "planning":
            return "planning";
        case "execution":
            return "execution";
        default:
            return "idea-validation";
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
        case "matching":
            return "Identify potential investors and team members from the ecosystem.";
    }
};
