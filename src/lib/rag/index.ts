import { generateEmbedding } from "@/lib/gemini";
import { searchSimilar, SearchResult } from "./database";
import { callGemini } from "@/lib/gemini";

interface RetrievalResult {
    content: string;
    final_score: number;
    memory_type: string;
    confidence: number;
}

/**
 * Tier 2: Confidence Scoring Layer
 */
function calculateConfidence(results: SearchResult[]): number {
    if (results.length === 0) return 0;

    // Weighted Average
    const sum = results.reduce((acc, r) => acc + r.final_score, 0);
    const avg = sum / results.length;

    return (avg * 0.7) + (results[0].final_score * 0.3);
}

/**
 * Tier 3: Context Compression (Summarize chunks for LLM)
 */
async function summarizeChunks(chunks: SearchResult[]): Promise<string> {
    const rawContext = chunks.map(c => `[TYPE: ${c.memory_type}] ${c.content}`).join("\n\n");

    const prompt = `You are a Retrieval Summarizer. Summarize the following project memories into a concise, actionable context block for an AI agent.
    
    Memories:
    ${rawContext}
    
    Constraints:
    - Retain specific numbers, dates, and names.
    - Group by topic.
    - Be extremely concise.
    `;

    try {
        const summary = await callGemini(prompt, false);
        return summary.trim();
    } catch {
        return rawContext; // Fallback
    }
}

/**
 * Main Retrieval Function (Tier 1-4 Compliant)
 */
export async function retrieveContext(
    projectId: string,
    query: string,
    options: {
        limit?: number;
        minSimilarity?: number;
        requiredTypes?: string[];
    } = {}
): Promise<{ text: string; confidence: number }> {

    console.log(`[RAG] Query: "${query}" (Project: ${projectId})`);

    // Tier 2: Generate Vector Step
    const queryEmbedding = await generateEmbedding(query);

    // Tier 2: Hybrid Search (Vector + Keyword)
    const results = await searchSimilar(projectId, queryEmbedding, query, {
        limit: options.limit || 8,
        minSimilarity: options.minSimilarity || 0.65, // Mandatory Threshold
        types: options.requiredTypes
    });

    if (results.length === 0) {
        console.warn("[RAG] No results found above threshold.");
        return { text: "No relevant project memory found.", confidence: 0 };
    }

    // Tier 2: Confidence Calculation
    const confidence = calculateConfidence(results);
    console.log(`[RAG] Confidence Score: ${confidence.toFixed(2)}`);

    // Tier 4: Logging (Mandatory)
    console.log("[RAG] Retrieved chunks:", results.map(r => ({
        id: r.id,
        score: r.final_score,
        type: r.memory_type
    })));

    // Tier 3: Context Compression
    const contextText = await summarizeChunks(results);

    return {
        text: `<context>\n${contextText}\n</context>`,
        confidence
    };
}

export * from "./database";
export * from "./ingestion";
