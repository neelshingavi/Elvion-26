import { Timestamp } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════════════════
// DEAL FLOW STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deal lifecycle states.
 * PROPOSED → COUNTERED/NEGOTIATING → ACCEPTED → LOCKED
 */
export type DealStatus =
    | "PROPOSED"    // Initial offer/ask awaiting response
    | "COUNTERED"   // Other party modified terms
    | "NEGOTIATING" // Active back-and-forth (multiple counters)
    | "ACCEPTED"    // Both parties agreed on terms
    | "LOCKED"      // Deal finalized, immutable
    | "EXPIRED"     // Deal expired without action
    | "DECLINED";   // Other party declined

/**
 * Who initiated the deal.
 */
export type DealInitiator = "FOUNDER" | "INVESTOR";

/**
 * Investment instrument types.
 */
export type InstrumentType = "EQUITY" | "SAFE" | "CONVERTIBLE_NOTE";

/**
 * Audit log action types.
 */
export type DealAction =
    | "CREATED"
    | "PROPOSED"
    | "COUNTERED"
    | "ACCEPTED"
    | "LOCKED"
    | "DECLINED"
    | "EXPIRED"
    | "VIEWED";

/**
 * Validity duration options (in days).
 */
export type ValidityDuration = 7 | 14 | 30 | 60;

// ═══════════════════════════════════════════════════════════════════════════
// DEAL TERMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Financial terms of a deal.
 */
export interface DealTerms {
    /** Investment amount in USD */
    investmentAmount: number;

    /** Equity percentage being offered */
    equityPercentage: number;

    /** Auto-calculated: investmentAmount / equityPercentage * 100 */
    impliedValuation: number;

    /** Auto-calculated: pre-money + investment */
    postMoneyValuation: number;

    /** Type of investment instrument */
    instrumentType: InstrumentType;

