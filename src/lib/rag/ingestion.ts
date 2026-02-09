/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Semantic Chunking & Async Ingestion Pipeline
 * 
 * This module handles:
 * - Semantic boundary detection (NOT fixed-size chunking)
 * - Special content handling (tables, code blocks, lists)
 * - Metadata enrichment
 * - Async embedding generation
 * - Deduplication via content hashing
 */

import {
    IngestionRequest,
    IngestionJob,
    SemanticChunk,
    ChunkingResult,
    SpecialContentType,
    MemoryChunk,
    MemorySourceType,
    FounderStage,
    ConfidenceLevel
} from "./types";
import { createProjectClient, ProjectScopedClient } from "./database";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const CHUNKING_CONFIG = {
    // Target chunk size in tokens (approximate)
    TARGET_CHUNK_TOKENS: 400,
    MIN_CHUNK_TOKENS: 100,
    MAX_CHUNK_TOKENS: 800,

    // Overlap for context preservation
    OVERLAP_TOKENS: 50,

    // Special content handling
    TABLE_MAX_ROWS: 20,
    CODE_BLOCK_MAX_LINES: 100,
    LIST_MAX_ITEMS: 30,

    // India-specific keywords for detection
    INDIAN_CONTEXT_PATTERNS: [
        /\b(INR|₹|rupee|crore|lakh)\b/i,
        /\b(RBI|SEBI|MCA|GST|FSSAI|DPIIT|Startup India)\b/i,
        /\b(PAN|Aadhaar|GSTIN|CIN|LLPIN)\b/i,
        /\b(Section 80IAC|Angel Tax|ESOP|FDI|FPI)\b/i,
        /\b(Companies Act|FEMA|LLP Act|Shops and Establishments)\b/i,
        /\b(Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Chennai|Pune|Gurgaon|Noida)\b/i,
        /\b(Flipkart|Paytm|Razorpay|Zerodha|Ola|Swiggy|Zomato)\b/i
    ],

    // US/EU-centric patterns that need localization correction
    US_EU_PATTERNS: [
        /\$\d+/,
        /\b(USD|EUR|GBP)\b/,
        /\b(401k|IRA|W-2|1099)\b/i,
        /\b(GDPR|CCPA|SOX|HIPAA|FDA)\b/,
        /\b(Delaware|Wyoming|Nevada) (LLC|Corp|Inc)\b/i,
        /\b(Y Combinator|Andreessen|Sequoia US)\b/i,
        /\bSeries [A-F]\b.*\$\d+M/i
    ]
};

// ============================================================================
// CONTENT HASH GENERATION
// ============================================================================

export async function generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================================
// TOKEN ESTIMATION (Approximate for GPT-style tokenization)
// ============================================================================

export function estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token for English
    // More accurate in production: use tiktoken or similar
    return Math.ceil(text.length / 4);
}

// ============================================================================
// SEMANTIC BOUNDARY DETECTION
// ============================================================================

interface BoundaryMarker {
    index: number;
    type: "heading" | "paragraph" | "list_start" | "list_end" | "code_start" | "code_end" | "table_start" | "table_end" | "section_break";
    strength: number; // 0-10, higher = stronger boundary
}

