import { Timestamp } from "firebase/firestore";

/**
 * AI Deal Analysis stored per version or per deal.
 */
export interface DealAIAnalysis {
    dealId: string;
    versionNumber: number;
    personaTarget: "FOUNDER" | "INVESTOR";
    summary: string;
    confidenceScore: number;
    suggestedActions: string[];
    valuationSanity: string;
    riskSignals: string[];
    createdAt: Timestamp;
}
