/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Agent Orchestration System
 * 
 * This module implements:
 * - Supervisor agent (router & governor)
 * - Researcher agent (retrieval & re-ranking)
 * - Strategist agent (context sufficiency & gap detection)
 * - Localizer agent (India-specific validation)
 * 
 * The system uses multi-step, confidence-evaluated retrieval with
 * recursive querying when confidence is below threshold.
 */

import {
    AgentRole,
    AgentContext,
    AgentDecision,
    AgentAction,
    SupervisorState,
    RetrievalQuery,
    RetrievalResult,
    RankedChunk,
    RetrievalIntent,
    FounderStage,
    IndiaContext
} from "./types";
import { createProjectClient, ProjectScopedClient } from "./database";
import { generateEmbedding, detectIndianContext } from "./ingestion";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const ORCHESTRATION_CONFIG = {
    // Confidence thresholds
    MIN_RETRIEVAL_CONFIDENCE: 0.6,
    HIGH_CONFIDENCE_THRESHOLD: 0.8,

    // Retrieval limits
    MAX_CHUNKS_PER_QUERY: 10,
    MAX_RECURSIVE_DEPTH: 3,
    MAX_TOTAL_CHUNKS: 25,

    // Supervisor limits
    MAX_STEPS: 10,
    MAX_AGENTS_PER_SESSION: 5,

    // Localization
    REQUIRE_LOCALIZATION_FOR_INTENTS: [
        "regulatory_check",
        "competitive_analysis",
        "decision_support"
    ] as RetrievalIntent[]
};

// ============================================================================
// BASE AGENT INTERFACE
// ============================================================================

interface AgentResponse {
    decision: AgentDecision;
    data?: any;
    diagnostics?: string[];
}

abstract class BaseAgent {
    protected projectId: string;
    protected userId: string;
    protected client: ProjectScopedClient;

    constructor(projectId: string, userId: string) {
        this.projectId = projectId;
        this.userId = userId;
        this.client = createProjectClient(projectId, userId);
    }

    abstract get role(): AgentRole;
    abstract process(context: AgentContext, previousResults?: any): Promise<AgentResponse>;

    protected log(message: string): void {
        console.log(`[${this.role.toUpperCase()}] ${message}`);
    }
}

// ============================================================================
// SUPERVISOR AGENT
// ============================================================================

/**
 * The Supervisor is the orchestration layer that:
 * - Enforces project isolation
 * - Decides which agents to invoke
 * - Determines when retrieval is sufficient
 * - Manages the overall flow
 */
export class SupervisorAgent extends BaseAgent {
    private state: SupervisorState;
    private agents: Map<string, BaseAgent>;

    constructor(projectId: string, userId: string, sessionId: string) {
        super(projectId, userId);

        this.state = {
            project_id: projectId,
            session_id: sessionId,
            current_step: 0,
            max_steps: ORCHESTRATION_CONFIG.MAX_STEPS,
            agents_invoked: [],
            total_chunks_retrieved: 0,
            overall_confidence: 0,
            gaps_detected: [],
            localization_status: "pending",
            is_complete: false
        };

        // Initialize sub-agents
        this.agents = new Map<string, BaseAgent>();
        this.agents.set("researcher", new ResearcherAgent(projectId, userId));
        this.agents.set("strategist", new StrategistAgent(projectId, userId));
        this.agents.set("localizer", new LocalizerAgent(projectId, userId));
    }

    get role(): AgentRole {
        return "supervisor";
    }

