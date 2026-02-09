/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Memory Update & Conflict Resolution System
 * 
 * This module handles:
 * - Memory invalidation (never delete, always maintain causal chain)
 * - Supersession with causal linkage
 * - Conflict detection and resolution
 * - Stale data handling
 * - Founder override prioritization
 */

import {
    MemoryChunk,
    MemoryUpdate,
    MemoryConflict,
    CausalRelationship,
    MemorySourceType,
    ConfidenceLevel
} from "./types";
import { createProjectClient, ProjectScopedClient } from "./database";
import { generateContentHash, generateEmbedding, calculateConfidence, calculateFounderWeight } from "./ingestion";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const MEMORY_UPDATE_CONFIG = {
    // Similarity threshold for detecting conflicts
    CONFLICT_SIMILARITY_THRESHOLD: 0.85,

    // How much newer content must score to auto-supersede
    AUTO_SUPERSEDE_SCORE_DELTA: 0.15,

    // Time-based expiry rules by category (in days)
    CATEGORY_EXPIRY: {
        "market-intelligence": 90,
        "competitive-analysis": 60,
        "pricing": 30,
        "regulatory": 45,
        "fundraising": 120,
        "team": 365,
        "product": 180,
        "customer-insights": 90,
        "default": 180
    } as Record<string, number>,

    // Maximum causal chain depth before forcing consolidation
    MAX_CAUSAL_CHAIN_DEPTH: 10
};

// ============================================================================
// MEMORY UPDATE ORCHESTRATOR
// ============================================================================

export class MemoryUpdateOrchestrator {
    private projectId: string;
    private userId: string;
    private client: ProjectScopedClient;

    constructor(projectId: string, userId: string) {
        this.projectId = projectId;
        this.userId = userId;
        this.client = createProjectClient(projectId, userId);
    }

    /**
     * Process a memory update with full conflict detection and resolution
     */
    async processUpdate(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken: string;
        new_chunk_id?: string;
        conflicts_resolved: number;
    }> {
        console.log(`[MEMORY_UPDATE] Processing ${update.update_type} for chunk ${update.target_chunk_id.substring(0, 8)}...`);

        try {
            switch (update.update_type) {
                case "invalidate":
                    return await this.invalidateMemory(update);

                case "supersede":
                    return await this.supersedeMemory(update);

                case "refine":
                    return await this.refineMemory(update);

                case "correct":
                    return await this.correctMemory(update);

                default:
                    throw new Error(`Unknown update type: ${update.update_type}`);
            }
        } catch (error: any) {
            console.error(`[MEMORY_UPDATE] Error: ${error.message}`);
            return {
                success: false,
                action_taken: `Error: ${error.message}`,
                conflicts_resolved: 0
            };
        }
    }

    /**
     * Invalidate a memory chunk (mark as invalid, never delete)
     */
    private async invalidateMemory(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken: string;
        conflicts_resolved: number;
    }> {
        await this.client.invalidateChunk(update.target_chunk_id, update.reason);

        return {
            success: true,
            action_taken: `Invalidated chunk ${update.target_chunk_id.substring(0, 8)}... with reason: ${update.reason}`,
            conflicts_resolved: 0
        };
    }

