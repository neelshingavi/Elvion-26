/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Type Definitions
 * 
 * This file defines the core types for the production-grade RAG system
 * with multi-tenant isolation, causal memory integrity, and India-specific localization.
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type MemorySourceType =
    | "founder_input"
    | "ai_analysis"
    | "market_research"
    | "competitor_intel"
    | "regulatory_data"
    | "financial_projection"
    | "customer_feedback"
    | "meeting_transcript"
    | "document_extract"
    | "web_search"
    | "founder_override"
    | "pitch_feedback"
    | "investor_interaction";

export type FounderStage =
    | "ideation"
    | "validation"
    | "mvp"
    | "launch"
    | "growth"
    | "scale"
    | "pivot";

export type CausalRelationship =
    | "supersedes"      // New memory invalidates old
    | "refines"         // New memory adds detail to old
    | "contradicts"     // New memory conflicts with old (requires resolution)
    | "supports"        // New memory provides evidence for old
    | "extends"         // New memory builds upon old
    | "corrects";       // Founder override corrects AI-generated content

export type ConfidenceLevel = "very_low" | "low" | "medium" | "high" | "very_high" | "founder_verified";

export type AgentRole = "supervisor" | "researcher" | "strategist" | "localizer" | "critic" | "executor";

export type RetrievalIntent =
    | "factual_lookup"
    | "strategic_context"
    | "historical_comparison"
    | "current_state"
    | "trend_analysis"
    | "regulatory_check"
    | "competitive_analysis"
    | "decision_support";

// ============================================================================
// MEMORY CHUNK SCHEMA
// ============================================================================

export interface MemoryChunk {
    // Primary identifiers
    id: string;
    project_id: string;                     // HARD-ENFORCED tenant isolation

    // Semantic content
    content: string;                        // The actual memory content
    content_hash: string;                   // SHA-256 for deduplication
    embedding: number[];                    // Vector embedding (1536 dimensions for text-embedding-ada-002)

    // Source tracking
    source_type: MemorySourceType;
    source_id: string;                      // Reference to original source
    source_url?: string;                    // If applicable

    // Temporal validity
    valid_from: Date;
    valid_until?: Date;                     // null = evergreen
    is_evergreen: boolean;
    temporal_relevance: "historical" | "current" | "projected";

    // Confidence and weighting
    confidence_score: number;               // 0.0 - 1.0
    confidence_level: ConfidenceLevel;
    founder_weight: number;                 // Higher = prioritize in retrieval (0.0 - 2.0)
    credibility_score: number;              // Source credibility (0.0 - 1.0)

    // Causal linkage
    causal_parent_id?: string;
    causal_relationship?: CausalRelationship;
    causal_chain_depth: number;             // 0 = root memory

    // Context classification
    founder_stage: FounderStage;
    tags: string[];
    categories: string[];

    // India-specific context
    indian_context: boolean;
    requires_localization: boolean;
    regulatory_domain?: string;             // e.g., "RBI", "SEBI", "GST", "Labor Law"

    // Retrieval metadata
    retrieval_count: number;
    last_retrieved_at?: Date;
    average_usefulness_score: number;       // Feedback-based (0.0 - 1.0)

    // Audit trail
    created_at: Date;
    created_by: string;                     // User ID or "system"
    updated_at: Date;
    invalidated_at?: Date;
    invalidation_reason?: string;

    // Status
    is_active: boolean;
    is_invalidated: boolean;
}

// ============================================================================
// INGESTION TYPES
// ============================================================================

export interface IngestionRequest {
    project_id: string;
    content: string;
    source_type: MemorySourceType;
    source_id: string;
    source_url?: string;
    founder_stage: FounderStage;
    is_founder_override: boolean;
    metadata?: Record<string, any>;
    priority: "low" | "normal" | "high" | "critical";
}

export interface ChunkingResult {
    chunks: SemanticChunk[];
    total_tokens: number;
    chunk_method: "semantic" | "sliding_window" | "special_case";
    special_content_types: SpecialContentType[];
}

export interface SemanticChunk {
    content: string;
    start_offset: number;
    end_offset: number;
    semantic_boundary: string;              // e.g., "paragraph", "section", "list_item"
    estimated_tokens: number;
    special_content?: SpecialContentType;
}

export type SpecialContentType = "table" | "code_block" | "image_description" | "quote" | "list" | "heading";

export interface IngestionJob {
    id: string;
    project_id: string;
    status: "queued" | "processing" | "completed" | "failed" | "retrying";
    request: IngestionRequest;
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    error?: string;
    retry_count: number;
    max_retries: number;
    chunks_created: number;
}