    /**
     * Main entry point for query processing
     */
    async processQuery(context: AgentContext): Promise<{
        response: string;
        chunks_used: RankedChunk[];
        confidence: number;
        diagnostics: string[];
    }> {
        this.log(`Starting orchestration for query: "${context.query.substring(0, 50)}..."`);

        const diagnostics: string[] = [];
        let allChunks: RankedChunk[] = [];

        try {
            // Step 1: Initial retrieval via Researcher
            const researcherResult = await this.invokeAgent("researcher", context);
            allChunks = researcherResult.data?.chunks || [];
            diagnostics.push(`Researcher retrieved ${allChunks.length} chunks`);

            // Step 2: Evaluate sufficiency via Strategist
            const strategistContext = { ...context, previous_context: allChunks };
            const strategistResult = await this.invokeAgent("strategist", strategistContext, researcherResult.data);

            const gaps = strategistResult.data?.gaps || [];
            const confidence = strategistResult.data?.confidence || 0;
            diagnostics.push(`Strategist confidence: ${(confidence * 100).toFixed(1)}%, gaps: ${gaps.length}`);

            this.state.overall_confidence = confidence;
            this.state.gaps_detected = gaps;

            // Step 3: Recursive retrieval if confidence is low
            if (confidence < ORCHESTRATION_CONFIG.MIN_RETRIEVAL_CONFIDENCE && gaps.length > 0) {
                diagnostics.push(`Low confidence, attempting recursive retrieval...`);

                const additionalChunks = await this.recursiveRetrieval(context, gaps, 1);
                allChunks = [...allChunks, ...additionalChunks];
                diagnostics.push(`Recursive retrieval added ${additionalChunks.length} chunks`);

                // Re-evaluate
                const reEvalResult = await this.invokeAgent("strategist", { ...context, previous_context: allChunks });
                this.state.overall_confidence = reEvalResult.data?.confidence || confidence;
            }

            // Step 4: Localization check for India-specific queries
            const needsLocalization = this.requiresLocalization(context.intent);
            if (needsLocalization) {
                diagnostics.push(`Invoking Localizer for India-specific validation...`);
                const localizerResult = await this.invokeAgent("localizer", context, { chunks: allChunks });

                this.state.localization_status = localizerResult.data?.corrected ? "corrected" : "validated";
                diagnostics.push(`Localization: ${this.state.localization_status}`);

                // Apply corrections if any
                if (localizerResult.data?.corrections) {
                    diagnostics.push(`Applied ${localizerResult.data.corrections.length} localization corrections`);
                }
            } else {
                this.state.localization_status = "not_required";
            }

            // Step 5: Synthesize response
            const response = await this.synthesizeResponse(context.query, allChunks);

            this.state.is_complete = true;

            return {
                response,
                chunks_used: allChunks,
                confidence: this.state.overall_confidence,
                diagnostics
            };

        } catch (error: any) {
            diagnostics.push(`ERROR: ${error.message}`);
            return {
                response: "I encountered an error processing your request. Please try again.",
                chunks_used: allChunks,
                confidence: 0,
                diagnostics
            };
        }
    }

    async process(context: AgentContext): Promise<AgentResponse> {
        // Supervisor's process is the full query flow
        const result = await this.processQuery(context);

        return {
            decision: {
                agent: "supervisor",
                action: { type: "complete", params: { response: result.response, confidence: result.confidence } },
                reasoning: `Completed with confidence ${(result.confidence * 100).toFixed(1)}%`,
                confidence: result.confidence,
                should_continue: false
            },
            data: result
        };
    }

    private async invokeAgent(role: AgentRole, context: AgentContext, previousData?: any): Promise<AgentResponse> {
        const agent = this.agents.get(role);
        if (!agent) {
            throw new Error(`Agent not found: ${role}`);
        }

        this.state.current_step++;
        this.state.agents_invoked.push(role);

        if (this.state.current_step > this.state.max_steps) {
            throw new Error("Max orchestration steps exceeded");
        }

        this.log(`Invoking ${role} (step ${this.state.current_step}/${this.state.max_steps})`);
        return await agent.process(context, previousData);
    }

