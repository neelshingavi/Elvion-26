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
    getDoc
} from "firebase/firestore";
import { Startup } from "./startup-service";
import { DealFlow, DealStage } from "./types/investor";

// Dashboard Services
export const getInvestorDashboardStats = async (investorId: string) => {
    // In a real app, this would aggregate from multiple collections
    // For now, we return calculated stats based on DealFlow
    const deals = await getDealFlow(investorId);

    const investedCount = deals.filter(d => d.stage === "invested").length;
    const activeDeals = deals.filter(d => ["review", "due_diligence", "term_sheet"].includes(d.stage)).length;

    return {
        totalInvested: investedCount, // Placeholder for actual $ amount
        activeDeals,
        portfolioCount: investedCount,
        newOpportunities: 5 // Mock number or fetched from 'new' startups
    };
};

// Deal Flow Services
export const getDealFlow = async (investorId: string): Promise<DealFlow[]> => {
    const q = query(
        collection(db, "dealflow"),
        where("investorId", "==", investorId),
        orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
};

export const updateDealStage = async (dealId: string, stage: DealStage) => {
    const dealRef = doc(db, "dealflow", dealId);
    await updateDoc(dealRef, {
        stage,
        updatedAt: serverTimestamp()
    });
};

export const createDeal = async (investorId: string, startupId: string, notes: string = "") => {
    // Check if deal already exists
    const q = query(
        collection(db, "dealflow"),
        where("investorId", "==", investorId),
        where("startupId", "==", startupId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) return existing.docs[0].id;

    const docRef = await addDoc(collection(db, "dealflow"), {
        investorId,
        startupId,
        stage: "new",
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    return docRef.id;
};
