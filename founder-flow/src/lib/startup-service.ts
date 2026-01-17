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
    doc
} from "firebase/firestore";

export interface Startup {
    startupId: string;
    ownerId: string;
    idea: string;
    stage: "validation" | "planning" | "execution";
    createdAt: any;
}

export interface StartupMemory {
    entryId: string;
    startupId: string;
    type: "idea" | "agent-output" | "decision" | "pivot";
    content: string;
    timestamp: any;
}

export const createStartup = async (userId: string, idea: string) => {
    const docRef = await addDoc(collection(db, "startups"), {
        ownerId: userId,
        idea,
        stage: "validation",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const addStartupMemory = async (startupId: string, type: StartupMemory["type"], content: string) => {
    await addDoc(collection(db, "startupMemory"), {
        startupId,
        type,
        content,
        timestamp: serverTimestamp(),
    });
};

export const getStartupMemory = async (startupId: string) => {
    const q = query(
        collection(db, "startupMemory"),
        where("startupId", "==", startupId),
        orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateStartupStage = async (startupId: string, stage: Startup["stage"]) => {
    const startupRef = doc(db, "startups", startupId);
    await updateDoc(startupRef, { stage });
};
