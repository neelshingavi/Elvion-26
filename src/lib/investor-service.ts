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
    DealStage,
    InvestorPortfolio,
    InvestorNote,
    PortfolioSummary,
    InvestmentStage
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
    // This is essentially an alias to getInvestorPortfolioList for compatibility
    // but returning the simpler shape expected by older components
    const list = await getInvestorPortfolioList(investorId);
    return list.map(p => ({
        projectId: p.projectId,
        projectName: p.project.name,
        stage: p.project.stage,
        accessLevel: "FULL_READ", // Default for legacy support
        lastUpdate: p.project.lastActive
    }));
};

// --- Portfolio Management (Section 5 & 6) ---

export const getInvestorPortfolioList = async (investorId: string): Promise<any[]> => {
    const q = query(
        collection(db, "investor_portfolio"),
        where("investorId", "==", investorId),
        where("status", "==", "ACTIVE")
    );
    const snap = await getDocs(q);

    return await Promise.all(snap.docs.map(async (d) => {
        const portfolioData = d.data() as InvestorPortfolio;
        const projectSnapshot = await getProjectSnapshot(portfolioData.projectId);

        // Mocking some signals for the UI as per spec
        return {
            ...portfolioData,
            id: d.id,
            project: projectSnapshot,
            signals: {
                executionVelocity: "High",
                tractionTrend: "UP",
                riskFlag: "LOW"
            }
        };
    }));
};

export const getPortfolioSummary = async (investorId: string): Promise<PortfolioSummary> => {
    const portfolio = await getInvestorPortfolioList(investorId);

    // Default / Mocked summary data until real aggregation is in place
    return {
        totalStartups: portfolio.length,
        activeCount: portfolio.length,
        healthScore: 84, // Aggregate AI Score
        riskDistribution: {
            low: portfolio.length,
            medium: 0,
            high: 0
        },
        stageDistribution: {
            "PRE_SEED": portfolio.length,
            "SEED": 0,
            "SERIES_A": 0,
            "SERIES_B": 0
        }
    };
};

export const getPortfolioInsights = async (investorId: string): Promise<string[]> => {
    // This would normally call an AI agent (Risk Correlation Agent / Portfolio Intelligence Agent)
    return [
        "Portfolio health improved by 12% following recent roadmap updates.",
        "Execution velocity across the portfolio is 15% above stage benchmarks.",
        "Exposure is currently heavily weighted towards Pre-Seed startups."
    ];
};

export const saveInvestorNote = async (investorId: string, projectId: string, content: string) => {
    await addDoc(collection(db, "investor_notes"), {
        investorId,
        projectId,
        noteContent: content,
        createdAt: serverTimestamp()
    });
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

export const expressInterest = async (investorId: string, startupId: string, notes: string = ""): Promise<string> => {
    try {
        // 1. Create or Get Project Connection (The Source of Truth)
        // We use the connection service to ensure a single source of truth
        const q = query(
            collection(db, "project_connections"),
            where("investorId", "==", investorId),
            where("projectId", "==", startupId),
            limit(1)
        );
        const snapshot = await getDocs(q);

        let connectionId;

        if (snapshot.empty) {
            // Get founder ID from startup first
            const startupDoc = await getDoc(doc(db, "startups", startupId));
            if (!startupDoc.exists()) throw new Error("Startup not found");
            const founderId = startupDoc.data().ownerId;

            const connectionRef = await addDoc(collection(db, "project_connections"), {
                investorId,
                founderId,
                projectId: startupId,
                status: "INTERESTED", // Initial state
                createdAt: serverTimestamp(),
                lastActivityAt: serverTimestamp(),
                metadata: {
                    projectName: startupDoc.data().idea || "Unknown Project",
                    // investorName will be populated by cloud function or client if needed
                }
            });
            connectionId = connectionRef.id;
        } else {
            connectionId = snapshot.docs[0].id;
            // If exists but revoked/paused, reactivation logic could go here
        }

        // 2. Add to Investor Portfolio (Tracking)
        const portfolioQ = query(
            collection(db, "investor_portfolio"),
            where("investorId", "==", investorId),
            where("projectId", "==", startupId)
        );
        const portfolioSnap = await getDocs(portfolioQ);

        if (portfolioSnap.empty) {
            await addDoc(collection(db, "investor_portfolio"), {
                investorId,
                projectId: startupId,
                investmentStage: "WATCHLIST", // Distinct from active investment
                status: "TRACKING",
                createdAt: serverTimestamp()
            });
        }

        // 3. Optional: Save private notes
        if (notes) {
            await saveInvestorNote(investorId, startupId, notes);
        }

        return connectionId;
    } catch (error) {
        console.error("Error expressing interest:", error);
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
