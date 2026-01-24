import { db } from "./firebase";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    updateDoc,
    doc,
    onSnapshot,
    setDoc
} from "firebase/firestore";

export interface ConnectionRequest {
    id: string;
    fromId: string;
    toId: string;
    status: "pending" | "accepted" | "rejected";
    timestamp: any;
}

export interface Connection {
    id: string;
    userIds: string[];
    createdAt: any;
}

export const sendConnectionRequest = async (fromId: string, toId: string) => {
    // Prevent self-connection
    if (fromId === toId) return;

    // Check if request already exists
    const q = query(
        collection(db, "connection_requests"),
        where("fromId", "==", fromId),
        where("toId", "==", toId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return;

    await addDoc(collection(db, "connection_requests"), {
        fromId,
        toId,
        status: "pending",
        timestamp: serverTimestamp()
    });

    // Also add to recipient's notifications
    await addDoc(collection(db, "notifications"), {
        userId: toId,
        type: "connection_request",
        fromId,
        message: "sent you a connection request",
        read: false,
        timestamp: serverTimestamp()
    });
};

export const acceptConnectionRequest = async (requestId: string, fromId: string, toId: string) => {
    const requestRef = doc(db, "connection_requests", requestId);
    await updateDoc(requestRef, { status: "accepted" });

    // Create a bidirectional connection record
    const connectionId = [fromId, toId].sort().join("_");
    await setDoc(doc(db, "connections", connectionId), {
        userIds: [fromId, toId],
        createdAt: serverTimestamp()
    });

    // Notify the sender
    await addDoc(collection(db, "notifications"), {
        userId: fromId,
        type: "connection_accepted",
        fromId: toId,
        message: "accepted your connection request",
        read: false,
        timestamp: serverTimestamp()
    });

    // Increment connection count for both (cached in user doc for speed)
    const updateCount = async (uid: string) => {
        const userRef = doc(db, "users", uid);
        // Simple increment logic (in production use increment() field value)
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", uid)));
        if (!userDoc.empty) {
            const currentCount = userDoc.docs[0].data().connectionCount || 0;
            await updateDoc(doc(db, "users", userDoc.docs[0].id), {
                connectionCount: currentCount + 1
            });
        }
    };
    await updateCount(fromId);
    await updateCount(toId);
};

export const rejectConnectionRequest = async (requestId: string) => {
    const requestRef = doc(db, "connection_requests", requestId);
    await updateDoc(requestRef, { status: "rejected" });
};

export const getConnectionRequests = (uid: string, callback: (requests: any[]) => void) => {
    const q = query(
        collection(db, "connection_requests"),
        where("toId", "==", uid)
    );

    return onSnapshot(q, (snapshot) => {
        const requests: ConnectionRequest[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
                id: d.id,
                fromId: data.fromId,
                toId: data.toId,
                status: data.status ?? "pending",
                timestamp: data.timestamp ?? null
            };
        });
        callback(requests);
    });
}



export const getConnectedUsersSnapshot = (uid: string, callback: (ids: string[]) => void) => {
    const q = query(
        collection(db, "connections"),
        where("userIds", "array-contains", uid)
    );
    return onSnapshot(q, (snap) => {
        const connectionList = snap.docs.map(doc => {
            const data = doc.data() as Connection;
            return data.userIds.find(id => id !== uid);
        }).filter(Boolean) as string[];
        callback(connectionList);
    });
};

export const getConnectedUsers = async (uid: string) => {
    const q = query(
        collection(db, "connections"),
        where("userIds", "array-contains", uid)
    );
    const snap = await getDocs(q);
    const connectionList = snap.docs.map(doc => {
        const data = doc.data() as Connection;
        return data.userIds.find(id => id !== uid);
    }).filter(Boolean) as string[];

    return connectionList;
};

export const getRelationshipStatus = (uid1: string, uid2: string, callback: (status: "none" | "pending" | "connected") => void) => {
    // 1. Check connections
    const connectionId = [uid1, uid2].sort().join("_");
    const unsubConnection = onSnapshot(doc(db, "connections", connectionId), (connDoc) => {
        if (connDoc.exists()) {
            callback("connected");
            return;
        }

        // 2. Check pending requests (sent by either)
        const qRequest = query(
            collection(db, "connection_requests"),
            where("status", "==", "pending"),
            where("fromId", "in", [uid1, uid2])
        );

        onSnapshot(qRequest, (snap) => {
            const hasPending = snap.docs.some(d => {
                const data = d.data();
                return (data.fromId === uid1 && data.toId === uid2) || (data.fromId === uid2 && data.toId === uid1);
            });
            if (hasPending) {
                callback("pending");
            } else {
                callback("none");
            }
        });
    });

    return unsubConnection;
};

export const getSentRequests = (uid: string, callback: (targetIds: string[]) => void) => {
    const q = query(
        collection(db, "connection_requests"),
        where("fromId", "==", uid),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(doc => doc.data().toId));
    });
};
