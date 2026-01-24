import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    doc,
    setDoc,
    getDoc
} from "firebase/firestore";
import { CustomerProfile, CustomerEvent, Feedback, ProductDiscoveryItem } from "./types/customer";

// Profile Management
export const ensureCustomerProfile = async (uid: string, email: string) => {
    const ref = doc(db, "customers", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            uid,
            email,
            displayName: email.split("@")[0],
            preferences: { interests: [], betaTester: false },
            joinedAt: serverTimestamp()
        });
    }
};

// Event Tracking
export const trackCustomerEvent = async (customerId: string, startupId: string, eventType: CustomerEvent["eventType"], metadata: any = {}) => {
    await addDoc(collection(db, "customerEvents"), {
        customerId,
        startupId,
        eventType,
        metadata,
        timestamp: serverTimestamp()
    });
};

// Feedback System
export const submitFeedback = async (data: Omit<Feedback, "id" | "createdAt" | "sentimentScore">) => {
    await addDoc(collection(db, "feedback"), {
        ...data,
        sentimentScore: 0, // Placeholder for AI calculation
        createdAt: serverTimestamp()
    });
};

// Discovery
export const getExploreProducts = async (): Promise<ProductDiscoveryItem[]> => {
    // In a real app, this would filter for startups asking for validation
    const q = query(collection(db, "startups"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.slice(0, 10).map(doc => {
        const data = doc.data();
        return {
            startupId: doc.id,
            idea: data.idea,
            stage: data.stage,
            betaActive: ["idea_validated", "execution_active"].includes(data.stage),
            incentive: data.stage === "execution_active" ? "Early Access" : undefined
        };
    });
};

export const getMyActivity = async (customerId: string) => {
    const q = query(
        collection(db, "customerEvents"),
        where("customerId", "==", customerId),
        orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
