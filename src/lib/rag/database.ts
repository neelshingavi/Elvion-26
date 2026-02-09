/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * PostgreSQL + pgvector Database Client
 * 
 * This module provides the database connection layer with:
 * - Strict multi-tenant isolation via RLS
 * - Connection pooling
 * - Automatic project_id scoping
 */

// NOTE: In production, use @neondatabase/serverless or pg with connection pooling
// For now, we define the interface and mock implementation

import {
    MemoryChunk,
    RetrievalQuery,
    RankedChunk,
    IngestionJob,
    AuditLogEntry,
    MemoryUpdate,
    TemporalFilter
} from "./types";

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export interface DatabaseConfig {
    connectionString: string;
    maxConnections: number;
    idleTimeout: number;
    ssl: boolean;
}

export const DEFAULT_CONFIG: DatabaseConfig = {
    connectionString: process.env.DATABASE_URL || "",
    maxConnections: 10,
    idleTimeout: 30000,
    ssl: process.env.NODE_ENV === "production"
};

// ============================================================================
// PROJECT-SCOPED DATABASE CLIENT
// ============================================================================

/**
 * ProjectScopedClient ensures ALL operations are scoped to a single project_id.
 * This is the ONLY way to interact with the memory database.
 * Cross-project queries are architecturally impossible through this interface.
 */
export class ProjectScopedClient {
    private projectId: string;
    private userId: string;

    constructor(projectId: string, userId: string) {
        if (!projectId || projectId.length < 10) {
            throw new Error("SECURITY: Invalid project_id - multi-tenant isolation requires valid project_id");
        }
        this.projectId = projectId;
        this.userId = userId;
    }

    /**
     * Get project ID - for audit logging only
     */
    getProjectId(): string {
        return this.projectId;
    }

    /**
     * Set RLS context before any query
     * MUST be called at the start of every database transaction
     */
    private async setRLSContext(/* db connection */): Promise<void> {
        // In production PostgreSQL:
        // await db.query(`SET app.current_project_id = $1`, [this.projectId]);
        // await db.query(`SET app.current_user_id = $1`, [this.userId]);
        console.log(`[RLS] Context set for project: ${this.projectId.substring(0, 8)}...`);
    }

    // =========================================================================
    // MEMORY CHUNK OPERATIONS
    // =========================================================================

    /**
     * Insert a new memory chunk
     * Project ID is automatically enforced - cannot be overridden
     */
    async insertMemoryChunk(chunk: Omit<MemoryChunk, "id" | "project_id" | "created_at" | "updated_at">): Promise<MemoryChunk> {
        await this.setRLSContext();

        const id = crypto.randomUUID();
        const now = new Date();

        const fullChunk: MemoryChunk = {
            ...chunk,
            id,
            project_id: this.projectId, // HARD-ENFORCED
            created_at: now,
            updated_at: now
        };

        // In production PostgreSQL with pgvector:
        /*
        const result = await db.query(`
            INSERT INTO memory_chunks (
                id, project_id, content, content_hash, embedding,
                source_type, source_id, source_url,
                valid_from, valid_until, is_evergreen, temporal_relevance,
                confidence_score, confidence_level, founder_weight, credibility_score,
                causal_parent_id, causal_relationship, causal_chain_depth,
                founder_stage, tags, categories,
                indian_context, requires_localization, regulatory_domain,
                retrieval_count, average_usefulness_score,
                created_by, is_active, is_invalidated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
            RETURNING *
        `, [...values]);
        */

        await this.logAudit("create", "memory_chunk", id, { source_type: chunk.source_type });

        return fullChunk;
    }