function detectSemanticBoundaries(content: string): BoundaryMarker[] {
    const markers: BoundaryMarker[] = [];
    const lines = content.split("\n");
    let currentIndex = 0;

    let inCodeBlock = false;
    let inTable = false;
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = currentIndex;

        // Detect headings (Markdown style)
        if (/^#{1,6}\s/.test(line)) {
            const headingLevel = line.match(/^(#+)/)?.[1].length || 1;
            markers.push({
                index: lineStart,
                type: "heading",
                strength: 10 - headingLevel // H1 = 9, H6 = 4
            });
        }

        // Detect code blocks
        if (line.startsWith("```")) {
            if (inCodeBlock) {
                markers.push({ index: lineStart, type: "code_end", strength: 7 });
                inCodeBlock = false;
            } else {
                markers.push({ index: lineStart, type: "code_start", strength: 7 });
                inCodeBlock = true;
            }
        }

        // Detect tables (Markdown pipe tables)
        if (/^\|.*\|$/.test(line) && !inTable) {
            markers.push({ index: lineStart, type: "table_start", strength: 6 });
            inTable = true;
        } else if (inTable && !/^\|.*\|$/.test(line)) {
            markers.push({ index: lineStart, type: "table_end", strength: 6 });
            inTable = false;
        }

        // Detect list starts
        if (/^(\s*[-*+]|\s*\d+\.)\s/.test(line) && !inList) {
            markers.push({ index: lineStart, type: "list_start", strength: 4 });
            inList = true;
        } else if (inList && !/^(\s*[-*+]|\s*\d+\.|\s+)/.test(line) && line.trim()) {
            markers.push({ index: lineStart, type: "list_end", strength: 4 });
            inList = false;
        }

        // Detect paragraph breaks (double newline)
        if (line.trim() === "" && i > 0 && lines[i - 1].trim() !== "") {
            markers.push({ index: lineStart, type: "paragraph", strength: 3 });
        }

        // Detect section breaks (horizontal rules)
        if (/^(---|\*\*\*|___)$/.test(line.trim())) {
            markers.push({ index: lineStart, type: "section_break", strength: 8 });
        }

        currentIndex += line.length + 1; // +1 for newline
    }

    return markers.sort((a, b) => a.index - b.index);
}

// ============================================================================
// SPECIAL CONTENT EXTRACTION
// ============================================================================

interface ExtractedSpecialContent {
    type: SpecialContentType;
    content: string;
    startIndex: number;
    endIndex: number;
    metadata?: Record<string, any>;
}

function extractSpecialContent(content: string): ExtractedSpecialContent[] {
    const extracted: ExtractedSpecialContent[] = [];

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        extracted.push({
            type: "code_block",
            content: match[2],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            metadata: { language: match[1] || "unknown" }
        });
    }

    // Extract tables
    const tableRegex = /(\|[^\n]+\|\n)+/g;
    while ((match = tableRegex.exec(content)) !== null) {
        const tableContent = match[0];
        const rows = tableContent.trim().split("\n").length;
        extracted.push({
            type: "table",
            content: tableContent,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            metadata: { rowCount: rows }
        });
    }

    return extracted;
}

// ============================================================================
// SEMANTIC CHUNKING
// ============================================================================

