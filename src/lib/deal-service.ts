import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    doc,
    getDoc,
    Timestamp,
    limit
} from "firebase/firestore";
import {
    Deal,
    DealStatus,
    DealTerms,
    DealVersion,
    DealActivityEntry,
    DealInitiator,
    ValidityDuration,
    createDealTerms,
    calculateValidUntil,
    isDealExpired,
    InstrumentType
} from "./types/deal";
import {
    getOrCreateConnection,
    updateConnectionActivity,
    isConnectionActive,
    getConnection,
    getConnectionsForUser
} from "./connection-service";
import { generateDealAnalysis } from "./ai-service";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DEALS_COLLECTION = "deals";

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
    PROPOSED: ["COUNTERED", "ACCEPTED", "DECLINED", "EXPIRED"],
    COUNTERED: ["COUNTERED", "NEGOTIATING", "ACCEPTED", "DECLINED", "EXPIRED"],
    NEGOTIATING: ["COUNTERED", "ACCEPTED", "DECLINED", "EXPIRED"],
    ACCEPTED: ["LOCKED"],
    LOCKED: [],
    EXPIRED: [],
    DECLINED: []
};

function isValidTransition(from: DealStatus, to: DealStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL CREATION - Bidirectional
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new deal proposal (can be initiated by either founder or investor).
 * STRICT: Requires an existing connection (Interest) to be established first.
 */
export async function createDeal(
    initiatorId: string,
    initiatorRole: DealInitiator,
    projectId: string,
    counterpartyId: string, // The other party's user ID
    investmentAmount: number,
    equityPercentage: number,
    validityDays: ValidityDuration = 14,
    instrumentType: InstrumentType = "EQUITY",
    conditions?: string
): Promise<string> {
    // Determine founder and investor based on initiator role
    const founderId = initiatorRole === "FOUNDER" ? initiatorId : counterpartyId;
    const investorId = initiatorRole === "INVESTOR" ? initiatorId : counterpartyId;

    // Check for existing active deal between these parties for this project
    const existingDeal = await getActiveDealBetweenParties(investorId, founderId, projectId);
    if (existingDeal) {
        throw new Error("An active deal already exists between these parties for this project.");
    }

    // 1. Explicit Connection Validation (Source of Truth)
    const connection = await getConnection(investorId, founderId, projectId);

    if (!connection) {
        if (initiatorRole === "FOUNDER") {
            throw new Error("Cannot create deal: This investor has not expressed interest yet.");
        } else {
            // If investor is creating deal but forgot to express interest, we could auto-create, 
            // but to be strict as requested, we require interest first.
            // However, for UX, maybe we should allow it if it's the INVESTOR initiating?
            // Prompt says: "Investors should ONLY see deals where... They have explicitly shown interest."
            // So we enforce connection existence. Use expressInterest first.
            throw new Error("Connection not found. Please express interest in the startup first.");
        }
    }

    // Check if connection is in a valid state (ACTIVE, INTERESTED, CONNECTED)
    if (connection.status === "REVOKED" || connection.status === "PAUSED") {
        throw new Error("Cannot create deal: Connection is not active.");
    }

    const connectionId = connection.connectionId;

    const terms = createDealTerms(investmentAmount, equityPercentage, instrumentType, conditions || "");
    const now = Timestamp.now();
    const validUntil = calculateValidUntil(validityDays);

    const initialVersion: DealVersion = {
        version: 1,
        terms,
        proposedBy: initiatorRole,
        proposedById: initiatorId,
        proposedAt: now,
        validUntil
    };

    const initialActivity: DealActivityEntry = {
        action: "CREATED",
        performedBy: initiatorId,
        timestamp: now,
        metadata: { role: initiatorRole }
    };

    // Action required by the OTHER party
    const actionRequiredBy: "FOUNDER" | "INVESTOR" = initiatorRole === "FOUNDER" ? "INVESTOR" : "FOUNDER";

    const dealData: Omit<Deal, "dealId"> = {
        projectId,
        investorId,
        founderId,
        connectionId,
        initiatedBy: initiatorRole,
        status: "PROPOSED",
        currentTerms: terms,
        versionNumber: 1,
        validUntil,
        actionRequiredBy,
        versionHistory: [initialVersion],
        createdAt: now,
        updatedAt: now,
        activityLog: [initialActivity]
    };

    const docRef = await addDoc(collection(db, DEALS_COLLECTION), dealData);
    const dealId = docRef.id;

    // 2. Trigger AI Analysis Pipeline (Recipient perspective)
    const recipientRole = initiatorRole === "FOUNDER" ? "INVESTOR" : "FOUNDER";
    const fullDeal = { dealId, ...dealData } as Deal;
    await generateDealAnalysis(fullDeal, recipientRole);

    // 3. Update Connection metadata/status
    await updateConnectionActivity(connectionId);

    // If connection was just "INTERESTED", upgrade to "CONNECTED" or "ACTIVE"
    if (connection.status === "INTERESTED") {
        // We might want to update status to CONNECTED here
    }

    return dealId;
}

/**
 * Get eligible investors for a founder (those who have expressed interest).
 */
export async function getEligibleInvestors(founderId: string) {
    // Only return connections that are INTERESTED or CONNECTED/ACTIVE
    const connections = await getConnectionsForUser(founderId, "FOUNDER");
    return connections.filter(c => ["INTERESTED", "CONNECTED", "ACTIVE"].includes(c.status));
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL RETRIEVAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all deals for a user (works for both founders and investors).
 */
export async function getDealsForUser(userId: string): Promise<Deal[]> {
    // Query for deals where user is either founder or investor
    const founderQuery = query(
        collection(db, DEALS_COLLECTION),
        where("founderId", "==", userId)
    );
    const investorQuery = query(
        collection(db, DEALS_COLLECTION),
        where("investorId", "==", userId)
    );

    const [founderSnap, investorSnap] = await Promise.all([
        getDocs(founderQuery),
        getDocs(investorQuery)
    ]);

    const dealMap = new Map<string, Deal>();

    founderSnap.docs.forEach(d => {
        dealMap.set(d.id, { dealId: d.id, ...d.data() } as Deal);
    });
    investorSnap.docs.forEach(d => {
        dealMap.set(d.id, { dealId: d.id, ...d.data() } as Deal);
    });

    // Check and auto-expire deals
    const deals = Array.from(dealMap.values());
    await Promise.all(deals.map(deal => checkAndExpireDeal(deal)));

    // Re-fetch after potential expiration updates
    const updatedDeals: Deal[] = [];
    for (const deal of deals) {
        const fresh = await getDealById(deal.dealId);
        if (fresh) updatedDeals.push(fresh);
    }

    return updatedDeals.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
}

/**
 * Get deals for an investor.
 */
export async function getDealsForInvestor(investorId: string): Promise<Deal[]> {
    return getDealsForUser(investorId);
}

/**
 * Get deals for a founder.
 */
export async function getDealsForFounder(founderId: string): Promise<Deal[]> {
    return getDealsForUser(founderId);
}

/**
 * Get a single deal by ID.
 */
export async function getDealById(dealId: string): Promise<Deal | null> {
    const docRef = doc(db, DEALS_COLLECTION, dealId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;

    const deal = { dealId: snapshot.id, ...snapshot.data() } as Deal;

    // Check expiration
    await checkAndExpireDeal(deal);

    // Re-fetch to get updated status
    const freshSnap = await getDoc(docRef);
    if (!freshSnap.exists()) return null;
    return { dealId: freshSnap.id, ...freshSnap.data() } as Deal;
}

/**
 * Get active deal between specific parties for a project.
 */
export async function getActiveDealBetweenParties(
    investorId: string,
    founderId: string,
    projectId: string
): Promise<Deal | null> {
    const activeStatuses: DealStatus[] = ["PROPOSED", "COUNTERED", "NEGOTIATING", "ACCEPTED"];
    const q = query(
        collection(db, DEALS_COLLECTION),
        where("investorId", "==", investorId),
        where("founderId", "==", founderId),
        where("projectId", "==", projectId),
        where("status", "in", activeStatuses),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { dealId: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Deal;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Counter a deal with new terms.
 */
export async function counterDeal(
    dealId: string,
    userId: string,
    userRole: "INVESTOR" | "FOUNDER",
    investmentAmount: number,
    equityPercentage: number,
    validityDays: ValidityDuration = 14,
    instrumentType?: InstrumentType,
    conditions?: string,
    rationale?: string
): Promise<void> {
    const deal = await getDealById(dealId);
    if (!deal) throw new Error("Deal not found");

    // Check expiration first
    if (isDealExpired(deal)) {
        throw new Error("This deal has expired and cannot be modified");
    }

    // Validate user can counter
    if (deal.actionRequiredBy !== userRole) {
        throw new Error("It is not your turn to respond to this deal");
    }

    // Validate user is part of the deal
    if (userRole === "INVESTOR" && deal.investorId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }
    if (userRole === "FOUNDER" && deal.founderId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }

    // Validate state transition
    const targetStatus = deal.versionNumber >= 2 ? "NEGOTIATING" : "COUNTERED";
    if (!isValidTransition(deal.status, targetStatus as DealStatus)) {
        throw new Error(`Cannot counter a deal in ${deal.status} status`);
    }

    const now = Timestamp.now();
    const validUntil = calculateValidUntil(validityDays);
    const newTerms = createDealTerms(
        investmentAmount,
        equityPercentage,
        instrumentType || deal.currentTerms.instrumentType,
        conditions || ""
    );

    const newVersion: DealVersion = {
        version: deal.versionNumber + 1,
        terms: newTerms,
        proposedBy: userRole,
        proposedById: userId,
        proposedAt: now,
        validUntil,
        rationale: rationale || ""
    };

    const counterActivity: DealActivityEntry = {
        action: "COUNTERED",
        performedBy: userId,
        timestamp: now,
        metadata: {
            fromVersion: deal.versionNumber,
            toVersion: deal.versionNumber + 1
        }
    };

    // Switch action to other party
    const newActionRequiredBy: "FOUNDER" | "INVESTOR" = userRole === "FOUNDER" ? "INVESTOR" : "FOUNDER";

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    const updatedDealData = {
        status: targetStatus,
        currentTerms: newTerms,
        versionNumber: deal.versionNumber + 1,
        validUntil,
        actionRequiredBy: newActionRequiredBy,
        versionHistory: [...deal.versionHistory, newVersion],
        updatedAt: now,
        activityLog: [...deal.activityLog, counterActivity]
    };

    await updateDoc(docRef, updatedDealData);

    // AI Analysis for recipient
    const recipientTarget = userRole === "FOUNDER" ? "INVESTOR" : "FOUNDER";
    await generateDealAnalysis({ ...deal, ...updatedDealData } as Deal, recipientTarget);

    // Update Connection activity
    await updateConnectionActivity(deal.connectionId);
}

/**
 * Accept the current deal terms.
 */
export async function acceptDeal(dealId: string, userId: string, userRole: "INVESTOR" | "FOUNDER"): Promise<void> {
    const deal = await getDealById(dealId);
    if (!deal) throw new Error("Deal not found");

    // Check expiration
    if (isDealExpired(deal)) {
        throw new Error("This deal has expired and cannot be accepted");
    }

    // Validate user can accept
    if (deal.actionRequiredBy !== userRole) {
        throw new Error("It is not your turn to respond to this deal");
    }

    // Validate user is part of the deal
    if (userRole === "INVESTOR" && deal.investorId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }
    if (userRole === "FOUNDER" && deal.founderId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }

    // Validate state transition
    if (!isValidTransition(deal.status, "ACCEPTED")) {
        throw new Error(`Cannot accept a deal in ${deal.status} status`);
    }

    const now = Timestamp.now();
    const acceptActivity: DealActivityEntry = {
        action: "ACCEPTED",
        performedBy: userId,
        timestamp: now
    };

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    await updateDoc(docRef, {
        status: "ACCEPTED",
        updatedAt: now,
        activityLog: [...deal.activityLog, acceptActivity]
    });

    // Auto-lock after acceptance
    await lockDeal(dealId);
}

/**
 * Lock a deal (make it immutable).
 */
async function lockDeal(dealId: string): Promise<void> {
    const deal = await getDealById(dealId);
    if (!deal) throw new Error("Deal not found");

    if (deal.status !== "ACCEPTED") {
        throw new Error("Can only lock accepted deals");
    }

    const now = Timestamp.now();
    const lockActivity: DealActivityEntry = {
        action: "LOCKED",
        performedBy: "SYSTEM",
        timestamp: now
    };

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    await updateDoc(docRef, {
        status: "LOCKED",
        lockedAt: now,
        updatedAt: now,
        activityLog: [...deal.activityLog, lockActivity]
    });
}

/**
 * Decline a deal.
 */
export async function declineDeal(dealId: string, userId: string, userRole: "INVESTOR" | "FOUNDER"): Promise<void> {
    const deal = await getDealById(dealId);
    if (!deal) throw new Error("Deal not found");

    // Validate user can decline
    if (deal.actionRequiredBy !== userRole) {
        throw new Error("It is not your turn to respond to this deal");
    }

    // Validate user is part of the deal
    if (userRole === "INVESTOR" && deal.investorId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }
    if (userRole === "FOUNDER" && deal.founderId !== userId) {
        throw new Error("You are not authorized to act on this deal");
    }

    if (!isValidTransition(deal.status, "DECLINED")) {
        throw new Error(`Cannot decline a deal in ${deal.status} status`);
    }

    const now = Timestamp.now();
    const declineActivity: DealActivityEntry = {
        action: "DECLINED",
        performedBy: userId,
        timestamp: now
    };

    const docRef = doc(db, DEALS_COLLECTION, dealId);
    await updateDoc(docRef, {
        status: "DECLINED",
        updatedAt: now,
        activityLog: [...deal.activityLog, declineActivity]
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPIRATION HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check and auto-expire a deal if past validUntil.
 */
async function checkAndExpireDeal(deal: Deal): Promise<void> {
    if (isDealExpired(deal)) {
        const docRef = doc(db, DEALS_COLLECTION, deal.dealId);
        const now = Timestamp.now();

        const expireActivity: DealActivityEntry = {
            action: "EXPIRED",
            performedBy: "SYSTEM",
            timestamp: now
        };

        await updateDoc(docRef, {
            status: "EXPIRED",
            updatedAt: now,
            activityLog: [...deal.activityLog, expireActivity]
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a deal is in an active (actionable) state.
 */
export function isDealActive(status: DealStatus): boolean {
    return ["PROPOSED", "COUNTERED", "NEGOTIATING"].includes(status);
}

/**
 * Check if a deal is in a terminal (closed) state.
 */
export function isDealClosed(status: DealStatus): boolean {
    return ["LOCKED", "EXPIRED", "DECLINED"].includes(status);
}

/**
 * Determine user's role in a deal.
 */
export function getUserRoleInDeal(deal: Deal, userId: string): "FOUNDER" | "INVESTOR" | null {
    if (deal.founderId === userId) return "FOUNDER";
    if (deal.investorId === userId) return "INVESTOR";
    return null;
}

/**
 * Check if user can take action on deal.
 */
export function canUserActOnDeal(deal: Deal, userId: string): boolean {
    const role = getUserRoleInDeal(deal, userId);
    if (!role) return false;
    if (!isDealActive(deal.status)) return false;
    return deal.actionRequiredBy === role;
}
