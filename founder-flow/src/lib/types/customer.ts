export interface CustomerProfile {
    uid: string;
    email: string;
    displayName: string;
    preferences: {
        interests: string[]; // e.g., "AI", "HealthTech"
        betaTester: boolean;
    };
    joinedAt: any;
}

export interface CustomerEvent {
    id: string;
    customerId: string;
    startupId: string;
    eventType: "view_product" | "click_cta" | "feedback_submit" | "beta_signup";
    metadata?: Record<string, any>;
    timestamp: any;
}

export interface Feedback {
    id: string;
    customerId: string;
    startupId: string;
    type: "nps" | "bug" | "feature_request" | "general";
    content: string;
    rating?: number; // 1-10 for NPS
    sentimentScore?: number; // Calculated by AI
    createdAt: any;
}

export interface ProductDiscoveryItem {
    startupId: string;
    idea: string;
    stage: string;
    betaActive: boolean;
    incentive?: string; // e.g. "Free 1 year subscription"
}