    /**
     * Supersede a memory chunk with new content (creates causal link)
     */
    private async supersedeMemory(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken: string;
        new_chunk_id?: string;
        conflicts_resolved: number;
    }> {
        if (!update.new_content) {
            throw new Error("Supersede requires new_content");
        }

        // Get the old chunk
        const oldChunk = await this.client.getChunkById(update.target_chunk_id);
        if (!oldChunk) {
            throw new Error(`Chunk not found: ${update.target_chunk_id}`);
        }

        // Generate new chunk with causal link
        const contentHash = await generateContentHash(update.new_content);
        const embedding = await generateEmbedding(update.new_content);
        const confidence = calculateConfidence(
            update.initiated_by === "founder" ? "founder_override" : oldChunk.source_type,
            update.new_content
        );
        const founderWeight = update.initiated_by === "founder" ? 2.0 : calculateFounderWeight(oldChunk.source_type);

        // Create new chunk
        const newChunk = await this.client.insertMemoryChunk({
            content: update.new_content,
            content_hash: contentHash,
            embedding,

            source_type: update.initiated_by === "founder" ? "founder_override" : oldChunk.source_type,
            source_id: oldChunk.source_id,
            source_url: oldChunk.source_url,

            valid_from: new Date(),
            valid_until: undefined,
            is_evergreen: oldChunk.is_evergreen,
            temporal_relevance: "current",

            confidence_score: confidence.score,
            confidence_level: confidence.level,
            founder_weight: founderWeight,
            credibility_score: confidence.score,

            causal_parent_id: update.target_chunk_id,
            causal_relationship: "supersedes",
            causal_chain_depth: oldChunk.causal_chain_depth + 1,

            founder_stage: oldChunk.founder_stage,
            tags: oldChunk.tags,
            categories: oldChunk.categories,

            indian_context: oldChunk.indian_context,
            requires_localization: oldChunk.requires_localization,
            regulatory_domain: oldChunk.regulatory_domain,

            retrieval_count: 0,
            average_usefulness_score: 0.5,

            created_by: this.userId,
            is_active: true,
            is_invalidated: false
        });

        // Invalidate old chunk
        await this.client.invalidateChunk(update.target_chunk_id, `Superseded by ${newChunk.id}`, newChunk.id);

        // Check if we need to consolidate the causal chain
        if (newChunk.causal_chain_depth >= MEMORY_UPDATE_CONFIG.MAX_CAUSAL_CHAIN_DEPTH) {
            console.log(`[MEMORY_UPDATE] Causal chain depth ${newChunk.causal_chain_depth} exceeds max, consider consolidation`);
            // In production, trigger async consolidation job
        }

        return {
            success: true,
            action_taken: `Superseded chunk ${update.target_chunk_id.substring(0, 8)}... with new chunk ${newChunk.id.substring(0, 8)}...`,
            new_chunk_id: newChunk.id,
            conflicts_resolved: 1
        };
    }

    /**
     * Refine a memory chunk (add detail while keeping original valid)
     */
    private async refineMemory(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken: string;
        new_chunk_id?: string;
        conflicts_resolved: number;
    }> {
        if (!update.new_content) {
            throw new Error("Refine requires new_content");
        }

        const oldChunk = await this.client.getChunkById(update.target_chunk_id);
        if (!oldChunk) {
            throw new Error(`Chunk not found: ${update.target_chunk_id}`);
        }

        const contentHash = await generateContentHash(update.new_content);
        const embedding = await generateEmbedding(update.new_content);
        const confidence = calculateConfidence(oldChunk.source_type, update.new_content);

        // Create refinement chunk (old chunk stays valid)
        const newChunk = await this.client.insertMemoryChunk({
            content: update.new_content,
            content_hash: contentHash,
            embedding,

            source_type: oldChunk.source_type,
            source_id: oldChunk.source_id,
            source_url: oldChunk.source_url,

            valid_from: new Date(),
            valid_until: undefined,
            is_evergreen: oldChunk.is_evergreen,
            temporal_relevance: "current",

            confidence_score: confidence.score,
            confidence_level: confidence.level,
            founder_weight: oldChunk.founder_weight,
            credibility_score: confidence.score,

            causal_parent_id: update.target_chunk_id,
            causal_relationship: "refines",
            causal_chain_depth: oldChunk.causal_chain_depth + 1,

            founder_stage: oldChunk.founder_stage,
            tags: oldChunk.tags,
            categories: oldChunk.categories,

            indian_context: oldChunk.indian_context,
            requires_localization: oldChunk.requires_localization,
            regulatory_domain: oldChunk.regulatory_domain,

            retrieval_count: 0,
            average_usefulness_score: 0.5,

            created_by: this.userId,
            is_active: true,
            is_invalidated: false
        });

        // Old chunk stays active (refinement adds detail, doesn't replace)

        return {
            success: true,
            action_taken: `Added refinement ${newChunk.id.substring(0, 8)}... to chunk ${update.target_chunk_id.substring(0, 8)}...`,
            new_chunk_id: newChunk.id,
            conflicts_resolved: 0
        };
    }

