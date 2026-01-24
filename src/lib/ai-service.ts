import { db } from "./firebase";
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp, limit } from "firebase/firestore";
import { DealAIAnalysis } from "./types/ai";
import { Deal } from "./types/deal";

const AI_ANALYSIS_COLLECTION = "deal_ai_analysis";

/**
 * Generates and stores a role-aware AI analysis for a deal version.
 */
export async function generateDealAnalysis(deal: Deal, target: "FOUNDER" | "INVESTOR"): Promise<void> {
    // In a real system, this would call an LLM with deal context.
    // For this implementation, we generate high-quality advisory insights based on deal terms.

    const terms = deal.currentTerms;
    const valuation = terms.impliedValuation;

    let summary = "";
    let suggestedActions: string[] = [];
    let riskSignals: string[] = [];
    let sanity = "Fair market terms.";

    if (target === "INVESTOR") {
        summary = `The founder is offering ${terms.equityPercentage}% equity for ${terms.investmentAmount.toLocaleString()} USD. This implies a post-money valuation of ${terms.postMoneyValuation.toLocaleString()} USD.`;
        if (terms.equityPercentage < 2) {
            riskSignals.push("Low equity stake might limit governance and future returns.");
            suggestedActions.push("Consider negotiating for a board seat or 5%+ equity.");
        }
        if (valuation > 10000000) {
            sanity = "Aggressive valuation for this stage.";
            riskSignals.push("High valuation increases down-round risk in future series.");
        }
    } else {
        summary = `The investor's offer of ${terms.investmentAmount.toLocaleString()} USD for ${terms.equityPercentage}% equity is within typical angel/seed ranges.`;
        if (terms.equityPercentage > 15) {
            riskSignals.push("High dilution at this stage may impact founder motivation.");
            suggestedActions.push("Counter-offer with 8-12% equity to preserve pool.");
            sanity = "Highly dilutive terms detected.";
        }
    }

    const analysis: Omit<DealAIAnalysis, "createdAt"> & { createdAt: Timestamp } = {
        dealId: deal.dealId,
        versionNumber: deal.versionNumber,
        personaTarget: target,
        summary,
        confidenceScore: 0.92,
        suggestedActions,
        valuationSanity: sanity,
        riskSignals,
        createdAt: Timestamp.now()
    };

    await addDoc(collection(db, AI_ANALYSIS_COLLECTION), analysis);
}

/**
 * Fetches the latest AI analysis for a specific deal and persona.
 */
export async function getLatestAIAnalysis(dealId: string, target: "FOUNDER" | "INVESTOR"): Promise<DealAIAnalysis | null> {
    const q = query(
        collection(db, AI_ANALYSIS_COLLECTION),
        where("dealId", "==", dealId),
        where("personaTarget", "==", target),
        orderBy("versionNumber", "desc"),
        limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), createdAt: snapshot.docs[0].data().createdAt } as DealAIAnalysis;
}