export function semanticChunk(content: string): ChunkingResult {
    const boundaries = detectSemanticBoundaries(content);
    const specialContent = extractSpecialContent(content);
    const chunks: SemanticChunk[] = [];

    let currentChunk = "";
    let chunkStartIndex = 0;
    let currentBoundaryType = "paragraph";

    // Process content respecting semantic boundaries
    for (let i = 0; i < boundaries.length; i++) {
        const boundary = boundaries[i];
        const nextBoundary = boundaries[i + 1];
        const segmentEnd = nextBoundary ? nextBoundary.index : content.length;

        const segment = content.substring(boundary.index, segmentEnd);
        const segmentTokens = estimateTokens(segment);
        const currentTokens = estimateTokens(currentChunk);

        // Check if segment contains special content
        const specialInSegment = specialContent.find(
            sc => sc.startIndex >= boundary.index && sc.endIndex <= segmentEnd
        );

        // Decision: should we create a new chunk?
        const shouldSplit = (
            // Current chunk is big enough and we hit a strong boundary
            (currentTokens >= CHUNKING_CONFIG.TARGET_CHUNK_TOKENS && boundary.strength >= 5) ||
            // Current chunk would exceed max if we add this segment
            (currentTokens + segmentTokens > CHUNKING_CONFIG.MAX_CHUNK_TOKENS) ||
            // Special content should be in its own chunk
            (specialInSegment && currentTokens > CHUNKING_CONFIG.MIN_CHUNK_TOKENS)
        );

        if (shouldSplit && currentChunk.trim()) {
            // Finalize current chunk
            chunks.push({
                content: currentChunk.trim(),
                start_offset: chunkStartIndex,
                end_offset: boundary.index,
                semantic_boundary: currentBoundaryType,
                estimated_tokens: estimateTokens(currentChunk),
                special_content: undefined
            });

            // Start new chunk
            currentChunk = segment;
            chunkStartIndex = boundary.index;
            currentBoundaryType = boundary.type;
        } else {
            // Add to current chunk
            currentChunk += segment;
        }

        // Track special content for metadata
        if (specialInSegment) {
            // If special content, ensure it gets tagged
            currentBoundaryType = specialInSegment.type as any;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
        chunks.push({
            content: currentChunk.trim(),
            start_offset: chunkStartIndex,
            end_offset: content.length,
            semantic_boundary: currentBoundaryType,
            estimated_tokens: estimateTokens(currentChunk),
            special_content: undefined
        });
    }

    // Handle edge case: if no boundaries found, chunk the whole content
    if (chunks.length === 0 && content.trim()) {
        chunks.push({
            content: content.trim(),
            start_offset: 0,
            end_offset: content.length,
            semantic_boundary: "paragraph",
            estimated_tokens: estimateTokens(content),
            special_content: undefined
        });
    }

    return {
        chunks,
        total_tokens: chunks.reduce((sum, c) => sum + c.estimated_tokens, 0),
        chunk_method: specialContent.length > 0 ? "special_case" : "semantic",
        special_content_types: [...new Set(specialContent.map(sc => sc.type))]
    };
}

// ============================================================================
// INDIA CONTEXT DETECTION
// ============================================================================

export function detectIndianContext(content: string): {
    isIndianContext: boolean;
    requiresLocalization: boolean;
    detectedPatterns: string[];
    usEuAssumptions: string[];
} {
    const detectedPatterns: string[] = [];
    const usEuAssumptions: string[] = [];

    // Check for Indian context indicators
    for (const pattern of CHUNKING_CONFIG.INDIAN_CONTEXT_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
            detectedPatterns.push(matches[0]);
        }
    }

    // Check for US/EU-centric content that needs localization
    for (const pattern of CHUNKING_CONFIG.US_EU_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
            usEuAssumptions.push(matches[0]);
        }
    }

    return {
        isIndianContext: detectedPatterns.length > 0,
        requiresLocalization: usEuAssumptions.length > 0 && detectedPatterns.length === 0,
        detectedPatterns,
        usEuAssumptions
    };
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

export function calculateConfidence(
    sourceType: MemorySourceType,
    content: string,
    metadata?: Record<string, any>
): { score: number; level: ConfidenceLevel } {
    let score = 0.5; // Default medium

    // Source type weighting
    const sourceWeights: Record<MemorySourceType, number> = {
        founder_input: 0.9,
        founder_override: 1.0,
        ai_analysis: 0.6,
        market_research: 0.65,
        competitor_intel: 0.55,
        regulatory_data: 0.8,
        financial_projection: 0.5,
        customer_feedback: 0.7,
        meeting_transcript: 0.75,
        document_extract: 0.6,
        web_search: 0.4,
        pitch_feedback: 0.65,
        investor_interaction: 0.7
    };

    score = sourceWeights[sourceType] || 0.5;

    // Adjust based on content characteristics
    // Longer, more detailed content tends to be more reliable
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 200) score += 0.05;
    if (wordCount < 20) score -= 0.1;

    // Presence of specific data points increases confidence
    if (/\d+%|\$[\d,]+|₹[\d,]+|\b\d+\s*(crore|lakh|million|billion)/i.test(content)) {
        score += 0.05;
    }

    // Citations or references increase confidence
    if (/\[source\]|\[citation\]|according to|reported by|data from/i.test(content)) {
        score += 0.05;
    }

    // Clamp to valid range
    score = Math.max(0, Math.min(1, score));

    // Determine level
    let level: ConfidenceLevel;
    if (sourceType === "founder_override" || sourceType === "founder_input") {
        level = "founder_verified";
    } else if (score >= 0.8) {
        level = "very_high";
    } else if (score >= 0.65) {
        level = "high";
    } else if (score >= 0.5) {
        level = "medium";
    } else if (score >= 0.35) {
        level = "low";
    } else {
        level = "very_low";
    }

    return { score, level };
}

