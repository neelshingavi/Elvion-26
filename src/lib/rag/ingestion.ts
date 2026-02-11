import { callGemini, generateEmbedding } from "@/lib/gemini";
import { saveChunks, MemoryChunk } from "./database";
import * as crypto from "crypto";

/**
 * Generate SHA-256 hash for content deduplication (Tier 4 Perf)
 */
function createHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Sanitize prompt injection attempts (Tier 4 Safety)
 */
function sanitizeContent(content: string): string {
    const maliciousPatterns = [
        /ignore previous instructions/gi,
        /you are chatgpt/gi,
        /system prompt/gi,
        /role override/gi
    ];
    let clean = content;
    maliciousPatterns.forEach(pattern => {
        clean = clean.replace(pattern, "[REDACTED]");
    });
    return clean;
}

/**
 * Tier 3: Memory Type Classification via Gemini
 */
async function classifyChunk(text: string): Promise<string> {
    const prompt = `Classify the following startup text into exactly ONE of these categories: [decision, metric, investor_feedback, task, research, note].
    
    Text: "${text.substring(0, 300)}..."
    
    Return ONLY the category name.`;

    try {
        const type = await callGemini(prompt, false); // isJson=false
        return type.trim().toLowerCase();
    } catch {
        return "note"; // Fallback
    }
}

/**
 * Tier 2: Refactored Chunking Strategy (800 chars, 80 overlap)
 */
export function chunkText(text: string, size: number = 800, overlap: number = 80): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + size, text.length);
        chunks.push(text.substring(start, end));
        start += (size - overlap);
    }
    return chunks;
}

export async function ingestDocument(
    projectId: string,
    content: string,
    metadata: Record<string, any> = {},
    options: { founderWeight?: number; type?: string } = {}
) {
    const cleanContent = sanitizeContent(content);
    const chunks = chunkText(cleanContent);
    const memoryChunks: MemoryChunk[] = [];

    // Batch Process (Tier 4 Perf)
    const BATCH_SIZE = 5; // Configurable
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (chunk) => {
            try {
                // Tier 4: Hash Check (Deduplication)
                const contentHash = createHash(chunk);

                // Tier 3: Auto-Classification
                const memoryType = options.type || await classifyChunk(chunk);

                const embedding = await generateEmbedding(chunk);

                memoryChunks.push({
                    project_id: projectId,
                    content: chunk,
                    embedding,
                    content_hash: contentHash, // For deduplication
                    memory_type: memoryType,   // For filtering/boost
                    founder_weight: options.founderWeight || 1.0, // Tier 3
                    metadata: {
                        ...metadata,
                        chunk_index: memoryChunks.length,
                        type: memoryType
                    },
                    is_active: true
                });
            } catch (err) {
                console.error(`Chunk embedding failed:`, err);
            }
        }));
    }

    if (memoryChunks.length > 0) {
        await saveChunks(memoryChunks);
    }

    return memoryChunks.length;
}
