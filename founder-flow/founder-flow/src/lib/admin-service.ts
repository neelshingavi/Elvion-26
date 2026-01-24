import { db } from "./firebase";
import {
    doc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from "firebase/firestore";

// Helper to batch delete documents from a query
async function batchDelete(collectionName: string, field: string, value: string) {
    const q = query(collection(db, collectionName), where(field, "==", value));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
}

export const deleteStartupFully = async (startupId: string) => {
    try {
        // 1. Delete Sub-Collections / Related Data
        await Promise.all([
            batchDelete("tasks", "startupId", startupId),
            batchDelete("startupMemory", "startupId", startupId),
            batchDelete("agentRuns", "startupId", startupId),
            batchDelete("startup_members", "startupId", startupId),
            // Add any other related collections here
        ]);

        // 2. Delete the Startup Document itself
        await deleteDoc(doc(db, "startups", startupId));
        console.log(`Startup ${startupId} fully deleted.`);
    } catch (error) {
        console.error("Error deleting startup fully:", error);
        throw error;
    }
};

export const deleteUserFully = async (userId: string) => {
    try {
        // 1. Retrieve user data to see if they own any startups? 
        // For now, we just delete their memberships and user doc.
        // Ideally, we should also handle startups they OWN.

        // Delete memberships
        await batchDelete("startup_members", "userId", userId);

        // Delete the User Document
        await deleteDoc(doc(db, "users", userId));

        // Note: Firebase Auth deletion must happen server-side via Admin SDK
        console.log(`User ${userId} firestore data deleted.`);
    } catch (error) {
        console.error("Error deleting user fully:", error);
        throw error;
    }
};
