import "server-only";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function getStartupById(startupId: string) {
    const db = await getAdminDb();
    const snap = await db.collection("startups").doc(startupId).get();
    if (!snap.exists) return null;
    return { startupId, ...snap.data() };
}

export async function getStartupMemoryAdmin(startupId: string) {
    const db = await getAdminDb();
    const snapshot = await db
        .collection("startupMemory")
        .where("startupId", "==", startupId)
        .orderBy("timestamp", "desc")
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addStartupMemoryAdmin(
    startupId: string,
    type: string,
    source: string,
    content: string
) {
    const db = await getAdminDb();
    await db.collection("startupMemory").add({
        startupId,
        type,
        source,
        content,
        timestamp: FieldValue.serverTimestamp()
    });
}

export async function updateStartupStageAdmin(startupId: string, stage: string) {
    const db = await getAdminDb();
    await db.collection("startups").doc(startupId).update({
        stage,
        updatedAt: FieldValue.serverTimestamp()
    });
}