    /**
     * Vector similarity search with mandatory project filtering
     * Uses HNSW index for performance
     */
    async searchSimilar(
        queryEmbedding: number[],
        options: {
            maxResults: number;
            minSimilarity?: number;
            founderStage?: string;
            tags?: string[];
            excludeTags?: string[];
            temporalFilter?: TemporalFilter;
            requireIndianContext?: boolean;
            includeInvalidated?: boolean;
        }
    ): Promise<RankedChunk[]> {
        await this.setRLSContext();

        const {
            maxResults,
            minSimilarity = 0.5,
            founderStage,
            tags,
            excludeTags,
            temporalFilter,
            requireIndianContext,
            includeInvalidated = false
        } = options;

        // In production PostgreSQL with pgvector:
        /*
        // Build WHERE conditions
        let conditions = [`project_id = $1`]; // RLS provides backup, but explicit is safer
        let params: any[] = [this.projectId];
        let paramIndex = 2;
        
        if (!includeInvalidated) {
            conditions.push(`is_active = true AND is_invalidated = false`);
        }
        
        if (founderStage) {
            conditions.push(`founder_stage = $${paramIndex++}`);
            params.push(founderStage);
        }
        
        if (tags && tags.length > 0) {
            conditions.push(`tags && $${paramIndex++}`);
            params.push(tags);
        }
        
        if (excludeTags && excludeTags.length > 0) {
            conditions.push(`NOT (tags && $${paramIndex++})`);
            params.push(excludeTags);
        }
        
        if (requireIndianContext) {
            conditions.push(`indian_context = true`);
        }
        
        if (temporalFilter) {
            switch (temporalFilter.type) {
                case "current_only":
                    conditions.push(`(valid_until IS NULL OR valid_until > NOW())`);
                    break;
                case "latest":
                    // Handled in ORDER BY
                    break;
                case "range":
                    if (temporalFilter.from) {
                        conditions.push(`valid_from >= $${paramIndex++}`);
                        params.push(temporalFilter.from);
                    }
                    if (temporalFilter.to) {
                        conditions.push(`valid_from <= $${paramIndex++}`);
                        params.push(temporalFilter.to);
                    }
                    break;
            }
        }
        
        const whereClause = conditions.join(" AND ");
        
        // Hybrid search: pre-filter by conditions, then vector similarity
        const result = await db.query(`
            WITH filtered_chunks AS (
                SELECT *
                FROM memory_chunks
                WHERE ${whereClause}
            )
            SELECT *,
                1 - (embedding <=> $${paramIndex}) as similarity_score,
                -- Combined score factors in multiple dimensions
                (
                    (1 - (embedding <=> $${paramIndex})) * 0.4 +
                    confidence_score * 0.2 +
                    founder_weight * 0.2 +
                    (CASE WHEN source_type = 'founder_override' THEN 0.3 ELSE 0 END) +
                    -- Temporal decay (halve relevance every 90 days for non-evergreen)
                    (CASE 
                        WHEN is_evergreen THEN 1.0
                        ELSE POWER(0.5, EXTRACT(EPOCH FROM (NOW() - valid_from)) / (90 * 24 * 3600))
                    END) * 0.1
                ) as combined_score
            FROM filtered_chunks
            WHERE 1 - (embedding <=> $${paramIndex}) >= $${paramIndex + 1}
            ORDER BY combined_score DESC
            LIMIT $${paramIndex + 2}
        `, [...params, queryEmbedding, minSimilarity, maxResults]);
        */

        await this.logAudit("search", "memory_chunk", "batch", {
            result_count: 0, // result.rows.length in production
            min_similarity: minSimilarity
        });

        // Return empty array - in production, return result.rows mapped to RankedChunk
        return [];
    }

    /**
     * Get memory chunk by ID (project-scoped)
     */
    async getChunkById(chunkId: string): Promise<MemoryChunk | null> {
        await this.setRLSContext();

        // In production:
        /*
        const result = await db.query(`
            SELECT * FROM memory_chunks
            WHERE id = $1 AND project_id = $2
        `, [chunkId, this.projectId]);
        
        return result.rows[0] || null;
        */

        await this.logAudit("read", "memory_chunk", chunkId, {});
        return null;
    }

    /**
     * Invalidate a memory chunk (never delete - maintain causal chain)
     */
    async invalidateChunk(chunkId: string, reason: string, supersedingChunkId?: string): Promise<void> {
        await this.setRLSContext();

        // In production:
        /*
        await db.query(`
            UPDATE memory_chunks
            SET 
                is_active = false,
                is_invalidated = true,
                invalidated_at = NOW(),
                invalidation_reason = $3,
                updated_at = NOW()
            WHERE id = $1 AND project_id = $2
        `, [chunkId, this.projectId, reason]);
        
        // If superseding, create causal link
        if (supersedingChunkId) {
            await db.query(`
                UPDATE memory_chunks
                SET causal_parent_id = $1, causal_relationship = 'supersedes'
                WHERE id = $2 AND project_id = $3
            `, [chunkId, supersedingChunkId, this.projectId]);
        }
        */

        await this.logAudit("invalidate", "memory_chunk", chunkId, { reason, superseding: supersedingChunkId });
    }

