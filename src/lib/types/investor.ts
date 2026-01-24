export type DealStage = "new" | "review" | "due_diligence" | "term_sheet" | "invested" | "passed";

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

export type InvestorType = "ANGEL" | "VC" | "MICRO_VC" | "STRATEGIC";
export type AccessLevel = "METRICS_ONLY" | "METRICS_AND_UPDATES" | "FULL_READ";
export type AccessStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface Investor {
    uid: string;
    email: string;
    displayName: string;
    firmName?: string;
    investorType: InvestorType;
    createdAt: any;
    lastAccessedAt?: any;
}

export interface ProjectInvestorAccess {
    accessId: string;
    projectId: string;
    investorId: string;
    accessLevel: AccessLevel;
    accessStatus: AccessStatus;
    accessExpiryDate?: any;
    createdAt: any;
}

export interface ProjectMetric {
    metricId: string;
    projectId: string;
    metricName: string;
    metricValue: number;
    timePeriod: string; // e.g., "Weekly", "Oct 2023"
    createdAt: any;
}

export interface InvestorRiskAnalysis {
    analysisId: string;
    projectId: string;
    marketRisk: RiskFactor;
    executionRisk: RiskFactor;
    teamRisk: RiskFactor;
    productRisk: RiskFactor;
    generatedAt: any;
}

export interface RiskFactor {
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    evidence: string;
    mitigation: string;
}

export interface DecisionLog {
    decisionId: string;
    projectId: string;
    title: string;
    context: string;
    confidenceScore: number; // 0-100
    decisionDate: any;
    outcome?: string;
}

export interface InvestorUpdate {
    updateId: string;
    projectId: string;
    title: string;
    summary: string; // AI generated or Founder written
    content?: string;
    createdAt: any;
    isRead?: boolean;
}

export interface InvestorActivityLog {
    logId: string;
    investorId: string;
    projectId: string;
    actionType: "VIEW_DASHBOARD" | "VIEW_METRICS" | "VIEW_DOCS" | "EXPORT_REPORT";
    timestamp: any;
    ipAddress?: string;
}

export type InvestmentStage = "PRE_SEED" | "SEED" | "SERIES_A" | "SERIES_B";
export type PortfolioStatus = "ACTIVE" | "EXITED" | "WRITTEN_OFF";

export interface InvestorPortfolio {
    portfolioId: string;
    investorId: string;
    projectId: string;
    investmentStage: InvestmentStage;
    investmentDate: any;
    ownershipPercentage?: number;
    investmentAmount?: number;
    status: PortfolioStatus;
    createdAt: any;
}

export interface InvestorNote {
    noteId: string;
    investorId: string;
    projectId: string;
    noteContent: string;
    createdAt: any;
}

export interface PortfolioSummary {
    totalStartups: number;
    activeCount: number;
    healthScore: number;
    riskDistribution: {
        low: number;
        medium: number;
        high: number;
    };
    stageDistribution: Record<InvestmentStage, number>;
}
