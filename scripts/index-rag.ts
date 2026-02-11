import { getAdminDb } from "../src/lib/firebase-admin";
import { ingestDocument } from "../src/lib/rag";

/**
 * Script to migrate all Firestore memories to RAG (Supabase)
 */
async function migrateToRAG() {
    console.log("Starting RAG migration...");
    const db = await getAdminDb();

    // 1. Get all startups
    const startupSnapshot = await db.collection("startups").get();
    console.log(`Found ${startupSnapshot.size} startups.`);

    for (const startupDoc of startupSnapshot.docs) {
        const startupId = startupDoc.id;
        const startupData = startupDoc.data();
        console.log(`Processing startup: ${startupData.name} (${startupId})`);

        // 2. Get all memories for this startup
        const memorySnapshot = await db.collection("startupMemory")
            .where("startupId", "==", startupId)
            .get();

        console.log(`Found ${memorySnapshot.size} memories.`);

        for (const memoryDoc of memorySnapshot.docs) {
            const memoryData = memoryDoc.data();
            const content = memoryData.content;

            if (content && content.length > 50) {
                try {
                    await ingestDocument(startupId, content, {
                        type: memoryData.type,
                        source: memoryData.source,
                        original_id: memoryDoc.id
                    });
                } catch (e) {
                    console.error(`Failed to ingest memory ${memoryDoc.id}:`, e);
                }
            }
        }
    }

    console.log("RAG migration complete.");
}

migrateToRAG().catch(console.error);
