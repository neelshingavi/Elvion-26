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
    setDoc,
    deleteDoc
} from "firebase/firestore";

export interface Startup {
    startupId: string;
    ownerId: string;
    name: string;
    industry: string; // [NEW]
    stage: "idea_submitted" | "idea_validated" | "roadmap_created" | "execution_active" | "mvp" | "launch" | "growth";
    projectStatus: "active" | "archived"; // [NEW]
    vision?: string; // [NEW]
    problemStatement?: string; // [NEW]
    idea: string; // Keeping for backward compatibility or as alias for problemStatement/vision mix
    createdAt: any;
    updatedAt: any; // [NEW]
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
    // Expanded profile fields
    about?: string;
    skills?: string[];
    age?: number;
    phone?: string;
    education?: string;
    location?: string;
    accountStatus?: "active" | "suspended"; // [NEW]
    lastLoginAt?: any; // [NEW]
    createdAt: any;
}

export interface Task {
    id: string;
    startupId: string;
    title: string;
    priority: "high" | "medium" | "low";
    reason: string;
    instruction?: string; // What the user asked for
    aiResponse?: string; // Gemini's output
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

export interface StartupMember {
    id: string;
    startupId: string;
    userId: string;
    role: "owner" | "cofounder" | "team" | "mentor" | "investor";
    joinedAt: any;
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
export const createStartup = async (
    userId: string,
    name: string,
    industry: string,
    idea: string,
    vision: string = "",
    problemStatement: string = ""
) => {
    // 1. Create Startup Doc
    const docRef = await addDoc(collection(db, "startups"), {
        ownerId: userId, // Keep for reference, but auth uses members
        name,
        industry,
        idea,
        vision,
        problemStatement,
        stage: "idea_submitted",
        projectStatus: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // 2. Add Owner to Startup Members
    await addDoc(collection(db, "startup_members"), {
        startupId: docRef.id,
        userId: userId,
        role: "owner",
        joinedAt: serverTimestamp()
    });

    // 3. Set as active
    await setActiveStartupId(userId, docRef.id);

    // 4. Initial Memory
    await addStartupMemory(docRef.id, "idea", "user", "Startup idea submitted: " + idea);

    return docRef.id;
};

export const getUserStartups = async (userId: string): Promise<Startup[]> => {
    // Optimized to avoid needing a complex composite index for now.
    // We fetch all startups for the owner and filter/sort in memory.

    // Simple query: all startups owned by user
    const q = query(
        collection(db, "startups"),
        where("ownerId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const startups = querySnapshot.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as Startup[];

    // Client-side filtering and sorting
    return startups
        .filter(s => s.projectStatus !== "archived")
        .sort((a, b) => {
            const dateA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
            const dateB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
};

export const getStartupMember = async (startupId: string, userId: string): Promise<StartupMember | null> => {
    const q = query(
        collection(db, "startup_members"),
        where("startupId", "==", startupId),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as StartupMember;
    }
    return null;
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

export const deleteStartupMemory = async (memoryId: string) => {
    await deleteDoc(doc(db, "startupMemory", memoryId));
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

// Investor-facing services
export interface StartupFilter {
    stage?: string;
    industry?: string; // Not yet in Startup model, but simulating 
}

export const getStartups = async (filter?: StartupFilter): Promise<Startup[]> => {
    let q = query(collection(db, "startups"), orderBy("createdAt", "desc"));

    if (filter?.stage) {
        q = query(q, where("stage", "==", filter.stage));
    }

    // Note: Firestore requires composite indexes for multiple fields. 
    // For now we implement basic filtering.

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as any;
};

export const getStartupDeepDive = async (startupId: string) => {
    const startup = await getStartup(startupId);
    if (!startup) return null;

    const [memory, tasks, agentRuns] = await Promise.all([
        getStartupMemory(startupId),
        getTasks(startupId),
        getAgentRuns(startupId)
    ]);

    return {
        ...startup,
        memory,
        tasks,
        agentRuns
    };
};