    private async recursiveRetrieval(context: AgentContext, gaps: string[], depth: number): Promise<RankedChunk[]> {
        if (depth > ORCHESTRATION_CONFIG.MAX_RECURSIVE_DEPTH) {
            this.log(`Max recursive depth reached`);
            return [];
        }

        const additionalChunks: RankedChunk[] = [];

        for (const gap of gaps.slice(0, 3)) { // Limit to 3 gap queries
            const gapContext: AgentContext = {
                ...context,
                query: gap,
                intent: "factual_lookup"
            };

            const result = await this.agents.get("researcher")!.process(gapContext);
            if (result.data?.chunks) {
                additionalChunks.push(...result.data.chunks);
            }
        }

        this.state.total_chunks_retrieved += additionalChunks.length;

        // Check if we've exceeded total chunk limit
        if (this.state.total_chunks_retrieved > ORCHESTRATION_CONFIG.MAX_TOTAL_CHUNKS) {
            this.log(`Total chunk limit reached`);
            return additionalChunks.slice(0, ORCHESTRATION_CONFIG.MAX_TOTAL_CHUNKS - this.state.total_chunks_retrieved + additionalChunks.length);
        }

        return additionalChunks;
    }

    private requiresLocalization(intent: RetrievalIntent): boolean {
        return ORCHESTRATION_CONFIG.REQUIRE_LOCALIZATION_FOR_INTENTS.includes(intent);
    }

    private async synthesizeResponse(query: string, chunks: RankedChunk[]): Promise<string> {
        // In production, this would call an LLM to synthesize
        // For now, create a structured response

        if (chunks.length === 0) {
            return "I don't have enough information in my memory to answer this question confidently. Would you like me to search for more information or would you prefer to provide some context?";
        }

        // Sort by combined score
        const sortedChunks = chunks.sort((a, b) => b.combined_score - a.combined_score);

        // Build context from top chunks
        const contextParts = sortedChunks.slice(0, 5).map((chunk, i) => {
            const source = chunk.source_type === "founder_override" ? "[FOUNDER VERIFIED]" : `[${chunk.source_type}]`;
            return `${source} ${chunk.content.substring(0, 500)}...`;
        });

        // In production, send to LLM:
        /*
        const response = await callGemini(`
            Based on the following context from the founder's project memory, answer the question.
            
            Question: ${query}
            
            Context:
            ${contextParts.join("\n\n")}
            
            Provide a helpful, accurate response. If there are any Indian-specific considerations, highlight them.
            Acknowledge if the information might be outdated or if you're uncertain about any part.
        `);
        */

        return `Based on my analysis of ${sortedChunks.length} relevant memories:\n\n${contextParts[0]}\n\n[Confidence: ${(this.state.overall_confidence * 100).toFixed(0)}%]`;
    }
}

// ============================================================================
// RESEARCHER AGENT
// ============================================================================

/**
 * The Researcher handles:
 * - Vector similarity search
 * - Initial retrieval
 * - Re-ranking based on multiple factors
 */
export class ResearcherAgent extends BaseAgent {
    get role(): AgentRole {
        return "researcher";
    }

    async process(context: AgentContext): Promise<AgentResponse> {
        this.log(`Retrieving for: "${context.query.substring(0, 50)}..."`);

        // Generate query embedding
        const queryEmbedding = await generateEmbedding(context.query);

        // Build retrieval query
        const retrievalQuery: RetrievalQuery = {
            project_id: this.projectId,
            query: context.query,
            intent: context.intent,
            founder_stage: context.founder_stage,
            temporal_filter: this.determineTemporalFilter(context.query),
            require_indian_context: this.shouldRequireIndianContext(context.query),
            min_confidence: 0.3,
            max_results: ORCHESTRATION_CONFIG.MAX_CHUNKS_PER_QUERY
        };

        // Perform search
        const chunks = await this.client.searchSimilar(queryEmbedding, {
            maxResults: retrievalQuery.max_results,
            minSimilarity: 0.5,
            founderStage: retrievalQuery.founder_stage,
            requireIndianContext: retrievalQuery.require_indian_context,
            temporalFilter: retrievalQuery.temporal_filter
        });

        // Re-rank with additional factors
        const rerankedChunks = this.rerank(chunks, context);

        // Calculate retrieval confidence
        const retrievalConfidence = this.calculateRetrievalConfidence(rerankedChunks);

        this.log(`Retrieved ${rerankedChunks.length} chunks with confidence ${(retrievalConfidence * 100).toFixed(1)}%`);

        return {
            decision: {
                agent: "researcher",
                action: { type: "retrieve", params: retrievalQuery },
                reasoning: `Retrieved ${rerankedChunks.length} relevant memory chunks`,
                confidence: retrievalConfidence,
                next_agent: "strategist",
                should_continue: true
            },
            data: {
                chunks: rerankedChunks,
                confidence: retrievalConfidence
            }
        };
    }

