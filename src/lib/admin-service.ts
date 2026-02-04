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
        // 1. Find all startups owned by this user
        const startupsQuery = query(
            collection(db, "startups"),
            where("ownerId", "==", userId)
        );
        const startupSnap = await getDocs(startupsQuery);

        console.log(`Found ${startupSnap.size} startups owned by user ${userId}. Deleting them...`);

        // 2. Delete each startup fully (handling its sub-collections)
        const deletePromises = startupSnap.docs.map(doc => deleteStartupFully(doc.id));
        await Promise.all(deletePromises);

        // 3. Delete memberships (where they are just members, not owners - though duplicate check is fine)
        await batchDelete("startup_members", "userId", userId);

        // 4. Delete the User Document
        await deleteDoc(doc(db, "users", userId));

        // Note: Firebase Auth deletion must happen server-side via Admin SDK
        console.log(`User ${userId} and all owned resources deleted.`);
    } catch (error) {
        console.error("Error deleting user fully:", error);
        throw error;
    }
};