// ============================================================================
// RETRIEVAL TYPES
// ============================================================================

export interface RetrievalQuery {
    project_id: string;                     // HARD-ENFORCED
    query: string;
    intent: RetrievalIntent;
    founder_stage?: FounderStage;
    required_tags?: string[];
    excluded_tags?: string[];
    temporal_filter?: TemporalFilter;
    require_indian_context?: boolean;
    min_confidence?: number;
    max_results: number;
    include_invalidated?: boolean;          // For historical analysis only
}

export interface TemporalFilter {
    type: "current_only" | "historical" | "range" | "latest";
    from?: Date;
    to?: Date;
}

export interface RetrievalResult {
    chunks: RankedChunk[];
    total_found: number;
    retrieval_confidence: number;           // Overall confidence in results
    gaps_detected: string[];                // Areas where memory is insufficient
    stale_data_warnings: string[];
    localization_applied: boolean;
    query_decomposition?: string[];         // If recursive retrieval was used
}

export interface RankedChunk extends MemoryChunk {
    similarity_score: number;               // Vector similarity (0.0 - 1.0)
    combined_score: number;                 // Weighted combination of all factors
    relevance_explanation: string;          // Why this chunk was retrieved
    temporal_decay_applied: number;         // Decay factor applied (1.0 = no decay)
    recency_boost: number;                  // Boost for recent content
}

// ============================================================================
// AGENT ORCHESTRATION TYPES
// ============================================================================

export interface AgentContext {
    project_id: string;
    user_id: string;
    session_id: string;
    query: string;
    intent: RetrievalIntent;
    founder_stage: FounderStage;
    previous_context?: MemoryChunk[];
    conversation_history?: ConversationTurn[];
}

export interface ConversationTurn {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    memory_chunks_used?: string[];          // IDs of chunks used
}

export interface AgentDecision {
    agent: AgentRole;
    action: AgentAction;
    reasoning: string;
    confidence: number;
    next_agent?: AgentRole;
    should_continue: boolean;
}

export type AgentAction =
    | { type: "retrieve"; params: RetrievalQuery }
    | { type: "re_query"; params: { decomposed_queries: string[] } }
    | { type: "validate_localization"; params: { chunks: string[] } }
    | { type: "detect_gaps"; params: { context: string } }
    | { type: "trigger_web_search"; params: { query: string; india_focus: boolean } }
    | { type: "synthesize"; params: { chunks: RankedChunk[]; query: string } }
    | { type: "escalate"; params: { reason: string } }
    | { type: "complete"; params: { response: string; confidence: number } };

export interface SupervisorState {
    project_id: string;
    session_id: string;
    current_step: number;
    max_steps: number;
    agents_invoked: AgentRole[];
    total_chunks_retrieved: number;
    overall_confidence: number;
    gaps_detected: string[];
    localization_status: "pending" | "validated" | "corrected" | "not_required";
    is_complete: boolean;
}

// ============================================================================
// MEMORY UPDATE TYPES
// ============================================================================

export interface MemoryUpdate {
    target_chunk_id: string;
    update_type: "invalidate" | "supersede" | "refine" | "correct";
    new_content?: string;
    reason: string;
    initiated_by: "system" | "founder" | "agent";
    causal_relationship: CausalRelationship;
}

export interface MemoryConflict {
    chunk_a_id: string;
    chunk_b_id: string;
    conflict_type: "temporal" | "factual" | "interpretation";
    description: string;
    resolution_strategy: "prefer_newer" | "prefer_founder" | "prefer_higher_confidence" | "require_manual";
    resolved: boolean;
    resolution?: string;
}

// ============================================================================
// SECURITY & AUDIT TYPES
// ============================================================================

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    project_id: string;
    user_id: string;
    action: AuditAction;
    resource_type: "memory_chunk" | "ingestion_job" | "retrieval" | "agent_session";
    resource_id: string;
    details: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
}

export type AuditAction =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "invalidate"
    | "retrieve"
    | "search"
    | "export";

export interface RateLimitConfig {
    embeddings_per_minute: number;
    retrievals_per_minute: number;
    web_searches_per_hour: number;
    memory_updates_per_hour: number;
}

export interface RateLimitStatus {
    project_id: string;
    embeddings_remaining: number;
    retrievals_remaining: number;
    web_searches_remaining: number;
    memory_updates_remaining: number;
    reset_at: Date;
}

// ============================================================================
// INDIA LOCALIZATION TYPES
// ============================================================================