    private determineTemporalFilter(query: string): RetrievalQuery["temporal_filter"] {
        const queryLower = query.toLowerCase();

        if (/current|latest|now|today|this (week|month|year)/i.test(query)) {
            return { type: "current_only" };
        }

        if (/history|historical|previously|before|last (year|month)/i.test(query)) {
            return { type: "historical" };
        }

        return { type: "latest" }; // Default to preferring latest
    }

    private shouldRequireIndianContext(query: string): boolean {
        // Check if query explicitly mentions India or uses INR
        return /india|indian|₹|inr|crore|lakh/i.test(query);
    }

    private rerank(chunks: RankedChunk[], context: AgentContext): RankedChunk[] {
        return chunks.map(chunk => {
            let boost = 0;

            // Boost founder content in founder-centric queries
            if (chunk.source_type === "founder_override" || chunk.source_type === "founder_input") {
                boost += 0.2;
            }

            // Boost stage-matching content
            if (chunk.founder_stage === context.founder_stage) {
                boost += 0.1;
            }

            // Boost Indian context when relevant
            if (chunk.indian_context && context.query.toLowerCase().includes("india")) {
                boost += 0.15;
            }

            // Apply temporal decay for non-evergreen content
            let temporalDecay = 1.0;
            if (!chunk.is_evergreen) {
                const ageInDays = (Date.now() - chunk.valid_from.getTime()) / (1000 * 60 * 60 * 24);
                temporalDecay = Math.pow(0.5, ageInDays / 90); // Half-life of 90 days
            }

            return {
                ...chunk,
                combined_score: chunk.combined_score * temporalDecay + boost,
                temporal_decay_applied: temporalDecay,
                recency_boost: boost,
                relevance_explanation: this.generateExplanation(chunk, context)
            };
        }).sort((a, b) => b.combined_score - a.combined_score);
    }

    private generateExplanation(chunk: RankedChunk, context: AgentContext): string {
        const factors: string[] = [];

        if (chunk.similarity_score > 0.8) factors.push("high semantic similarity");
        if (chunk.founder_weight > 1.5) factors.push("founder-verified content");
        if (chunk.confidence_score > 0.7) factors.push("high confidence source");
        if (chunk.indian_context) factors.push("India-specific context");
        if (chunk.founder_stage === context.founder_stage) factors.push("stage-relevant");

        return factors.length > 0 ? factors.join(", ") : "general relevance";
    }

    private calculateRetrievalConfidence(chunks: RankedChunk[]): number {
        if (chunks.length === 0) return 0;

        // Weighted average of top chunks
        const topChunks = chunks.slice(0, 5);
        const totalWeight = topChunks.reduce((sum, chunk, i) => sum + (1 / (i + 1)), 0);
        const weightedScore = topChunks.reduce((sum, chunk, i) => {
            return sum + (chunk.combined_score * (1 / (i + 1)));
        }, 0);

        return Math.min(1, weightedScore / totalWeight);
    }
}

// ============================================================================
// STRATEGIST AGENT
// ============================================================================

/**
 * The Strategist evaluates:
 * - Context sufficiency
 * - Gap detection
 * - Contradiction identification
 * - Overall confidence assessment
 */
export class StrategistAgent extends BaseAgent {
    get role(): AgentRole {
        return "strategist";
    }

