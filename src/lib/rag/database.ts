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
    // 1. Check for duplicates using content_hash
    const newChunks = [];
    for (const chunk of chunks) {
        if (!chunk.content_hash) continue;

        // Check if hash exists for this project (Tier 4 Performance)
        const { data } = await supabase
            .from("project_memory")
            .select("id")
            .eq("project_id", chunk.project_id)
            .eq("content_hash", chunk.content_hash)
            .single();

        if (!data) {
            newChunks.push(chunk);
        } else {
            console.log(`Duplicate chunk found (hash: ${chunk.content_hash}), skipping embedding.`);
        }
    }

    if (newChunks.length === 0) return;

    // 2. Insert new chunks
    const { error } = await supabase
        .from("project_memory")
        .insert(newChunks);

    if (error) {
        console.error("Error saving RAG chunks:", error);
        throw error;
    }
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
