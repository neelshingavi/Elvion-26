/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Main Interface
 * 
 * This module provides the unified API for the RAG system, integrating:
 * - Agent orchestration
 * - Memory ingestion
 * - Memory updates
 * - Security enforcement
 * 
 * All operations are project-scoped and security-validated.
 */

import {
    AgentContext,
    RetrievalIntent,
    FounderStage,
    MemorySourceType,
    RankedChunk,
    IngestionRequest,
    MemoryUpdate
} from "./types";
import { createSupervisor, SupervisorAgent } from "./agents";
import { processIngestion, IngestionResult } from "./ingestion";
import { createMemoryUpdater, runMemoryMaintenance } from "./memory-update";
import {
    createSecurityContext,
    checkAndLogRateLimit,
    securedSanitize,
    logRetrieval,
    SecurityContext,
    getRateLimitStatus
} from "./security";

// ============================================================================
// MAIN RAG CLIENT
// ============================================================================

/**
 * FounderFlowRAG - The main interface for the Synthetic Long-Term Memory system.
 * 
 * This class enforces:
 * - Multi-tenant isolation at every operation
 * - Security validation and sanitization
 * - Rate limiting
 * - Comprehensive audit logging
 */
export class FounderFlowRAG {
    private projectId: string;
    private userId: string;
    private securityContext: SecurityContext | null = null;
    private supervisor: SupervisorAgent | null = null;

    private constructor(projectId: string, userId: string) {
        this.projectId = projectId;
        this.userId = userId;
    }

    /**
     * Create a new RAG client with full security validation.
     * This is the ONLY way to create a RAG client.
     */
    static async create(
        projectId: string,
        userId: string,
        options: {
            ipAddress?: string;
            userAgent?: string;
            isPremium?: boolean;
        } = {}
    ): Promise<{ client: FounderFlowRAG | null; error?: string }> {
        const client = new FounderFlowRAG(projectId, userId);

        // Create and validate security context
        const { context, error } = await createSecurityContext(
            projectId,
            userId,
            options
        );

        if (!context) {
            return { client: null, error };
        }

        client.securityContext = context;
        client.supervisor = createSupervisor(projectId, userId, context.sessionId);

        console.log(`[RAG] Client created for project ${projectId.substring(0, 8)}... session ${context.sessionId.substring(0, 8)}...`);

        return { client };
    }

    /**
     * Query the memory system with agent orchestration.
     * This is the main retrieval interface.
     */
    async query(
        query: string,
        options: {
            intent?: RetrievalIntent;
            founderStage?: FounderStage;
            conversationHistory?: { role: "user" | "assistant"; content: string }[];
        } = {}
    ): Promise<{
        success: boolean;
        response: string;
        chunks: RankedChunk[];
        confidence: number;
        diagnostics: string[];
        error?: string;
    }> {
        if (!this.securityContext || !this.supervisor) {
            return {
                success: false,
                response: "",
                chunks: [],
                confidence: 0,
                diagnostics: [],
                error: "Security context not initialized"
            };
        }

        // Check rate limit
        const rateCheck = await checkAndLogRateLimit(this.securityContext, "retrieval");
        if (!rateCheck.allowed) {
            return {
                success: false,
                response: "",
                chunks: [],
                confidence: 0,
                diagnostics: [`Rate limit exceeded. Reset at ${rateCheck.reset_at.toISOString()}`],
                error: `Rate limit exceeded. Try again in ${Math.ceil((rateCheck.reset_at.getTime() - Date.now()) / 1000)} seconds`
            };
        }

        // Sanitize input
        const { result: sanitized, allowed } = await securedSanitize(
            this.securityContext,
            query,
            "query"
        );

        if (!allowed) {
            return {
                success: false,
                response: "",
                chunks: [],
                confidence: 0,
                diagnostics: sanitized.warnings,
                error: sanitized.block_reason
            };
        }

        try {
            // Build agent context
            const context: AgentContext = {
                project_id: this.projectId,
                user_id: this.userId,
                session_id: this.securityContext.sessionId,
                query: sanitized.sanitized,
                intent: options.intent || "factual_lookup",
                founder_stage: options.founderStage || "ideation",
                conversation_history: options.conversationHistory?.map(turn => ({
                    ...turn,
                    timestamp: new Date()
                }))
            };

            // Execute orchestrated retrieval
            const result = await this.supervisor.processQuery(context);

            // Log retrieval
            await logRetrieval(
                this.securityContext,
                sanitized.sanitized,
                result.chunks_used.map(c => c.id),
                result.confidence
            );

            return {
                success: true,
                response: result.response,
                chunks: result.chunks_used,
                confidence: result.confidence,
                diagnostics: [
                    ...result.diagnostics,
                    ...sanitized.warnings
                ]
            };

        } catch (error: any) {
            console.error(`[RAG] Query error:`, error);
            return {
                success: false,
                response: "",
                chunks: [],
                confidence: 0,
                diagnostics: [`Query failed: ${error.message}`],
                error: error.message
            };
        }
    }