// ============================================================================
// FOUNDER WEIGHT CALCULATION
// ============================================================================

export function calculateFounderWeight(sourceType: MemorySourceType): number {
    // Founder overrides have the highest weight
    if (sourceType === "founder_override") return 2.0;
    if (sourceType === "founder_input") return 1.8;
    if (sourceType === "meeting_transcript") return 1.5;
    if (sourceType === "customer_feedback") return 1.4;
    if (sourceType === "investor_interaction") return 1.3;
    if (sourceType === "pitch_feedback") return 1.3;
    if (sourceType === "regulatory_data") return 1.2;
    if (sourceType === "market_research") return 1.1;
    if (sourceType === "competitor_intel") return 1.0;
    if (sourceType === "ai_analysis") return 0.9;
    if (sourceType === "web_search") return 0.7;

    return 1.0; // Default
}

// ============================================================================
// EMBEDDING GENERATION (Async, Rate-Limited)
// ============================================================================

export async function generateEmbedding(text: string): Promise<number[]> {
    // In production, use OpenAI text-embedding-ada-002 or similar
    // For now, return a placeholder that simulates the API call

    // Rate limit check would happen here

    // Placeholder: generate random 1536-dim vector
    // In production:
    /*
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "text-embedding-ada-002",
            input: text.substring(0, 8000) // Token limit
        })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
    */

    // Placeholder embedding
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
}

// ============================================================================
// INGESTION PIPELINE
// ============================================================================

export interface IngestionResult {
    job: IngestionJob;
    chunks_created: MemoryChunk[];
    duplicates_skipped: number;
    errors: string[];
}

/**
 * Main ingestion function
 * This should be called from a background job processor (not synchronously during user request)
 */