    /**
     * Update retrieval statistics
     */
    async recordRetrieval(chunkIds: string[], usefulnessScores?: Record<string, number>): Promise<void> {
        await this.setRLSContext();

        // In production:
        /*
        for (const chunkId of chunkIds) {
            const usefulness = usefulnessScores?.[chunkId];
            await db.query(`
                UPDATE memory_chunks
                SET 
                    retrieval_count = retrieval_count + 1,
                    last_retrieved_at = NOW(),
                    average_usefulness_score = CASE 
                        WHEN $3 IS NOT NULL THEN 
                            (average_usefulness_score * retrieval_count + $3) / (retrieval_count + 1)
                        ELSE average_usefulness_score
                    END,
                    updated_at = NOW()
                WHERE id = $1 AND project_id = $2
            `, [chunkId, this.projectId, usefulness]);
        }
        */

        await this.logAudit("retrieve", "memory_chunk", "batch", { chunk_count: chunkIds.length });
    }

    /**
     * Find conflicting memories
     */
    async findConflicts(newContent: string, newEmbedding: number[], threshold: number = 0.85): Promise<MemoryChunk[]> {
        await this.setRLSContext();

        // Find very similar existing chunks that might conflict
        // In production:
        /*
        const result = await db.query(`
            SELECT *
            FROM memory_chunks
            WHERE project_id = $1 
                AND is_active = true 
                AND is_invalidated = false
                AND 1 - (embedding <=> $2) >= $3
            ORDER BY 1 - (embedding <=> $2) DESC
            LIMIT 10
        `, [this.projectId, newEmbedding, threshold]);
        
        return result.rows;
        */

        return [];
    }

    /**
     * Get causal chain for a memory
     */
    async getCausalChain(chunkId: string, direction: "ancestors" | "descendants" | "both"): Promise<MemoryChunk[]> {
        await this.setRLSContext();

        // In production, use recursive CTE:
        /*
        const ancestorsQuery = `
            WITH RECURSIVE ancestors AS (
                SELECT * FROM memory_chunks WHERE id = $1 AND project_id = $2
                UNION ALL
                SELECT m.* FROM memory_chunks m
                JOIN ancestors a ON m.id = a.causal_parent_id
                WHERE m.project_id = $2
            )
            SELECT * FROM ancestors WHERE id != $1
        `;
        
        const descendantsQuery = `
            WITH RECURSIVE descendants AS (
                SELECT * FROM memory_chunks WHERE id = $1 AND project_id = $2
                UNION ALL
                SELECT m.* FROM memory_chunks m
                JOIN descendants d ON m.causal_parent_id = d.id
                WHERE m.project_id = $2
            )
            SELECT * FROM descendants WHERE id != $1
        `;
        */

        return [];
    }

    // =========================================================================
    // INGESTION JOB OPERATIONS
    // =========================================================================

    async createIngestionJob(job: Omit<IngestionJob, "id" | "created_at">): Promise<IngestionJob> {
        await this.setRLSContext();

        const fullJob: IngestionJob = {
            ...job,
            id: crypto.randomUUID(),
            created_at: new Date()
        };

        // In production: INSERT INTO ingestion_jobs ...

        await this.logAudit("create", "ingestion_job", fullJob.id, { status: job.status });
        return fullJob;
    }

    async updateIngestionJob(jobId: string, updates: Partial<IngestionJob>): Promise<void> {
        await this.setRLSContext();

        // In production: UPDATE ingestion_jobs SET ... WHERE id = $1 AND project_id = $2

        await this.logAudit("update", "ingestion_job", jobId, updates);
    }

    // =========================================================================
    // AUDIT LOG OPERATIONS
    // =========================================================================

    private async logAudit(
        action: AuditLogEntry["action"],
        resourceType: AuditLogEntry["resource_type"],
        resourceId: string,
        details: Record<string, any>
    ): Promise<void> {
        const entry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            project_id: this.projectId,
            user_id: this.userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details
        };

        // In production: INSERT INTO audit_logs ...
        // Also, in production this should be async/non-blocking
        console.log(`[AUDIT] ${action} ${resourceType}:${resourceId.substring(0, 8)}...`);
    }

    /**
     * Query audit logs for this project
     */
    async getAuditLogs(options: {
        from?: Date;
        to?: Date;
        action?: AuditLogEntry["action"];
        resourceType?: AuditLogEntry["resource_type"];
        limit?: number;
    }): Promise<AuditLogEntry[]> {
        await this.setRLSContext();

        // In production: SELECT * FROM audit_logs WHERE project_id = $1 ...

        return [];
    }
}

