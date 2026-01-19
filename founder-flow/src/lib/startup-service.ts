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
    setDoc
} from "firebase/firestore";

export interface Startup {
    startupId: string;
    ownerId: string;
    idea: string;
    stage: "idea_submitted" | "idea_validated" | "roadmap_created" | "execution_active";
    createdAt: any;
}

export interface StartupMemory {
    id: string;
    startupId: string;
    type: "idea" | "agent-output" | "decision" | "pivot";
    source: "user" | "agent";
    content: string;
    timestamp: any;
}

export interface UserData {
    uid: string;
    role: "founder" | "admin";
    activeStartupId?: string;
    createdAt: any;
}

export interface Task {
    id: string;
    startupId: string;
    title: string;
    priority: "high" | "medium" | "low";
    reason: string;
    status: "pending" | "done";
    createdByAgent: string;
    createdAt: any;
}

export interface AgentRun {
    id: string;
    startupId: string;
    agentType: string;
    status: "running" | "success" | "failure";
    result?: string;
    createdAt: any;
}

// User data services
export const getUserData = async (uid: string): Promise<UserData | null> => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { uid, ...userSnap.data() } as UserData;
    }
    return null;
};

export const setActiveStartupId = async (uid: string, startupId: string) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { activeStartupId: startupId }, { merge: true });
};

// Startup services
export const createStartup = async (userId: string, idea: string) => {
    const docRef = await addDoc(collection(db, "startups"), {
        ownerId: userId,
        idea,
        stage: "idea_submitted",
        createdAt: serverTimestamp(),
    });

    // Also set as active startup for user
    await setActiveStartupId(userId, docRef.id);

    // Add initial memory
    await addStartupMemory(docRef.id, "idea", "user", "Startup idea submitted: " + idea);

    return docRef.id;
};

export const getStartup = async (startupId: string): Promise<Startup | null> => {
    const docRef = doc(db, "startups", startupId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { startupId, ...docSnap.data() } as Startup;
    }
    return null;
};

export const addStartupMemory = async (startupId: string, type: StartupMemory["type"], source: StartupMemory["source"], content: string) => {
    await addDoc(collection(db, "startupMemory"), {
        startupId,
        type,
        source,
        content,
        timestamp: serverTimestamp(),
    });
};

export const getStartupMemory = async (startupId: string): Promise<StartupMemory[]> => {
    const q = query(
        collection(db, "startupMemory"),
        where("startupId", "==", startupId),
        orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
};

export const updateStartupStage = async (startupId: string, stage: Startup["stage"]) => {
    const startupRef = doc(db, "startups", startupId);
    await updateDoc(startupRef, { stage });
};

// Task services
export const getTasks = async (startupId: string): Promise<Task[]> => {
    const q = query(
        collection(db, "tasks"),
        where("startupId", "==", startupId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
};

export const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status });
};

// Agent run services
export const createAgentRun = async (startupId: string, agentType: string) => {
    const docRef = await addDoc(collection(db, "agentRuns"), {
        startupId,
        agentType,
        status: "running",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAgentRuns = async (startupId: string): Promise<AgentRun[]> => {
    const q = query(
        collection(db, "agentRuns"),
        where("startupId", "==", startupId),
        orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
};
