import { db } from "./firebase";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    Timestamp,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";
import { Connection, ConnectionStatus } from "./types/connection";

// Shape of an individual social connection request (used in dashboards & profile)
export interface ConnectionRequest {
    id: string;
    fromId: string;
    toId: string;
    status: "pending" | "accepted" | "rejected";
    createdAt?: Timestamp | null;
}

// Collection for social/matching connections between founders
const SOCIAL_CONNECTIONS_COLLECTION = "connections";
const CONNECTION_REQUESTS_COLLECTION = "connection_requests";

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER CONNECTIONS (NETWORKING SYSTEM)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sends a connection request from one founder to another.
 */
export async function sendConnectionRequest(fromId: string, toId: string) {
    return await addDoc(collection(db, CONNECTION_REQUESTS_COLLECTION), {
        from: fromId,
        to: toId,
        status: "pending",
        createdAt: serverTimestamp()
    });
}

/**
 * Subscribe to incoming pending connection requests for a target user.
 * Used by the founder dashboard to render notifications.
 */
export function getConnectionRequests(
    userId: string,
    callback: (reqs: ConnectionRequest[]) => void
) {
    const q = query(
        collection(db, CONNECTION_REQUESTS_COLLECTION),
        where("to", "==", userId),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const requests: ConnectionRequest[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
                id: d.id,
                fromId: data.from,
                toId: data.to,
                status: data.status ?? "pending",
                createdAt: data.createdAt ?? null
            };
        });
        callback(requests);
    }, (error) => {
        console.error("ConnectionRequests Listener Error:", error);
    });
}

/**
 * Accept a pending connection request and materialize a social connection.
 */
export async function acceptConnectionRequest(
    requestId: string,
    fromId: string,
    toId: string
): Promise<void> {
    // 1. Mark request as accepted
    const reqRef = doc(db, CONNECTION_REQUESTS_COLLECTION, requestId);
    await updateDoc(reqRef, {
        status: "accepted",
        respondedAt: serverTimestamp()
    });

    // 2. Create (or reuse) a social connection document
    const existing = await getDocs(
        query(
            collection(db, SOCIAL_CONNECTIONS_COLLECTION),
            where("users", "array-contains", fromId)
        )
    );

    const alreadyConnected = existing.docs.some((d) => {
        const users = (d.data() as any).users as string[] | undefined;
        return users && users.includes(fromId) && users.includes(toId);
    });

    if (!alreadyConnected) {
        await addDoc(collection(db, SOCIAL_CONNECTIONS_COLLECTION), {
            users: [fromId, toId],
            status: "ACTIVE" satisfies ConnectionStatus,
            createdAt: serverTimestamp()
        });
    }
}

/**
 * Reject / dismiss a pending connection request.
 */
export async function rejectConnectionRequest(requestId: string): Promise<void> {
    const reqRef = doc(db, CONNECTION_REQUESTS_COLLECTION, requestId);
    await updateDoc(reqRef, {
        status: "rejected",
        respondedAt: serverTimestamp()
    });
}

/**
 * Gets the IDs of all founders the specified user is connected to.
 */
export async function getConnectedUsers(userId: string): Promise<string[]> {
    const q = query(
        collection(db, SOCIAL_CONNECTIONS_COLLECTION),
        where("users", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const connectedIds: string[] = [];

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const otherId = data.users.find((id: string) => id !== userId);
        if (otherId) connectedIds.push(otherId);
    });

    return connectedIds;
}

/**
 * Subscribes to real-time sent requests for a user.
 */
export function getSentRequests(userId: string, callback: (ids: string[]) => void) {
    const q = query(
        collection(db, CONNECTION_REQUESTS_COLLECTION),
        where("from", "==", userId),
        where("status", "==", "pending")
    );

    return onSnapshot(q, (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.data().to);
        callback(ids);
    }, (error) => {
        console.error("SentRequests Listener Error:", error);
    });
}

/**
 * Real-time subscription to connected founders.
 * Used by MessagingHub for live updates.
 */
export function getConnectedUsersSnapshot(userId: string, callback: (ids: string[]) => void) {
    const q = query(
        collection(db, SOCIAL_CONNECTIONS_COLLECTION),
        where("users", "array-contains", userId)
    );

    return onSnapshot(q, (snapshot) => {
        const connectedIds: string[] = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const users = data.users as string[];
            const otherId = users.find((id: string) => id !== userId);
            if (otherId) connectedIds.push(otherId);
        });
        callback(connectedIds);
    }, (error) => {
        console.error("ConnectedUsers Listener Error:", error);
    });
}
