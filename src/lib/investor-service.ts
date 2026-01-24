import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    doc,
    getDoc,
    Timestamp,
    limit
} from "firebase/firestore";
import {
    Investor,
    ProjectInvestorAccess,
    InvestorActivityLog,
    ProjectMetric,
    InvestorRiskAnalysis,
    DecisionLog,
    InvestorUpdate,
    DealFlow,
    DealStage
} from "./types/investor";

// --- Access Control ---

export const checkInvestorAccess = async (investorId: string, projectId: string): Promise<ProjectInvestorAccess | null> => {
    const q = query(
        collection(db, "project_investor_access"),
        where("investorId", "==", investorId),
        where("projectId", "==", projectId),
        where("accessStatus", "==", "ACTIVE")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const access = snapshot.docs[0].data() as ProjectInvestorAccess;

    // Check expiry
    if (access.accessExpiryDate) {
        const expiry = access.accessExpiryDate instanceof Timestamp ? access.accessExpiryDate.toDate() : new Date(access.accessExpiryDate);
        if (expiry < new Date()) {
            // Optionally auto-revoke here
            return null;
        }
    }

    // Log access
    await logInvestorActivity(investorId, projectId, "VIEW_DASHBOARD");

    return { ...access, accessId: snapshot.docs[0].id };
};

export const logInvestorActivity = async (investorId: string, projectId: string, actionType: InvestorActivityLog["actionType"]) => {
    try {
        await addDoc(collection(db, "investor_activity_logs"), {
            investorId,
            projectId,
            actionType,
            timestamp: serverTimestamp(),
            // ipAddress: // captured in generic middleware or API route if needed
        });
    } catch (e) {
        console.error("Failed to log investor activity", e);
    }
};

// --- Dashboard Data Fetching ---

export const getProjectSnapshot = async (projectId: string) => {
    const docRef = doc(db, "startups", projectId); // Assuming 'startups' is the main project collection
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Project not found");
    // Return filtered public fields
    const data = snap.data();
    return {
        name: data.idea, // Mapping 'idea' to name for now, assuming schema
        industry: data.industry || "Technology",
        stage: data.stage,
        founders: data.founders || [], // Need to ensure this exists in startup schema
        location: data.location || "Remote",
        lastActive: data.updatedAt
    };
};

export const getProjectMetrics = async (projectId: string): Promise<ProjectMetric[]> => {
    const q = query(
        collection(db, "project_metrics"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc"),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ metricId: d.id, ...d.data() } as ProjectMetric));
};

export const getRiskAnalysis = async (projectId: string): Promise<InvestorRiskAnalysis | null> => {
    const q = query(
        collection(db, "project_risks"),
        where("projectId", "==", projectId),
        orderBy("generatedAt", "desc"),
        limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { analysisId: snap.docs[0].id, ...snap.docs[0].data() } as InvestorRiskAnalysis;
};

export const getDecisionHistory = async (projectId: string): Promise<DecisionLog[]> => {
    const q = query(
        collection(db, "decision_logs"),
        where("projectId", "==", projectId),
        orderBy("decisionDate", "desc"),
        limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ decisionId: d.id, ...d.data() } as DecisionLog));
};

export const getInvestorUpdates = async (projectId: string): Promise<InvestorUpdate[]> => {
    const q = query(
        collection(db, "investor_updates"),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ updateId: d.id, ...d.data() } as InvestorUpdate));
};

// --- Aggregate Dashboard ---

export const getInvestorDashboardStats = async (investorId: string) => {
    // In a real app, this would aggregate from multiple collections
    // For now, we return calculated stats based on portfolio access
    const portfolio = await getInvestorPortfolio(investorId);

    const investedCount = portfolio.length; // Simplified for now
    const activeDeals = portfolio.length;

    return {
        totalInvested: investedCount,
        activeDeals,
        portfolioCount: investedCount,
        newOpportunities: 5 // Mock number
    };
};

export const getInvestorPortfolio = async (investorId: string) => {
    // 1. Get all access records
    const q = query(
        collection(db, "project_investor_access"),
        where("investorId", "==", investorId),
        where("accessStatus", "==", "ACTIVE")
    );
    const snapshot = await getDocs(q);

    // 2. Fetch basic startup details for each
    const portfolio = await Promise.all(snapshot.docs.map(async (accessDoc) => {
        const access = accessDoc.data();
        try {
            const startupSnap = await getDoc(doc(db, "startups", access.projectId));
            if (!startupSnap.exists()) return null;
            const startup = startupSnap.data();
            return {
                projectId: access.projectId,
                projectName: startup.idea, // Using idea as name for now
                stage: startup.stage,
                accessLevel: access.accessLevel,
                lastUpdate: startup.updatedAt
            };
        } catch (e) {
            return null;
        }
    }));

    return portfolio.filter(p => p !== null);
};

// --- Deal Flow (Legacy / Pipeline Support) ---

export const getDealFlow = async (investorId: string): Promise<DealFlow[]> => {
    const q = query(
        collection(db, "dealflow"),
        where("investorId", "==", investorId),
        orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
};

export const createDeal = async (investorId: string, startupId: string, notes: string = "") => {
    try {
        // 1. Create DealFlow Entry (for Pipeline Kanban)
        const q = query(
            collection(db, "dealflow"),
            where("investorId", "==", investorId),
            where("startupId", "==", startupId)
        );
        const existing = await getDocs(q);

        let dealId;
        if (!existing.empty) {
            dealId = existing.docs[0].id;
        } else {
            const dealRef = await addDoc(collection(db, "dealflow"), {
                investorId,
                startupId,
                stage: "new",
                notes,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            dealId = dealRef.id;
        }

        // 2. Grant Access Permissions (for Project Dashboard)
        // Check if access exists first
        const accessQ = query(
            collection(db, "project_investor_access"),
            where("investorId", "==", investorId),
            where("projectId", "==", startupId)
        );
        const accessSnap = await getDocs(accessQ);

        if (accessSnap.empty) {
            await addDoc(collection(db, "project_investor_access"), {
                projectId: startupId,
                investorId,
                accessLevel: "METRICS_ONLY", // Default
                accessStatus: "ACTIVE",
                createdAt: serverTimestamp()
            });
        }

        return dealId;
    } catch (error) {
        console.error("Error creating deal:", error);
        throw error;
    }
};

export const updateDealStage = async (dealId: string, stage: DealStage) => {
    const dealRef = doc(db, "dealflow", dealId);
    await updateDoc(dealRef, {
        stage,
        updatedAt: serverTimestamp()
    });
};
