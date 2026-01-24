export interface InvestorProfile {
    uid: string;
    role: "investor_angel" | "investor_vc_analyst" | "investor_vc_partner" | "admin";
    email: string;
    displayName: string;
    organization?: string;
    thesis?: string;
    preferences: {
        sectors: string[];
        stages: string[];
        minTicketSize?: number;
        maxTicketSize?: number;
    };
    createdAt: any;
    updatedAt: any;
}

export type DealStage = "new" | "review" | "call" | "due_diligence" | "term_sheet" | "invested" | "passed";

export interface DealFlow {
    id: string;
    investorId: string;
    startupId: string;
    stage: DealStage;
    notes: string;
    lastInteraction: any;
    createdAt: any;
    updatedAt: any;
}

export interface ExecutionSignal {
    id: string;
    startupId: string;
    type: "decision_speed" | "execution_consistency" | "pivot_frequency" | "market_risk";
    score: number; // 0-100
    trend: "up" | "down" | "stable";
    reason: string;
    timestamp: any;
}

export interface StartupMetric {
    id: string;
    startupId: string;
    metricType: "revenue" | "users" | "burn_rate" | "runway_months";
    value: number;
    period: string; // e.g., "2023-Q3" or "2023-10"
    timestamp: any;
}