// ============================================================================
// DATABASE CLIENT FACTORY
// ============================================================================

/**
 * Creates a project-scoped database client.
 * This is the ONLY public interface for database access.
 * Direct database access without project scoping is architecturally forbidden.
 */
export function createProjectClient(projectId: string, userId: string): ProjectScopedClient {
    return new ProjectScopedClient(projectId, userId);
}

// ============================================================================
// DATABASE MIGRATIONS
// ============================================================================

export const MIGRATIONS = {
    "001_create_memory_chunks": `
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS memory_chunks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL,
            content TEXT NOT NULL,
            content_hash VARCHAR(64) NOT NULL,
            embedding vector(1536),
            source_type VARCHAR(50) NOT NULL,
            source_id VARCHAR(255) NOT NULL,
            source_url TEXT,
            valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            valid_until TIMESTAMPTZ,
            is_evergreen BOOLEAN DEFAULT FALSE,
            temporal_relevance VARCHAR(20) DEFAULT 'current',
            confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
            confidence_level VARCHAR(20) NOT NULL DEFAULT 'medium',
            founder_weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
            credibility_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
            causal_parent_id UUID REFERENCES memory_chunks(id),
            causal_relationship VARCHAR(20),
            causal_chain_depth INTEGER DEFAULT 0,
            founder_stage VARCHAR(20) NOT NULL,
            tags TEXT[] DEFAULT '{}',
            categories TEXT[] DEFAULT '{}',
            indian_context BOOLEAN DEFAULT FALSE,
            requires_localization BOOLEAN DEFAULT FALSE,
            regulatory_domain VARCHAR(50),
            retrieval_count INTEGER DEFAULT 0,
            last_retrieved_at TIMESTAMPTZ,
            average_usefulness_score DECIMAL(3,2) DEFAULT 0.5,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            created_by VARCHAR(255) NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            invalidated_at TIMESTAMPTZ,
            invalidation_reason TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            is_invalidated BOOLEAN DEFAULT FALSE,
            CONSTRAINT unique_content_per_project UNIQUE (project_id, content_hash)
        );
    `,

    "002_create_indexes": `
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_embedding 
            ON memory_chunks USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_active 
            ON memory_chunks (project_id, is_active, is_invalidated);
        
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_stage 
            ON memory_chunks (project_id, founder_stage);
        
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_tags 
            ON memory_chunks USING gin (tags);
        
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_temporal 
            ON memory_chunks (project_id, valid_from, valid_until);
    `,

    "003_enable_rls": `
        ALTER TABLE memory_chunks ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS memory_chunks_tenant_isolation ON memory_chunks;
        CREATE POLICY memory_chunks_tenant_isolation ON memory_chunks
            USING (project_id = current_setting('app.current_project_id')::uuid);
        
        DROP POLICY IF EXISTS memory_chunks_insert_policy ON memory_chunks;
        CREATE POLICY memory_chunks_insert_policy ON memory_chunks
            FOR INSERT
            WITH CHECK (project_id = current_setting('app.current_project_id')::uuid);
        
        DROP POLICY IF EXISTS memory_chunks_update_policy ON memory_chunks;
        CREATE POLICY memory_chunks_update_policy ON memory_chunks
            FOR UPDATE
            USING (project_id = current_setting('app.current_project_id')::uuid);
    `,

    "004_create_audit_logs": `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            timestamp TIMESTAMPTZ DEFAULT NOW(),
            project_id UUID NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id VARCHAR(255) NOT NULL,
            details JSONB DEFAULT '{}',
            ip_address INET,
            user_agent TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_project_time 
            ON audit_logs (project_id, timestamp DESC);
        
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY audit_logs_tenant_isolation ON audit_logs
            USING (project_id = current_setting('app.current_project_id')::uuid);
    `,

    "005_create_ingestion_jobs": `
        CREATE TABLE IF NOT EXISTS ingestion_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'queued',
            request JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            error TEXT,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            chunks_created INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_project_status 
            ON ingestion_jobs (project_id, status, created_at);
        
        ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY ingestion_jobs_tenant_isolation ON ingestion_jobs
            USING (project_id = current_setting('app.current_project_id')::uuid);
    `
};