    /**
     * Correct a memory chunk (founder override - highest priority)
     */
    private async correctMemory(update: MemoryUpdate): Promise<{
        success: boolean;
        action_taken: string;
        new_chunk_id?: string;
        conflicts_resolved: number;
    }> {
        if (!update.new_content) {
            throw new Error("Correct requires new_content");
        }

        const oldChunk = await this.client.getChunkById(update.target_chunk_id);
        if (!oldChunk) {
            throw new Error(`Chunk not found: ${update.target_chunk_id}`);
        }

        const contentHash = await generateContentHash(update.new_content);
        const embedding = await generateEmbedding(update.new_content);

        // Corrections always have highest confidence and weight
        const newChunk = await this.client.insertMemoryChunk({
            content: update.new_content,
            content_hash: contentHash,
            embedding,

            // Source is explicitly founder_override for corrections
            source_type: "founder_override",
            source_id: `correction_of_${oldChunk.source_id}`,
            source_url: oldChunk.source_url,

            valid_from: new Date(),
            valid_until: undefined,
            is_evergreen: true, // Founder corrections are evergreen until explicitly updated
            temporal_relevance: "current",

            // Maximum confidence for founder corrections
            confidence_score: 1.0,
            confidence_level: "founder_verified",
            founder_weight: 2.0, // Maximum weight
            credibility_score: 1.0,

            causal_parent_id: update.target_chunk_id,
            causal_relationship: "corrects",
            causal_chain_depth: oldChunk.causal_chain_depth + 1,

            founder_stage: oldChunk.founder_stage,
            tags: [...oldChunk.tags, "founder-corrected"],
            categories: oldChunk.categories,

            indian_context: oldChunk.indian_context,
            requires_localization: false, // Founder has validated India context
            regulatory_domain: oldChunk.regulatory_domain,

            retrieval_count: 0,
            average_usefulness_score: 1.0, // Assume high usefulness

            created_by: this.userId,
            is_active: true,
            is_invalidated: false
        });

        // Invalidate the incorrect chunk
        await this.client.invalidateChunk(update.target_chunk_id, `Corrected by founder: ${update.reason}`, newChunk.id);

        return {
            success: true,
            action_taken: `Founder correction applied: ${newChunk.id.substring(0, 8)}... replaces ${update.target_chunk_id.substring(0, 8)}...`,
            new_chunk_id: newChunk.id,
            conflicts_resolved: 1
        };
    }

    /**
     * Detect and resolve conflicts between memory chunks
     */
    async detectAndResolveConflicts(newContent: string, newEmbedding: number[]): Promise<{
        conflicts: MemoryConflict[];
        resolutions: string[];
    }> {
        // Find potentially conflicting chunks
        const potentialConflicts = await this.client.findConflicts(
            newContent,
            newEmbedding,
            MEMORY_UPDATE_CONFIG.CONFLICT_SIMILARITY_THRESHOLD
        );

        const conflicts: MemoryConflict[] = [];
        const resolutions: string[] = [];

        for (const existing of potentialConflicts) {
            // Determine conflict type
            const conflictType = this.classifyConflict(newContent, existing);

            if (conflictType) {
                const conflict: MemoryConflict = {
                    chunk_a_id: "new",
                    chunk_b_id: existing.id,
                    conflict_type: conflictType,
                    description: `New content conflicts with existing memory`,
                    resolution_strategy: this.determineResolutionStrategy(existing, conflictType),
                    resolved: false
                };

                // Auto-resolve if possible
                const resolution = await this.attemptAutoResolution(conflict, existing, newContent);
                if (resolution) {
                    conflict.resolved = true;
                    conflict.resolution = resolution;
                    resolutions.push(resolution);
                }

                conflicts.push(conflict);
            }
        }

        return { conflicts, resolutions };
    }

    private classifyConflict(newContent: string, existing: MemoryChunk): MemoryConflict["conflict_type"] | null {
        // Simple heuristic classification
        // In production, use semantic analysis

        // Temporal conflict: same topic but different timeframes
        const temporalMarkers = /\b(current|latest|was|previously|now|then|before|after)\b/i;
        if (temporalMarkers.test(newContent) && temporalMarkers.test(existing.content)) {
            // Check if they reference different time periods
            const newHasCurrent = /\b(current|now|latest)\b/i.test(newContent);
            const existingHasCurrent = /\b(current|now|latest)\b/i.test(existing.content);

            if (newHasCurrent !== existingHasCurrent) {
                return "temporal";
            }
        }

        // Factual conflict: contradicting numbers or facts
        const numberPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(%|crore|lakh|million|billion)?/gi;
        const newNumbers = newContent.match(numberPattern) || [];
        const existingNumbers = existing.content.match(numberPattern) || [];

        if (newNumbers.length > 0 && existingNumbers.length > 0) {
            // If they have different numbers in similar context, might be factual conflict
            return "factual";
        }

        return null; // No clear conflict
    }

    private determineResolutionStrategy(existing: MemoryChunk, conflictType: MemoryConflict["conflict_type"]): MemoryConflict["resolution_strategy"] {
        // Founder content always wins
        if (existing.source_type === "founder_override" || existing.source_type === "founder_input") {
            return "prefer_founder";
        }

        // Temporal conflicts: prefer newer
        if (conflictType === "temporal") {
            return "prefer_newer";
        }

        // Factual conflicts with high confidence existing: manual review
        if (conflictType === "factual" && existing.confidence_score > 0.8) {
            return "require_manual";
        }

        // Default: prefer higher confidence
        return "prefer_higher_confidence";
    }