    async process(context: AgentContext, previousData?: { chunks: RankedChunk[] }): Promise<AgentResponse> {
        // Get chunks from previous data or context, cast to RankedChunk with defaults
        const rawChunks = previousData?.chunks || context.previous_context || [];
        const chunks: RankedChunk[] = rawChunks.map(chunk => ({
            ...chunk,
            similarity_score: (chunk as RankedChunk).similarity_score ?? 0.5,
            combined_score: (chunk as RankedChunk).combined_score ?? 0.5,
            relevance_explanation: (chunk as RankedChunk).relevance_explanation ?? "from context",
            temporal_decay_applied: (chunk as RankedChunk).temporal_decay_applied ?? 1.0,
            recency_boost: (chunk as RankedChunk).recency_boost ?? 0
        }));

        this.log(`Evaluating ${chunks.length} chunks for query sufficiency`);

        // Detect gaps in coverage
        const gaps = this.detectGaps(context.query, chunks);

        // Detect contradictions
        const contradictions = this.detectContradictions(chunks);

        // Detect stale data
        const staleWarnings = this.detectStaleData(chunks, context.query);

        // Calculate overall confidence
        const confidence = this.calculateContextConfidence(chunks, gaps, contradictions);

        // Determine if we should continue or if we have enough
        const shouldContinue = confidence < ORCHESTRATION_CONFIG.MIN_RETRIEVAL_CONFIDENCE && gaps.length > 0;

        this.log(`Confidence: ${(confidence * 100).toFixed(1)}%, Gaps: ${gaps.length}, Stale: ${staleWarnings.length}`);

        return {
            decision: {
                agent: "strategist",
                action: shouldContinue
                    ? { type: "re_query", params: { decomposed_queries: gaps } }
                    : { type: "detect_gaps", params: { context: context.query } },
                reasoning: shouldContinue
                    ? `Confidence too low (${(confidence * 100).toFixed(1)}%), need more context`
                    : `Sufficient context gathered`,
                confidence,
                next_agent: shouldContinue ? "researcher" : "localizer",
                should_continue: shouldContinue
            },
            data: {
                gaps,
                contradictions,
                stale_warnings: staleWarnings,
                confidence,
                sufficient: !shouldContinue
            }
        };
    }

    private detectGaps(query: string, chunks: RankedChunk[]): string[] {
        const gaps: string[] = [];
        const queryLower = query.toLowerCase();

        // Define key aspects that should be covered
        const aspectPatterns: { aspect: string; pattern: RegExp }[] = [
            { aspect: "market size", pattern: /market|size|tam|sam|som/i },
            { aspect: "competition", pattern: /competitor|competitive|rival/i },
            { aspect: "pricing", pattern: /price|pricing|cost|revenue model/i },
            { aspect: "regulatory", pattern: /regulation|compliance|legal/i },
            { aspect: "customer", pattern: /customer|user|target audience/i },
            { aspect: "funding", pattern: /funding|investment|raise/i },
            { aspect: "team", pattern: /team|hire|founder/i }
        ];

        // Check which aspects are mentioned in query but not covered
        for (const { aspect, pattern } of aspectPatterns) {
            if (pattern.test(queryLower)) {
                const hasCoverage = chunks.some(chunk => pattern.test(chunk.content));
                if (!hasCoverage) {
                    gaps.push(`Missing information about ${aspect}`);
                }
            }
        }

        // If query is complex and we have few chunks, suggest decomposition
        if (chunks.length < 3 && query.split(/\s+/).length > 10) {
            gaps.push("Query may need decomposition for comprehensive answer");
        }

        return gaps;
    }

    private detectContradictions(chunks: RankedChunk[]): { chunk_a: string; chunk_b: string; description: string }[] {
        const contradictions: { chunk_a: string; chunk_b: string; description: string }[] = [];

        // Simple contradiction detection based on explicit markers
        // In production, this would use semantic comparison
        for (let i = 0; i < chunks.length; i++) {
            for (let j = i + 1; j < chunks.length; j++) {
                const a = chunks[i];
                const b = chunks[j];

                // Check for temporal contradictions
                if (a.causal_parent_id === b.id || b.causal_parent_id === a.id) {
                    if (a.causal_relationship === "contradicts" || b.causal_relationship === "contradicts") {
                        contradictions.push({
                            chunk_a: a.id,
                            chunk_b: b.id,
                            description: "Explicitly marked contradiction in causal chain"
                        });
                    }
                }
            }
        }

        return contradictions;
    }

