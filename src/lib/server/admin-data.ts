import "server-only";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BATCH_LIMIT = 400;

async function batchDeleteByQuery(query: FirebaseFirestore.Query) {
    let snapshot = await query.limit(BATCH_LIMIT).get();
    while (!snapshot.empty) {
        const batch = query.firestore.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        snapshot = await query.limit(BATCH_LIMIT).get();
    }
}

async function deleteCollectionByField(collectionName: string, field: string, value: string) {
    const db = await getAdminDb();
    const query = db.collection(collectionName).where(field, "==", value);
    await batchDeleteByQuery(query);
}

export async function deleteStartupFullyAdmin(startupId: string) {
    const db = await getAdminDb();

    await Promise.all([
        deleteCollectionByField("tasks", "startupId", startupId),
        deleteCollectionByField("startupMemory", "startupId", startupId),
        deleteCollectionByField("agentRuns", "startupId", startupId),
        deleteCollectionByField("startup_members", "startupId", startupId),
        deleteCollectionByField("roadmaps", "startupId", startupId),
        deleteCollectionByField("pitchDecks", "startupId", startupId),
        deleteCollectionByField("marketIntel", "startupId", startupId),
        deleteCollectionByField("first48Plans", "startupId", startupId)
    ]);

    await db.collection("canvases").doc(`${startupId}_main`).delete().catch(() => null);
    await db.collection("pitchDecks").doc(startupId).delete().catch(() => null);
    await db.collection("marketIntel").doc(startupId).delete().catch(() => null);
    await db.collection("roadmaps").doc(startupId).delete().catch(() => null);

    // Clear activeStartupId for users referencing this startup
    const usersSnap = await db.collection("users").where("activeStartupId", "==", startupId).get();
    if (!usersSnap.empty) {
        const batch = db.batch();
        usersSnap.docs.forEach((doc) => batch.update(doc.ref, { activeStartupId: FieldValue.delete() }));
        await batch.commit();
    }

    await db.collection("startups").doc(startupId).delete();
}

export async function deleteUserFullyAdmin(userId: string) {
    const db = await getAdminDb();

    const ownedStartupsSnap = await db.collection("startups").where("ownerId", "==", userId).get();
    for (const doc of ownedStartupsSnap.docs) {
        await deleteStartupFullyAdmin(doc.id);
    }

    await Promise.all([
        deleteCollectionByField("startup_members", "userId", userId),
        deleteCollectionByField("connection_requests", "from", userId),
        deleteCollectionByField("connection_requests", "to", userId)
    ]);

    // Remove connections involving this user
    const connectionsSnap = await db.collection("connections").where("users", "array-contains", userId).get();
    if (!connectionsSnap.empty) {
        const batch = db.batch();
        connectionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
    }

    await db.collection("users").doc(userId).delete();

    try {
        const auth = await getAdminAuth();
        await auth.deleteUser(userId);
    } catch (error) {
        console.error("Failed to delete auth user:", error);
    }
}