    /** Optional conditions or notes */
    conditions?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL VERSION (NEGOTIATION HISTORY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A snapshot of deal terms at a point in negotiation.
 */
export interface DealVersion {
    /** Monotonically increasing version number */
    version: number;

    /** Terms at this version */
    terms: DealTerms;

    /** Who proposed this version */
    proposedBy: "INVESTOR" | "FOUNDER";

    /** User ID of proposer */
    proposedById: string;

    /** Timestamp of proposal */
    proposedAt: Timestamp;

    /** When this version expires */
    validUntil: Timestamp;

    /** Optional rationale for the change */
    rationale?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL ACTIVITY LOG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Audit log entry for deal actions.
 */
export interface DealActivityEntry {
    /** Type of action */
    action: DealAction;

    /** User ID who performed the action */
    performedBy: string;

    /** When the action occurred */
    timestamp: Timestamp;

    /** Additional metadata */
    metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL (MAIN ENTITY) - Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The main Deal entity representing a fundraising negotiation.
 * This is the SINGLE SOURCE OF TRUTH - both founder and investor read from this.
 */
export interface Deal {
    /** Unique deal ID (Firebase doc ID) */
    dealId: string;

    /** Project/Startup being invested in */
    projectId: string;

    /** Investor user ID */
    investorId: string;

    /** Founder user ID (owner of the project) */
    founderId: string;

    /** Who initiated this deal (FOUNDER = ask, INVESTOR = offer) */
    initiatedBy: DealInitiator;

    /** Current deal status */
    status: DealStatus;

    /** Current active terms */
    currentTerms: DealTerms;

    /** Current version number */
    versionNumber: number;

    /** When the current offer/counter expires */
    validUntil: Timestamp;

    /** Scoped connection ID */
    connectionId: string;

    /** Who needs to take the next action */
    actionRequiredBy: "FOUNDER" | "INVESTOR";

    /** Full version history for negotiation tracking */
    versionHistory: DealVersion[];

    /** When the deal was created */
    createdAt: Timestamp;

    /** Last update timestamp */
    updatedAt: Timestamp;

    /** When the deal was locked (if applicable) */
    lockedAt?: Timestamp;

    /** Audit trail of all actions */
    activityLog: DealActivityEntry[];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate implied valuation from investment amount and equity.
 */
export function calculateImpliedValuation(investmentAmount: number, equityPercentage: number): number {
    if (equityPercentage <= 0) return 0;
    return (investmentAmount / equityPercentage) * 100;
}

/**
 * Calculate post-money valuation.
 */
export function calculatePostMoneyValuation(investmentAmount: number, equityPercentage: number): number {
    return calculateImpliedValuation(investmentAmount, equityPercentage);
}

/**
 * Calculate pre-money valuation.
 */
export function calculatePreMoneyValuation(investmentAmount: number, equityPercentage: number): number {
    const postMoney = calculatePostMoneyValuation(investmentAmount, equityPercentage);
    return postMoney - investmentAmount;
}

/**
 * Calculate dilution impact for existing shareholders.
 */
export function calculateDilution(equityPercentage: number): number {
    return equityPercentage;
}

/**
 * Create default DealTerms with calculated valuations.
 */
export function createDealTerms(
    investmentAmount: number,
    equityPercentage: number,
    instrumentType: InstrumentType = "EQUITY",
    conditions?: string
): DealTerms {
    return {
        investmentAmount,
        equityPercentage,
        impliedValuation: calculateImpliedValuation(investmentAmount, equityPercentage),
        postMoneyValuation: calculatePostMoneyValuation(investmentAmount, equityPercentage),
        instrumentType,
        conditions
    };
}

/**
 * Calculate expiration timestamp from duration days.
 */
export function calculateValidUntil(durationDays: ValidityDuration): Timestamp {
    const now = new Date();
    now.setDate(now.getDate() + durationDays);
    return Timestamp.fromDate(now);
}

/**
 * Check if a deal has expired.
 */
export function isDealExpired(deal: Deal): boolean {
    if (deal.status === "EXPIRED" || deal.status === "LOCKED" || deal.status === "DECLINED") {
        return false; // Already terminal
    }
    return deal.validUntil.toDate() < new Date();
}

/**
 * Get time remaining until expiration.
 */
export function getTimeRemaining(validUntil: Timestamp): { days: number; hours: number; expired: boolean } {
    const now = new Date();
    const expiry = validUntil.toDate();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
        return { days: 0, hours: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours, expired: false };
}

/**
 * Status labels for UI display.
 */
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
    PROPOSED: "Pending Response",
    COUNTERED: "Counter Received",
    NEGOTIATING: "In Negotiation",
    ACCEPTED: "Accepted",
    LOCKED: "Finalized",
    EXPIRED: "Expired",
    DECLINED: "Declined"
};

/**
 * Get role-aware status label.
 */
export function getRoleAwareStatusLabel(deal: Deal, userRole: "FOUNDER" | "INVESTOR"): string {
    if (deal.status === "PROPOSED") {
        if (deal.initiatedBy === userRole) {
            return "Awaiting Response";
        }
        return deal.initiatedBy === "FOUNDER" ? "Founder Ask" : "Investor Offer";
    }
    if (deal.status === "COUNTERED" || deal.status === "NEGOTIATING") {
        if (deal.actionRequiredBy === userRole) {
            return "Your Turn";
        }
        return "Awaiting Response";
    }
    return DEAL_STATUS_LABELS[deal.status];
}

/**
 * Status colors for UI badges.
 */
export const DEAL_STATUS_COLORS: Record<DealStatus, { bg: string; text: string; border: string }> = {
    PROPOSED: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    COUNTERED: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    NEGOTIATING: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
    ACCEPTED: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
    LOCKED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    EXPIRED: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
    DECLINED: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500 dark:text-zinc-500", border: "border-zinc-200 dark:border-zinc-700" }
};

/**
 * Instrument type labels.
 */
export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
    EQUITY: "Equity",
    SAFE: "SAFE",
    CONVERTIBLE_NOTE: "Convertible Note"
};

/**
 * Validity duration labels.
 */
export const VALIDITY_DURATION_LABELS: Record<ValidityDuration, string> = {
    7: "7 days",
    14: "14 days",
    30: "30 days",
    60: "60 days"
};