export async function processIngestion(
    request: IngestionRequest,
    userId: string
): Promise<IngestionResult> {
    const client = createProjectClient(request.project_id, userId);
    const errors: string[] = [];
    const chunksCreated: MemoryChunk[] = [];
    let duplicatesSkipped = 0;

    // Create ingestion job
    const job = await client.createIngestionJob({
        project_id: request.project_id,
        status: "processing",
        request,
        started_at: new Date(),
        retry_count: 0,
        max_retries: 3,
        chunks_created: 0
    });

    try {
        // Step 1: Semantic chunking
        console.log(`[INGESTION] Chunking content for project ${request.project_id.substring(0, 8)}...`);
        const chunkingResult = semanticChunk(request.content);

        // Step 2: Process each chunk
        for (const chunk of chunkingResult.chunks) {
            try {
                // Generate content hash for deduplication
                const contentHash = await generateContentHash(chunk.content);

                // Check for duplicates via hash
                // In production, this would be a database lookup

                // Detect Indian context
                const indianContext = detectIndianContext(chunk.content);

                // Calculate confidence
                const confidence = calculateConfidence(request.source_type, chunk.content, request.metadata);

                // Calculate founder weight
                const founderWeight = request.is_founder_override
                    ? 2.0
                    : calculateFounderWeight(request.source_type);

                // Generate embedding (async, rate-limited)
                console.log(`[INGESTION] Generating embedding for chunk...`);
                const embedding = await generateEmbedding(chunk.content);

                // Prepare metadata-enriched chunk
                const memoryChunk = await client.insertMemoryChunk({
                    content: chunk.content,
                    content_hash: contentHash,
                    embedding,

                    source_type: request.source_type,
                    source_id: request.source_id,
                    source_url: request.source_url,

                    valid_from: new Date(),
                    valid_until: undefined,
                    is_evergreen: false,
                    temporal_relevance: "current",

                    confidence_score: confidence.score,
                    confidence_level: confidence.level,
                    founder_weight: founderWeight,
                    credibility_score: confidence.score,

                    causal_parent_id: undefined,
                    causal_relationship: undefined,
                    causal_chain_depth: 0,

                    founder_stage: request.founder_stage,
                    tags: extractTags(chunk.content, request.metadata),
                    categories: extractCategories(request.source_type, chunk.content),

                    indian_context: indianContext.isIndianContext,
                    requires_localization: indianContext.requiresLocalization,
                    regulatory_domain: extractRegulatoryDomain(chunk.content),

                    retrieval_count: 0,
                    average_usefulness_score: 0.5,

                    created_by: userId,
                    is_active: true,
                    is_invalidated: false
                });

                chunksCreated.push(memoryChunk);
            } catch (chunkError: any) {
                errors.push(`Chunk error: ${chunkError.message}`);
            }
        }

        // Update job status
        await client.updateIngestionJob(job.id, {
            status: "completed",
            completed_at: new Date(),
            chunks_created: chunksCreated.length
        });

    } catch (error: any) {
        errors.push(`Pipeline error: ${error.message}`);
        await client.updateIngestionJob(job.id, {
            status: "failed",
            error: error.message
        });
    }

    return {
        job: { ...job, status: errors.length > 0 ? "failed" : "completed" },
        chunks_created: chunksCreated,
        duplicates_skipped: duplicatesSkipped,
        errors
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractTags(content: string, metadata?: Record<string, any>): string[] {
    const tags: string[] = [];

    // Extract from metadata if provided
    if (metadata?.tags) {
        tags.push(...metadata.tags);
    }

    // Auto-detect common tags
    if (/market size|TAM|SAM|SOM/i.test(content)) tags.push("market-size");
    if (/competitor|competitive|rivalry/i.test(content)) tags.push("competitive-analysis");
    if (/customer|user|persona/i.test(content)) tags.push("customer-discovery");
    if (/funding|raise|investment|investor/i.test(content)) tags.push("fundraising");
    if (/product|MVP|feature|roadmap/i.test(content)) tags.push("product");
    if (/hire|team|culture|HR/i.test(content)) tags.push("team");
    if (/legal|compliance|regulation/i.test(content)) tags.push("legal-compliance");
    if (/pitch|deck|presentation/i.test(content)) tags.push("pitch");
    if (/revenue|monetization|pricing/i.test(content)) tags.push("business-model");

    return [...new Set(tags)];
}

function extractCategories(sourceType: MemorySourceType, content: string): string[] {
    const categories: string[] = [];

    // Source-based categories
    switch (sourceType) {
        case "founder_input":
        case "founder_override":
            categories.push("founder-knowledge");
            break;
        case "market_research":
        case "competitor_intel":
            categories.push("market-intelligence");
            break;
        case "regulatory_data":
            categories.push("compliance");
            break;
        case "customer_feedback":
            categories.push("customer-insights");
            break;
        case "financial_projection":
            categories.push("financial");
            break;
        case "pitch_feedback":
        case "investor_interaction":
            categories.push("fundraising");
            break;
    }

    return categories;
}

function extractRegulatoryDomain(content: string): string | undefined {
    if (/\bRBI\b|Reserve Bank|banking regulation/i.test(content)) return "RBI";
    if (/\bSEBI\b|Securities|stock exchange/i.test(content)) return "SEBI";
    if (/\bGST\b|goods and services tax/i.test(content)) return "GST";
    if (/\bMCA\b|Ministry of Corporate|Companies Act/i.test(content)) return "MCA";
    if (/\bFSSAI\b|food safety/i.test(content)) return "FSSAI";
    if (/\bDPIIT\b|Startup India/i.test(content)) return "DPIIT";
    if (/\bFEMA\b|foreign exchange/i.test(content)) return "FEMA";
    if (/\bIRDAI\b|insurance/i.test(content)) return "IRDAI";
    if (/\bTRAI\b|telecom/i.test(content)) return "TRAI";

    return undefined;
}
