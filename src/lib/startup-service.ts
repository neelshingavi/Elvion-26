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
    deleteDoc,
    writeBatch,
    Timestamp,
    FieldValue,
    documentId
} from "firebase/firestore";

import {
    Startup,
    StartupMemory,
    Task,
    AgentRun,
    AgentType,
    StartupMember,
    FounderProfile as UserData
} from "./types/founder";

export type { Startup, StartupMemory, Task, AgentRun, StartupMember, UserData };


// User data services
export const getUserData = async (uid: string): Promise<UserData | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { uid, ...userSnap.data() } as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw new Error("Failed to fetch user profile.");
    }
};

export const setActiveStartupId = async (uid: string, startupId: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { activeStartupId: startupId }, { merge: true });
    } catch (error) {
        console.error("Error setting active startup:", error);
        throw new Error("Failed to switch active project.");
    }
};

export const getAllUsers = async (currentUid: string): Promise<UserData[]> => {
    try {
        const q = query(collection(db, "users"), where("uid", "!=", currentUid));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserData[];
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

export const getActiveStartup = async (uid: string): Promise<Startup | null> => {
    try {
        const user = await getUserData(uid);
        if (!user?.activeStartupId) return null;
        const snap = await getDoc(doc(db, "startups", user.activeStartupId));
        if (snap.exists()) {
            return { startupId: snap.id, ...snap.data() } as Startup;
        }
        return null;
    } catch (error) {
        console.error("Error fetching active startup:", error);
        return null; // Fail gracefully for UI
    }
};

// Startup services
export const createStartup = async (
    userId: string,
    name: string,
    industry: string,
    idea: string,
    vision: string = "",
    problemStatement: string = "",
    options?: { oneSentencePitch?: string; targetDemographic?: string }
) => {
    try {
        if (!name || !name.trim()) throw new Error("Startup Name is required.");
        if (!industry || !industry.trim()) throw new Error("Industry is required.");
        if (!idea || !idea.trim()) throw new Error("Idea description is required.");

        const batch = writeBatch(db);

        // 1. Create Startup Doc Reference
        const startupRef = doc(collection(db, "startups"));
        const startupData: Record<string, any> = {
            ownerId: userId,
            name,
            industry,
            idea,
            oneSentencePitch: options?.oneSentencePitch || idea,
            vision,
            problemStatement,
            stage: "idea_submitted",
            projectStatus: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        if (options?.targetDemographic) {
            startupData.targetDemographic = options.targetDemographic;
        }
        batch.set(startupRef, startupData);

        // 2. Add Owner to Startup Members
        const memberRef = doc(collection(db, "startup_members"));
        batch.set(memberRef, {
            startupId: startupRef.id,
            userId: userId,
            role: "owner",
            joinedAt: serverTimestamp()
        });

        // 3. Set as active for user
        const userRef = doc(db, "users", userId);
        batch.set(userRef, { activeStartupId: startupRef.id }, { merge: true });

        // 4. Initial Memory
        const memoryRef = doc(collection(db, "startupMemory"));
        batch.set(memoryRef, {
            startupId: startupRef.id,
            type: "idea",
            source: "user",
            content: "Startup idea submitted: " + idea,
            timestamp: serverTimestamp(),
        });

        await batch.commit();
        return startupRef.id;
    } catch (error) {
        console.error("Fatal error creating startup:", error);
        throw new Error("Failed to initialize project workspace. Please try again.");
    }
};

export const getUserStartups = async (userId: string): Promise<Startup[]> => {
    try {
        const ownedQuery = query(collection(db, "startups"), where("ownerId", "==", userId));
        const [ownedSnap, memberSnap] = await Promise.all([
            getDocs(ownedQuery),
            getDocs(query(collection(db, "startup_members"), where("userId", "==", userId)))
        ]);

        const ownedStartups = ownedSnap.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as Startup[];
        const memberIds = Array.from(new Set(memberSnap.docs.map(doc => doc.data().startupId).filter(Boolean)));

        const memberStartups: Startup[] = [];
        const chunkSize = 10;
        for (let i = 0; i < memberIds.length; i += chunkSize) {
            const chunk = memberIds.slice(i, i + chunkSize);
            const chunkQuery = query(collection(db, "startups"), where(documentId(), "in", chunk));
            const chunkSnap = await getDocs(chunkQuery);
            memberStartups.push(...(chunkSnap.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as Startup[]));
        }

        const combined = [...ownedStartups, ...memberStartups];
        const unique = Array.from(new Map(combined.map(s => [s.startupId, s])).values());

        return unique
            .filter(s => s.projectStatus !== "archived")
            .sort((a, b) => {
                const dateA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
                const dateB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
    } catch (error) {
        console.error("Error fetching user startups:", error);
        return [];
    }
};

export const getStartupMember = async (startupId: string, userId: string): Promise<StartupMember | null> => {
    try {
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
    } catch (error) {
        console.error("Error checking membership:", error);
        return null;
    }
};

export const getStartup = async (startupId: string): Promise<Startup | null> => {
    try {
        const docRef = doc(db, "startups", startupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { startupId, ...docSnap.data() } as Startup;
        }
        return null;
    } catch (error) {
        console.error("Error fetching startup details:", error);
        return null;
    }
};

export const addStartupMemory = async (startupId: string, type: StartupMemory["type"], source: StartupMemory["source"], content: string) => {
    try {
        await addDoc(collection(db, "startupMemory"), {
            startupId,
            type,
            source,
            content,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding memory:", error);
        // Non-blocking error, usually 
    }
};

export const deleteStartupMemory = async (memoryId: string) => {
    try {
        await deleteDoc(doc(db, "startupMemory", memoryId));
    } catch (error) {
        console.error("Error deleting memory:", error);
    }
};

export const getStartupMemory = async (startupId: string): Promise<StartupMemory[]> => {
    try {
        const q = query(
            collection(db, "startupMemory"),
            where("startupId", "==", startupId),
            orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StartupMemory[];
    } catch (error) {
        console.error("Error fetching memory:", error);
        return [];
    }
};

export const getMemories = getStartupMemory;

export const updateStartupStage = async (startupId: string, stage: Startup["stage"]) => {
    try {
        const startupRef = doc(db, "startups", startupId);
        await updateDoc(startupRef, { stage, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error("Error updating stage:", error);
        throw error;
    }
};

// Task services
export const getTasks = async (startupId: string): Promise<Task[]> => {
    try {
        const q = query(
            collection(db, "tasks"),
            where("startupId", "==", startupId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }
};

export const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
    try {
        const taskRef = doc(db, "tasks", taskId);
        const updates: Record<string, any> = { status, updatedAt: serverTimestamp() };
        if (status === "done") {
            updates.completedAt = serverTimestamp();
        }
        await updateDoc(taskRef, updates);
    } catch (error) {
        console.error("Error updating task status:", error);
    }
};

export const saveTaskRating = async (taskId: string, rating: 1 | 2 | 3 | 4 | 5) => {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, { rating, updatedAt: serverTimestamp() });
    } catch (error) {
        console.error("Error saving task rating:", error);
    }
};

// Agent run services
export const createAgentRun = async (startupId: string, agentType: string) => {
    try {
        const docRef = await addDoc(collection(db, "agentRuns"), {
            startupId,
            agentType,
            status: "running",
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating agent run:", error);
        throw error;
    }
};

export const completeAgentRun = async (
    runId: string,
    status: "success" | "failure",
    result?: string
) => {
    try {
        const runRef = doc(db, "agentRuns", runId);
        await updateDoc(runRef, {
            status,
            result: result || null,
            completedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error completing agent run:", error);
    }
};

export const createTaskDirectly = async (
    startupId: string,
    title: string,
    description: string,
    priority: "low" | "medium" | "high" = "medium"
) => {
    try {
        return await addDoc(collection(db, "tasks"), {
            startupId,
            title,
            description,
            status: "pending",
            priority,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating task:", error);
        throw error;
    }
};


export const getAgentRuns = async (startupId: string): Promise<AgentRun[]> => {
    try {
        const q = query(
            collection(db, "agentRuns"),
            where("startupId", "==", startupId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AgentRun[];
    } catch (error) {
        console.error("Error fetching agent runs:", error);
        return [];
    }
};

// Startup Discovery services
export interface StartupFilter {
    stage?: string;
    industry?: string;
}

export const getStartups = async (filter?: StartupFilter): Promise<Startup[]> => {
    try {
        let q = query(collection(db, "startups"), orderBy("createdAt", "desc"));

        if (filter?.stage) {
            q = query(q, where("stage", "==", filter.stage));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ startupId: doc.id, ...doc.data() })) as Startup[];
    } catch (error) {
        console.error("Error fetching startups:", error);
        return [];
    }
};

export const getStartupDeepDive = async (startupId: string) => {
    try {
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
    } catch (error) {
        console.error("Deep dive fetch error:", error);
        return null;
    }
};