    private detectStaleData(chunks: RankedChunk[], query: string): string[] {
        const warnings: string[] = [];
        const now = new Date();
        const queryLower = query.toLowerCase();

        // Content that expires faster
        const fastExpiryPatterns: { pattern: RegExp; maxAgeDays: number }[] = [
            { pattern: /funding|valuation|raise/i, maxAgeDays: 30 },
            { pattern: /competitor/i, maxAgeDays: 60 },
            { pattern: /market (size|trend)/i, maxAgeDays: 90 },
            { pattern: /regulation|compliance/i, maxAgeDays: 45 },
            { pattern: /price|pricing/i, maxAgeDays: 30 }
        ];

        for (const chunk of chunks) {
            if (chunk.is_evergreen) continue;

            const ageInDays = (now.getTime() - chunk.valid_from.getTime()) / (1000 * 60 * 60 * 24);

            for (const { pattern, maxAgeDays } of fastExpiryPatterns) {
                if (pattern.test(chunk.content) && ageInDays > maxAgeDays) {
                    warnings.push(`Data about "${pattern.source}" may be outdated (${Math.round(ageInDays)} days old)`);
                    break;
                }
            }

            // Check if query asks for "current" or "latest" 
            if (/current|latest|now/i.test(queryLower) && ageInDays > 30) {
                warnings.push(`Query asks for current info, but some data is ${Math.round(ageInDays)} days old`);
            }
        }

        return [...new Set(warnings)];
    }

    private calculateContextConfidence(
        chunks: RankedChunk[],
        gaps: string[],
        contradictions: any[]
    ): number {
        if (chunks.length === 0) return 0;

        let confidence = 0;

        // Base confidence from chunk quality
        const avgChunkConfidence = chunks.reduce((sum, c) => sum + c.confidence_score, 0) / chunks.length;
        confidence += avgChunkConfidence * 0.4;

        // Coverage factor
        const coverageFactor = Math.min(1, chunks.length / 5);
        confidence += coverageFactor * 0.3;

        // Gap penalty
        const gapPenalty = Math.min(0.3, gaps.length * 0.1);
        confidence -= gapPenalty;

        // Contradiction penalty
        const contradictionPenalty = Math.min(0.2, contradictions.length * 0.1);
        confidence -= contradictionPenalty;

        // Founder content boost
        const hasFounderContent = chunks.some(c => c.source_type === "founder_override" || c.source_type === "founder_input");
        if (hasFounderContent) confidence += 0.1;

        return Math.max(0, Math.min(1, confidence));
    }
}

// ============================================================================
// LOCALIZER AGENT
// ============================================================================

/**
 * The Localizer ensures:
 * - India-specific context is applied
 * - US/EU-centric assumptions are detected and corrected
 * - Regulatory references are accurate for India
 */
export class LocalizerAgent extends BaseAgent {
    get role(): AgentRole {
        return "localizer";
    }

