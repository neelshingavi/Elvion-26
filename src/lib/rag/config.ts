/**
 * RAG Configuration Constants
 * Centralized configuration for production-grade RAG system
 */

export const RAG_CONFIG = {
    // Tier 1: Similarity Thresholding
    MIN_SIMILARITY: parseFloat(process.env.RAG_MIN_SIMILARITY || "0.65"),
    MIN_CONFIDENCE: parseFloat(process.env.RAG_MIN_CONFIDENCE || "0.5"),

    // Tier 2: Retrieval Settings
    DEFAULT_LIMIT: parseInt(process.env.RAG_DEFAULT_LIMIT || "8", 10),
    MAX_LIMIT: parseInt(process.env.RAG_MAX_LIMIT || "20", 10),

    // Tier 2: Chunking Strategy
    CHUNK_SIZE: parseInt(process.env.RAG_CHUNK_SIZE || "800", 10),
    CHUNK_OVERLAP: parseInt(process.env.RAG_CHUNK_OVERLAP || "80", 10),

    // Tier 2: Hybrid Search Weights
    VECTOR_WEIGHT: parseFloat(process.env.RAG_VECTOR_WEIGHT || "0.7"),
    KEYWORD_WEIGHT: parseFloat(process.env.RAG_KEYWORD_WEIGHT || "0.3"),

    // Tier 2: Temporal Decay (days)
    AGE_DECAY_DAYS: parseFloat(process.env.RAG_AGE_DECAY_DAYS || "90"),

    // Tier 3: Context Compression
    ENABLE_COMPRESSION: process.env.RAG_ENABLE_COMPRESSION === "true",

    // Tier 4: Performance
    EMBEDDING_BATCH_SIZE: parseInt(process.env.RAG_BATCH_SIZE || "5", 10),
    ENABLE_DEDUPLICATION: process.env.RAG_ENABLE_DEDUP !== "false", // Default true

    // Tier 4: Safety
    ENABLE_SANITIZATION: process.env.RAG_ENABLE_SANITIZATION !== "false", // Default true
} as const;

/**
 * Memory Type Definitions
 */
export const MEMORY_TYPES = [
    "decision",
    "metric",
    "investor_feedback",
    "task",
    "research",
    "note"
] as const;

export type MemoryType = typeof MEMORY_TYPES[number];

/**
 * Ranking Formula Documentation
 * 
 * FINAL_SCORE = BASE_HYBRID_SCORE × FOUNDER_WEIGHT × TEMPORAL_DECAY
 * 
 * Where:
 * - BASE_HYBRID_SCORE = (VECTOR_SIMILARITY × 0.7) + (KEYWORD_SCORE × 0.3)
 * - FOUNDER_WEIGHT = 1.0 (default) or 1.5 (founder override)
 * - TEMPORAL_DECAY = exp(-days_old / 90)
 * 
 * Confidence Score:
 * - CONFIDENCE = (top_score × 0.7) + (avg_score × 0.3)
 * - Threshold: 0.5 (configurable)
 */