export interface IndiaContext {
    requires_localization: boolean;
    regulatory_domains: string[];
    detected_us_eu_assumptions: string[];
    corrections_applied: string[];
    relevant_regulations: RegulationReference[];
}

export interface RegulationReference {
    domain: string;                         // e.g., "SEBI", "RBI", "MCA"
    regulation_name: string;
    summary: string;
    last_updated: Date;
    source_url: string;
    applicability_conditions?: string;
}

// ============================================================================
// DATABASE SCHEMA (PostgreSQL + pgvector)
// ============================================================================

/**
 * SQL Schema (for reference - to be executed in PostgreSQL):
 * 
 * -- Enable pgvector extension
 * CREATE EXTENSION IF NOT EXISTS vector;
 * 
 * -- Memory chunks table
 * CREATE TABLE memory_chunks (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     project_id UUID NOT NULL REFERENCES projects(id),
 *     content TEXT NOT NULL,
 *     content_hash VARCHAR(64) NOT NULL,
 *     embedding vector(1536),
 *     
 *     source_type VARCHAR(50) NOT NULL,
 *     source_id VARCHAR(255) NOT NULL,
 *     source_url TEXT,
 *     
 *     valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     valid_until TIMESTAMPTZ,
 *     is_evergreen BOOLEAN DEFAULT FALSE,
 *     temporal_relevance VARCHAR(20) DEFAULT 'current',
 *     
 *     confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
 *     confidence_level VARCHAR(20) NOT NULL DEFAULT 'medium',
 *     founder_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
 *     credibility_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
 *     
 *     causal_parent_id UUID REFERENCES memory_chunks(id),
 *     causal_relationship VARCHAR(20),
 *     causal_chain_depth INTEGER DEFAULT 0,
 *     
 *     founder_stage VARCHAR(20) NOT NULL,
 *     tags TEXT[] DEFAULT '{}',
 *     categories TEXT[] DEFAULT '{}',
 *     
 *     indian_context BOOLEAN DEFAULT FALSE,
 *     requires_localization BOOLEAN DEFAULT FALSE,
 *     regulatory_domain VARCHAR(50),
 *     
 *     retrieval_count INTEGER DEFAULT 0,
 *     last_retrieved_at TIMESTAMPTZ,
 *     average_usefulness_score DECIMAL(3,2) DEFAULT 0.5,
 *     
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     created_by VARCHAR(255) NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT NOW(),
 *     invalidated_at TIMESTAMPTZ,
 *     invalidation_reason TEXT,
 *     
 *     is_active BOOLEAN DEFAULT TRUE,
 *     is_invalidated BOOLEAN DEFAULT FALSE,
 *     
 *     CONSTRAINT unique_content_per_project UNIQUE (project_id, content_hash)
 * );
 * 
 * -- HNSW index for vector similarity search
 * CREATE INDEX idx_memory_chunks_embedding 
 *     ON memory_chunks USING hnsw (embedding vector_cosine_ops)
 *     WITH (m = 16, ef_construction = 64);
 * 
 * -- Composite indexes for filtered searches
 * CREATE INDEX idx_memory_chunks_project_active 
 *     ON memory_chunks (project_id, is_active, is_invalidated);
 * CREATE INDEX idx_memory_chunks_project_stage 
 *     ON memory_chunks (project_id, founder_stage);
 * CREATE INDEX idx_memory_chunks_project_tags 
 *     ON memory_chunks USING gin (tags);
 * CREATE INDEX idx_memory_chunks_temporal 
 *     ON memory_chunks (project_id, valid_from, valid_until);
 * 
 * -- Row-Level Security (RLS) for multi-tenancy
 * ALTER TABLE memory_chunks ENABLE ROW LEVEL SECURITY;
 * 
 * CREATE POLICY memory_chunks_tenant_isolation ON memory_chunks
 *     USING (project_id = current_setting('app.current_project_id')::uuid);
 * 
 * CREATE POLICY memory_chunks_insert_policy ON memory_chunks
 *     FOR INSERT
 *     WITH CHECK (project_id = current_setting('app.current_project_id')::uuid);
 * 
 * CREATE POLICY memory_chunks_update_policy ON memory_chunks
 *     FOR UPDATE
 *     USING (project_id = current_setting('app.current_project_id')::uuid);
 * 
 * CREATE POLICY memory_chunks_delete_policy ON memory_chunks
 *     FOR DELETE
 *     USING (project_id = current_setting('app.current_project_id')::uuid);
 */

export const SQL_SCHEMA = `
-- See above for complete PostgreSQL schema with pgvector and RLS
-- This constant is for documentation/migration purposes
`;