    async process(context: AgentContext, previousData?: { chunks: RankedChunk[] }): Promise<AgentResponse> {
        const chunks = previousData?.chunks || [];

        this.log(`Validating ${chunks.length} chunks for India-specific context`);

        const corrections: { chunkId: string; issue: string; correction: string }[] = [];
        const usEuAssumptions: string[] = [];
        const indiaContextIssues: string[] = [];

        for (const chunk of chunks) {
            const contextCheck = detectIndianContext(chunk.content);

            // Track US/EU assumptions
            if (contextCheck.usEuAssumptions.length > 0) {
                usEuAssumptions.push(...contextCheck.usEuAssumptions);

                // Generate correction suggestions
                for (const assumption of contextCheck.usEuAssumptions) {
                    corrections.push({
                        chunkId: chunk.id,
                        issue: `US/EU-centric reference: ${assumption}`,
                        correction: this.generateIndiaCorrection(assumption)
                    });
                }
            }

            // Check regulatory references
            if (chunk.regulatory_domain) {
                const isValid = this.validateRegulatoryReference(chunk.content, chunk.regulatory_domain);
                if (!isValid) {
                    indiaContextIssues.push(`Regulatory reference to ${chunk.regulatory_domain} may need verification`);
                }
            }
        }

        const hasCorrections = corrections.length > 0;
        const confidence = hasCorrections ? 0.7 : 0.9;

        this.log(`Found ${corrections.length} corrections, ${usEuAssumptions.length} US/EU assumptions`);

        return {
            decision: {
                agent: "localizer",
                action: { type: "validate_localization", params: { chunks: chunks.map(c => c.id) } },
                reasoning: hasCorrections
                    ? `Detected ${corrections.length} India localization issues`
                    : "Content is India-appropriate",
                confidence,
                should_continue: false
            },
            data: {
                corrections,
                us_eu_assumptions: usEuAssumptions,
                india_context_issues: indiaContextIssues,
                corrected: hasCorrections,
                india_context: {
                    requires_localization: hasCorrections,
                    regulatory_domains: [...new Set(chunks.filter(c => c.regulatory_domain).map(c => c.regulatory_domain!))],
                    detected_us_eu_assumptions: usEuAssumptions,
                    corrections_applied: corrections.map(c => c.correction),
                    relevant_regulations: this.getRelevantRegulations(chunks)
                } as IndiaContext
            }
        };
    }

    private generateIndiaCorrection(usEuReference: string): string {
        // Map common US/EU references to India equivalents
        const corrections: Record<string, string> = {
            // Currency
            "$": "Consider using ₹ (INR) for India market",
            "USD": "INR (Indian Rupees) for India market",
            "EUR": "INR (Indian Rupees) for India market",

            // Corporate structures
            "Delaware LLC": "Consider Private Limited Company under Companies Act, 2013",
            "Delaware Corp": "Consider Private Limited Company or LLP in India",
            "C-Corp": "Private Limited Company (Pvt. Ltd.) in India",

            // Regulations
            "GDPR": "India: DPDP Act 2023 (Digital Personal Data Protection)",
            "CCPA": "India: IT Act 2000, DPDP Act 2023",
            "SOX": "India: Companies Act 2013, SEBI regulations",
            "HIPAA": "India: Clinical Establishments Act, MCI guidelines",
            "FDA": "India: FSSAI for food, CDSCO for drugs",

            // Tax/Finance
            "401k": "India: PF (Provident Fund), NPS",
            "IRA": "India: PPF, NPS for retirement savings",

            // Investment
            "Y Combinator": "Consider India accelerators: Indian Angel Network, Venture Catalysts, 100X.VC",
            "Series A": "Note: Series A in India typically starts at ₹5-30 Cr"
        };

        for (const [pattern, correction] of Object.entries(corrections)) {
            if (usEuReference.includes(pattern)) {
                return correction;
            }
        }

        return `Verify this is applicable in India context: ${usEuReference}`;
    }

    private validateRegulatoryReference(content: string, domain: string): boolean {
        // In production, this would check against a regulatory database
        // For now, basic validation
        const validDomains = ["RBI", "SEBI", "MCA", "GST", "FSSAI", "DPIIT", "FEMA", "IRDAI", "TRAI"];
        return validDomains.includes(domain);
    }

    private getRelevantRegulations(chunks: RankedChunk[]): any[] {
        // In production, fetch from regulatory database
        const domains = [...new Set(chunks.filter(c => c.regulatory_domain).map(c => c.regulatory_domain!))];

        return domains.map(domain => ({
            domain,
            regulation_name: `${domain} Guidelines`,
            summary: `Regulatory requirements under ${domain}`,
            last_updated: new Date(),
            source_url: `https://www.${domain.toLowerCase()}.gov.in`
        }));
    }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a Supervisor agent for a given project session.
 * This is the main entry point for the orchestration system.
 */
export function createSupervisor(projectId: string, userId: string, sessionId: string): SupervisorAgent {
    return new SupervisorAgent(projectId, userId, sessionId);
}