    private async attemptAutoResolution(
        conflict: MemoryConflict,
        existing: MemoryChunk,
        newContent: string
    ): Promise<string | null> {
        switch (conflict.resolution_strategy) {
            case "prefer_newer":
                // New content wins, invalidate old
                await this.client.invalidateChunk(existing.id, "Superseded by newer information");
                return `Resolved: newer content supersedes chunk ${existing.id.substring(0, 8)}...`;

            case "prefer_founder":
                // Founder content wins, skip new
                return `Resolved: kept founder-verified content in chunk ${existing.id.substring(0, 8)}...`;

            case "prefer_higher_confidence":
                // Compare confidence (new content doesn't have chunk yet, estimate)
                const newConfidence = calculateConfidence("ai_analysis", newContent);
                if (newConfidence.score > existing.confidence_score + MEMORY_UPDATE_CONFIG.AUTO_SUPERSEDE_SCORE_DELTA) {
                    await this.client.invalidateChunk(existing.id, "Superseded by higher-confidence content");
                    return `Resolved: higher confidence new content supersedes chunk ${existing.id.substring(0, 8)}...`;
                } else {
                    return `Resolved: kept higher-confidence existing chunk ${existing.id.substring(0, 8)}...`;
                }

            case "require_manual":
                // Cannot auto-resolve
                return null;

            default:
                return null;
        }
    }

    /**
     * Check for stale memories based on category expiry rules
     */
    async findStaleMemories(categories?: string[]): Promise<MemoryChunk[]> {
        // In production, this would be a database query
        // For now, return empty - the query would be:
        /*
        SELECT * FROM memory_chunks
        WHERE project_id = $1
          AND is_active = true
          AND is_invalidated = false
          AND is_evergreen = false
          AND (
            -- Check category-specific expiry
            (categories && '{market-intelligence}'::text[] AND valid_from < NOW() - INTERVAL '90 days')
            OR (categories && '{pricing}'::text[] AND valid_from < NOW() - INTERVAL '30 days')
            OR (categories && '{competitive-analysis}'::text[] AND valid_from < NOW() - INTERVAL '60 days')
            -- ... etc
          )
        */

        return [];
    }

    /**
     * Mark memories as stale and create refresh suggestions
     */
    async markStaleAndSuggestRefresh(staleChunks: MemoryChunk[]): Promise<{
        marked: number;
        suggestions: string[];
    }> {
        const suggestions: string[] = [];

        for (const chunk of staleChunks) {
            // Don't invalidate, just mark as needing refresh
            // In production, add to a "needs_refresh" queue

            suggestions.push(`Memory about "${chunk.tags.join(", ")}" is ${this.getAge(chunk.valid_from)} old and may need updating`);
        }

        return {
            marked: staleChunks.length,
            suggestions
        };
    }

    private getAge(date: Date): string {
        const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 30) return `${days} days`;
        if (days < 365) return `${Math.floor(days / 30)} months`;
        return `${Math.floor(days / 365)} years`;
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createMemoryUpdater(projectId: string, userId: string): MemoryUpdateOrchestrator {
    return new MemoryUpdateOrchestrator(projectId, userId);
}

// ============================================================================
// SCHEDULED MAINTENANCE FUNCTIONS
// ============================================================================

/**
 * Run periodic maintenance on memory database
 * Should be called by a cron job or scheduled function
 */
export async function runMemoryMaintenance(projectId: string, userId: string): Promise<{
    stale_marked: number;
    chains_consolidated: number;
    duplicates_merged: number;
}> {
    const updater = createMemoryUpdater(projectId, userId);

    console.log(`[MAINTENANCE] Running memory maintenance for project ${projectId.substring(0, 8)}...`);

    // Find and handle stale memories
    const staleChunks = await updater.findStaleMemories();
    const staleResult = await updater.markStaleAndSuggestRefresh(staleChunks);

    // In production, also:
    // - Consolidate deep causal chains
    // - Merge near-duplicate chunks
    // - Update retrieval statistics
    // - Archive very old, rarely-retrieved chunks

    return {
        stale_marked: staleResult.marked,
        chains_consolidated: 0, // Would be implemented in production
        duplicates_merged: 0    // Would be implemented in production
    };
}
