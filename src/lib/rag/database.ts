import { supabase } from "@/lib/supabase";

export interface MemoryChunk {
    id?: string;
    project_id: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
    content_hash?: string;
    memory_type?: string;
    founder_weight?: number;
    created_at?: string;
    is_active?: boolean;
}

export interface SearchResult {
    id: string;
    content: string;
    metadata: any;
    similarity: number;
    final_score: number;
    memory_type: string;
    created_at: string;
}

/**
 * Save a batch of memory chunks with deduplication
 */
export async function saveChunks(chunks: MemoryChunk[]) {
    if (chunks.length === 0) return;

    // 1. Batch deduplication check (Performance optimization)
    const chunksWithHash = chunks.filter(c => c.content_hash);
    if (chunksWithHash.length === 0) {
        // No hashes to check, insert all
        const { error } = await supabase
            .from("project_memory")
            .insert(chunks);
        if (error) {
            console.error("Error saving RAG chunks:", error);
            throw error;
        }
        return;
    }

    // Get all hashes in a single query
    const hashes = chunksWithHash.map(c => c.content_hash);
    const projectId = chunks[0].project_id; // Assume all chunks are for same project

    const { data: existingHashes, error: checkError } = await supabase
        .from("project_memory")
        .select("content_hash")
        .eq("project_id", projectId)
        .in("content_hash", hashes);

    if (checkError) {
        console.warn("Error checking dedup, proceeding with insert:", checkError.message);
    }

    // Build set of existing hashes for O(1) lookup
    const existingHashSet = new Set(
        (existingHashes || []).map((row: any) => row.content_hash)
    );

    // Filter out duplicates
    const newChunks = chunks.filter(chunk => {
        if (!chunk.content_hash) return true; // Keep chunks without hash
        if (existingHashSet.has(chunk.content_hash)) {
            console.log(`Duplicate chunk found (hash: ${chunk.content_hash}), skipping.`);
            return false;
        }
        return true;
    });

    if (newChunks.length === 0) {
        console.log("All chunks were duplicates, nothing to insert.");
        return;
    }

    // 2. Insert new chunks
    const { error } = await supabase
        .from("project_memory")
        .insert(newChunks);

    if (error) {
        console.error("Error saving RAG chunks:", error);
        throw error;
    }

    console.log(`Inserted ${newChunks.length} new chunks (${chunks.length - newChunks.length} duplicates skipped).`);
}

/**
 * Perform a hybrid similarity search (Tier 1 & 2 Upgrade)
 */
export async function searchSimilar(
    projectId: string,
    queryEmbedding: number[],
    queryText: string,
    options: {
        limit?: number;
        minSimilarity?: number;
        types?: string[];
    } = {}
): Promise<SearchResult[]> {
    const {
        limit = 10,
        minSimilarity = 0.65,
        types = null
    } = options;

    const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        query_text: queryText,
        match_threshold: minSimilarity, // Tier 1 (Mandatory Thresholding)
        match_count: limit,
        p_project_id: projectId, // Tier 1 (Hard Isolation)
        p_memory_types: types
    });

    if (error) {
        console.error("RAG Search Error:", error);
        return [];
    }

    return data as SearchResult[];
}

/**
 * Soft delete memory (Tier 2 Temporal Management)
 */
export async function archiveMemory(memoryId: string, supersededBy?: string) {
    const updates: any = { is_active: false };
    if (supersededBy) updates.superseded_by = supersededBy;

    await supabase
        .from("project_memory")
        .update(updates)
        .eq("id", memoryId);
}