    /**
     * Ingest new content into the memory system.
     * Content is processed asynchronously with semantic chunking.
     */
    async ingest(
        content: string,
        options: {
            sourceType: MemorySourceType;
            sourceId: string;
            sourceUrl?: string;
            founderStage: FounderStage;
            isFounderOverride?: boolean;
            metadata?: Record<string, any>;
            priority?: "low" | "normal" | "high" | "critical";
        }
    ): Promise<{
        success: boolean;
        result?: IngestionResult;
        error?: string;
    }> {
        if (!this.securityContext) {
            return { success: false, error: "Security context not initialized" };
        }

        // Check rate limit for embedding (ingestion requires embeddings)
        const rateCheck = await checkAndLogRateLimit(this.securityContext, "embedding");
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Rate limit exceeded. Reset at ${rateCheck.reset_at.toISOString()}`
            };
        }

        // Sanitize content
        const { result: sanitized, allowed } = await securedSanitize(
            this.securityContext,
            content,
            "content"
        );

        if (!allowed) {
            return { success: false, error: sanitized.block_reason };
        }

        try {
            // Build ingestion request
            const request: IngestionRequest = {
                project_id: this.projectId,
                content: sanitized.sanitized,
                source_type: options.sourceType,
                source_id: options.sourceId,
                source_url: options.sourceUrl,
                founder_stage: options.founderStage,
                is_founder_override: options.isFounderOverride || false,
                metadata: options.metadata,
                priority: options.priority || "normal"
            };

            // Process ingestion
            const result = await processIngestion(request, this.userId);

            console.log(`[RAG] Ingested ${result.chunks_created.length} chunks, ${result.duplicates_skipped} duplicates skipped`);

            return {
                success: result.errors.length === 0,
                result,
                error: result.errors.length > 0 ? result.errors.join("; ") : undefined
            };

        } catch (error: any) {
            console.error(`[RAG] Ingestion error:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update an existing memory chunk.
     * Supports invalidation, supersession, refinement, and correction.
     */
    async updateMemory(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken?: string;
        new_chunk_id?: string;
        error?: string;
    }> {
        if (!this.securityContext) {
            return { success: false, error: "Security context not initialized" };
        }

        // Check rate limit
        const rateCheck = await checkAndLogRateLimit(this.securityContext, "memory_update");
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Rate limit exceeded. Reset at ${rateCheck.reset_at.toISOString()}`
            };
        }

        // Sanitize new content if provided
        if (update.new_content) {
            const { result: sanitized, allowed } = await securedSanitize(
                this.securityContext,
                update.new_content,
                "content"
            );

            if (!allowed) {
                return { success: false, error: sanitized.block_reason };
            }

            update.new_content = sanitized.sanitized;
        }

        try {
            const updater = createMemoryUpdater(this.projectId, this.userId);
            const result = await updater.processUpdate(update);

            return {
                success: result.success,
                action_taken: result.action_taken,
                new_chunk_id: result.new_chunk_id,
                error: result.success ? undefined : result.action_taken
            };

        } catch (error: any) {
            console.error(`[RAG] Update error:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Founder correction - highest priority memory update.
     * Creates a founder_override that takes precedence in retrieval.
     */
    async founderCorrect(
        targetChunkId: string,
        correctedContent: string,
        reason: string
    ): Promise<{
        success: boolean;
        new_chunk_id?: string;
        error?: string;
    }> {
        const result = await this.updateMemory({
            target_chunk_id: targetChunkId,
            update_type: "correct",
            new_content: correctedContent,
            reason,
            initiated_by: "founder",
            causal_relationship: "corrects"
        });

        if (result.success) {
            console.log(`[RAG] Founder correction applied: ${result.new_chunk_id?.substring(0, 8)}...`);
        }

        return result;
    }

    /**
     * Get current rate limit status for this project.
     */
    getRateLimitStatus() {
        if (!this.securityContext) {
            return null;
        }
        return getRateLimitStatus(
            this.projectId,
            this.securityContext.rateLimits.embeddings_per_minute > 100
        );
    }

    /**
     * Get session ID for tracking.
     */
    getSessionId(): string | null {
        return this.securityContext?.sessionId || null;
    }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick query without maintaining a client instance.
 * Useful for one-off queries.
 */
export async function quickQuery(
    projectId: string,
    userId: string,
    query: string,
    options: {
        intent?: RetrievalIntent;
        founderStage?: FounderStage;
    } = {}
): Promise<{
    success: boolean;
    response: string;
    confidence: number;
    error?: string;
}> {
    const { client, error } = await FounderFlowRAG.create(projectId, userId);

    if (!client) {
        return { success: false, response: "", confidence: 0, error };
    }

    const result = await client.query(query, options);

    return {
        success: result.success,
        response: result.response,
        confidence: result.confidence,
        error: result.error
    };
}

/**
 * Quick ingest without maintaining a client instance.
 */
export async function quickIngest(
    projectId: string,
    userId: string,
    content: string,
    sourceType: MemorySourceType,
    founderStage: FounderStage
): Promise<{
    success: boolean;
    chunks_created: number;
    error?: string;
}> {
    const { client, error } = await FounderFlowRAG.create(projectId, userId);

    if (!client) {
        return { success: false, chunks_created: 0, error };
    }

    const result = await client.ingest(content, {
        sourceType,
        sourceId: `quick_ingest_${Date.now()}`,
        founderStage
    });

    return {
        success: result.success,
        chunks_created: result.result?.chunks_created.length || 0,
        error: result.error
    };
}

// ============================================================================
// MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Run scheduled maintenance for a project.
 * Should be called by a cron job.
 */
export async function runProjectMaintenance(projectId: string, userId: string) {
    console.log(`[RAG] Running maintenance for project ${projectId.substring(0, 8)}...`);

    const result = await runMemoryMaintenance(projectId, userId);

    console.log(`[RAG] Maintenance complete: ${result.stale_marked} stale, ${result.chains_consolidated} chains consolidated, ${result.duplicates_merged} duplicates merged`);

    return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from "./types";
export * from "./database";
export * from "./ingestion";
export * from "./agents";
export * from "./memory-update";
export * from "./security";
