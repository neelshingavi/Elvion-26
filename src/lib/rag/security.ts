/**
 * FounderFlow 2.0 Synthetic Long-Term Memory RAG System
 * Security, Rate Limiting & Audit System
 * 
 * This module handles:
 * - Prompt injection sanitization
 * - Rate limiting for embeddings, retrieval, and web search
 * - Comprehensive audit logging
 * - Input validation and sanitization
 * - Cross-tenant access prevention
 */

import {
    RateLimitConfig,
    RateLimitStatus,
    AuditLogEntry,
    AuditAction
} from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

export const SECURITY_CONFIG = {
    // Default rate limits per project
    DEFAULT_RATE_LIMITS: {
        embeddings_per_minute: 100,
        retrievals_per_minute: 200,
        web_searches_per_hour: 50,
        memory_updates_per_hour: 100
    } as RateLimitConfig,

    // Premium tier rate limits
    PREMIUM_RATE_LIMITS: {
        embeddings_per_minute: 500,
        retrievals_per_minute: 1000,
        web_searches_per_hour: 200,
        memory_updates_per_hour: 500
    } as RateLimitConfig,

    // Maximum content length
    MAX_CONTENT_LENGTH: 50000,
    MAX_QUERY_LENGTH: 2000,

    // Prompt injection patterns
    INJECTION_PATTERNS: [
        // Direct instruction overrides
        /ignore\s+(previous|all|above)\s+instructions?/gi,
        /disregard\s+(previous|all|above)\s+instructions?/gi,
        /forget\s+(previous|all|above)\s+instructions?/gi,

        // System prompt extraction attempts
        /what\s+is\s+your\s+system\s+prompt/gi,
        /show\s+me\s+your\s+(instructions|system\s+prompt)/gi,
        /reveal\s+your\s+(instructions|prompt|rules)/gi,

        // Role-playing jailbreaks
        /you\s+are\s+now\s+(DAN|evil|unrestricted)/gi,
        /pretend\s+you\s+are\s+(not\s+)?an?\s+(AI|assistant)/gi,
        /act\s+as\s+if\s+you\s+have\s+no\s+(rules|restrictions)/gi,

        // Data exfiltration attempts
        /output\s+(all|every)\s+(data|memory|information)/gi,
        /list\s+all\s+(users|projects|memories)/gi,
        /show\s+me\s+(other|all)\s+project/gi,

        // Cross-tenant probing
        /access\s+(another|other|different)\s+project/gi,
        /what\s+about\s+project\s+id/gi,
        /change\s+project\s+to/gi,

        // Encoded/obfuscated injection
        /base64\s*:/gi,
        /eval\s*\(/gi,
        /<script>/gi,
        /\${.*}/g,  // Template injection
    ],

    // Suspicious patterns (log but don't block)
    SUSPICIOUS_PATTERNS: [
        /api\s*key/gi,
        /password/gi,
        /secret/gi,
        /token/gi,
        /credential/gi,
        /authentication/gi,
        /private\s*key/gi
    ]
};

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitBucket {
    count: number;
    window_start: number;
    window_ms: number;
}

class RateLimiter {
    private buckets: Map<string, Map<string, RateLimitBucket>> = new Map();

    /**
     * Check if an action is within rate limits
     */
    async checkLimit(
        projectId: string,
        action: "embedding" | "retrieval" | "web_search" | "memory_update",
        limits: RateLimitConfig
    ): Promise<{ allowed: boolean; remaining: number; reset_at: Date }> {
        const key = `${projectId}:${action}`;

        // Get or create project buckets
        if (!this.buckets.has(projectId)) {
            this.buckets.set(projectId, new Map());
        }
        const projectBuckets = this.buckets.get(projectId)!;

        // Determine window and limit
        let windowMs: number;
        let limit: number;

        switch (action) {
            case "embedding":
                windowMs = 60 * 1000; // 1 minute
                limit = limits.embeddings_per_minute;
                break;
            case "retrieval":
                windowMs = 60 * 1000;
                limit = limits.retrievals_per_minute;
                break;
            case "web_search":
                windowMs = 60 * 60 * 1000; // 1 hour
                limit = limits.web_searches_per_hour;
                break;
            case "memory_update":
                windowMs = 60 * 60 * 1000;
                limit = limits.memory_updates_per_hour;
                break;
        }

        const now = Date.now();
        let bucket = projectBuckets.get(action);

        // Reset bucket if window expired
        if (!bucket || now - bucket.window_start >= bucket.window_ms) {
            bucket = { count: 0, window_start: now, window_ms: windowMs };
            projectBuckets.set(action, bucket);
        }

        // Check limit
        const remaining = Math.max(0, limit - bucket.count);
        const reset_at = new Date(bucket.window_start + bucket.window_ms);

        if (bucket.count >= limit) {
            return { allowed: false, remaining: 0, reset_at };
        }

        // Increment counter
        bucket.count++;

        return { allowed: true, remaining: remaining - 1, reset_at };
    }

    /**
     * Get current rate limit status for a project
     */
    getStatus(projectId: string, limits: RateLimitConfig): RateLimitStatus {
        const projectBuckets = this.buckets.get(projectId);
        const now = Date.now();

        const getRemaining = (action: string, limit: number) => {
            const bucket = projectBuckets?.get(action);
            if (!bucket || now - bucket.window_start >= bucket.window_ms) {
                return limit;
            }
            return Math.max(0, limit - bucket.count);
        };

        // Find the earliest reset time
        let earliestReset = new Date(now + 60 * 60 * 1000);
        projectBuckets?.forEach(bucket => {
            const reset = new Date(bucket.window_start + bucket.window_ms);
            if (reset < earliestReset) earliestReset = reset;
        });

        return {
            project_id: projectId,
            embeddings_remaining: getRemaining("embedding", limits.embeddings_per_minute),
            retrievals_remaining: getRemaining("retrieval", limits.retrievals_per_minute),
            web_searches_remaining: getRemaining("web_search", limits.web_searches_per_hour),
            memory_updates_remaining: getRemaining("memory_update", limits.memory_updates_per_hour),
            reset_at: earliestReset
        };
    }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter();

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

export interface SanitizationResult {
    sanitized: string;
    blocked: boolean;
    block_reason?: string;
    warnings: string[];
    injections_removed: number;
}

/**
 * Sanitize user input to prevent prompt injection and other attacks
 */
export function sanitizeInput(input: string, context: "query" | "content" = "content"): SanitizationResult {
    const warnings: string[] = [];
    let injections_removed = 0;
    let sanitized = input;

    // Check length limits
    const maxLength = context === "query" ? SECURITY_CONFIG.MAX_QUERY_LENGTH : SECURITY_CONFIG.MAX_CONTENT_LENGTH;
    if (input.length > maxLength) {
        return {
            sanitized: "",
            blocked: true,
            block_reason: `Input exceeds maximum length of ${maxLength} characters`,
            warnings: [],
            injections_removed: 0
        };
    }

    // Check for injection patterns
    for (const pattern of SECURITY_CONFIG.INJECTION_PATTERNS) {
        const matches = sanitized.match(pattern);
        if (matches) {
            // Remove the injection attempt
            sanitized = sanitized.replace(pattern, "[REMOVED]");
            injections_removed += matches.length;
            warnings.push(`Removed potential injection: ${pattern.source}`);
        }
    }

    // Check for suspicious patterns (warn but don't block)
    for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
        if (pattern.test(sanitized)) {
            warnings.push(`Suspicious pattern detected: ${pattern.source}`);
        }
    }

    // Block if too many injections were attempted
    if (injections_removed >= 3) {
        return {
            sanitized: "",
            blocked: true,
            block_reason: "Multiple injection attempts detected",
            warnings,
            injections_removed
        };
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, " ").trim();

    // Remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

    return {
        sanitized,
        blocked: false,
        warnings,
        injections_removed
    };
}

/**
 * Validate that a project ID is well-formed and matches expected format
 */
export function validateProjectId(projectId: string): { valid: boolean; reason?: string } {
    if (!projectId) {
        return { valid: false, reason: "Project ID is required" };
    }

    if (typeof projectId !== "string") {
        return { valid: false, reason: "Project ID must be a string" };
    }

    // UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
        return { valid: false, reason: "Project ID must be a valid UUID" };
    }

    return { valid: true };
}

/**
 * Validate user ID
 */
export function validateUserId(userId: string): { valid: boolean; reason?: string } {
    if (!userId) {
        return { valid: false, reason: "User ID is required" };
    }

    if (typeof userId !== "string") {
        return { valid: false, reason: "User ID must be a string" };
    }

    if (userId.length < 10 || userId.length > 128) {
        return { valid: false, reason: "User ID has invalid length" };
    }

    // Prevent obvious injection attempts in user ID
    if (/[<>"'`;]/.test(userId)) {
        return { valid: false, reason: "User ID contains invalid characters" };
    }

    return { valid: true };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

interface AuditContext {
    projectId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
}

class AuditLogger {
    private logs: AuditLogEntry[] = []; // In production, write to persistent storage

    /**
     * Log an audit event
     */
    async log(
        context: AuditContext,
        action: AuditAction,
        resourceType: AuditLogEntry["resource_type"],
        resourceId: string,
        details: Record<string, any> = {}
    ): Promise<void> {
        const entry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            project_id: context.projectId,
            user_id: context.userId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            ip_address: context.ipAddress,
            user_agent: context.userAgent
        };

        // In production, write to database asynchronously
        this.logs.push(entry);

        // Also log to console for debugging
        console.log(`[AUDIT] ${context.projectId.substring(0, 8)}... | ${context.userId.substring(0, 8)}... | ${action} ${resourceType}:${resourceId.substring(0, 8)}...`);

        // Check for suspicious patterns
        await this.checkForSuspiciousActivity(entry);
    }

    /**
     * Log a security event (higher priority than regular audit)
     */
    async logSecurity(
        context: AuditContext,
        event: "injection_attempt" | "rate_limit_exceeded" | "invalid_project_access" | "authentication_failure",
        details: Record<string, any>
    ): Promise<void> {
        console.error(`[SECURITY] ${event} | Project: ${context.projectId.substring(0, 8)}... | User: ${context.userId.substring(0, 8)}... | Details:`, details);

        await this.log(
            context,
            "read", // Using 'read' as a placeholder - in production, add security-specific actions
            "retrieval",
            "security_event",
            { event, ...details }
        );

        // In production, also:
        // - Send to security monitoring system
        // - Increment user risk score
        // - Potentially trigger alerts
    }

    /**
     * Check for patterns that might indicate abuse
     */
    private async checkForSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
        // Get recent logs for this user/project
        const recentLogs = this.logs.filter(log =>
            log.project_id === entry.project_id &&
            log.user_id === entry.user_id &&
            log.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
        );

        // Check for unusual activity patterns
        const searchCount = recentLogs.filter(log => log.action === "search").length;
        if (searchCount > 50) {
            console.warn(`[SECURITY] Unusual search volume: ${searchCount} searches in 5 minutes for user ${entry.user_id.substring(0, 8)}...`);
        }

        // Check for rapid project switches (might indicate enumeration attempt)
        const projectIds = new Set(recentLogs.map(log => log.project_id));
        if (projectIds.size > 5) {
            console.warn(`[SECURITY] User accessing multiple projects rapidly: ${projectIds.size} projects in 5 minutes`);
        }
    }

    /**
     * Query audit logs
     */
    async query(options: {
        projectId: string;
        userId?: string;
        action?: AuditAction;
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
    }): Promise<AuditLogEntry[]> {
        let results = this.logs.filter(log => log.project_id === options.projectId);

        if (options.userId) {
            results = results.filter(log => log.user_id === options.userId);
        }

        if (options.action) {
            results = results.filter(log => log.action === options.action);
        }

        if (options.fromDate) {
            results = results.filter(log => log.timestamp >= options.fromDate!);
        }

        if (options.toDate) {
            results = results.filter(log => log.timestamp <= options.toDate!);
        }

        // Sort by timestamp descending
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Apply limit
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }
}

// Global audit logger instance
const globalAuditLogger = new AuditLogger();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Security context for a request
 */
export interface SecurityContext {
    projectId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId: string;
    rateLimits: RateLimitConfig;
}

/**
 * Validate and create a security context for a request
 */
export async function createSecurityContext(
    projectId: string,
    userId: string,
    options: {
        ipAddress?: string;
        userAgent?: string;
        isPremium?: boolean;
    } = {}
): Promise<{ context: SecurityContext | null; error?: string }> {
    // Validate project ID
    const projectValidation = validateProjectId(projectId);
    if (!projectValidation.valid) {
        await globalAuditLogger.logSecurity(
            { projectId: "unknown", userId: userId || "unknown" },
            "invalid_project_access",
            { reason: projectValidation.reason, attempted_project: projectId }
        );
        return { context: null, error: projectValidation.reason };
    }

    // Validate user ID
    const userValidation = validateUserId(userId);
    if (!userValidation.valid) {
        await globalAuditLogger.logSecurity(
            { projectId, userId: "unknown" },
            "authentication_failure",
            { reason: userValidation.reason }
        );
        return { context: null, error: userValidation.reason };
    }

    // Create context
    const context: SecurityContext = {
        projectId,
        userId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        sessionId: crypto.randomUUID(),
        rateLimits: options.isPremium
            ? SECURITY_CONFIG.PREMIUM_RATE_LIMITS
            : SECURITY_CONFIG.DEFAULT_RATE_LIMITS
    };

    return { context };
}

/**
 * Check rate limit and log the action
 */
export async function checkAndLogRateLimit(
    context: SecurityContext,
    action: "embedding" | "retrieval" | "web_search" | "memory_update"
): Promise<{ allowed: boolean; remaining: number; reset_at: Date }> {
    const result = await globalRateLimiter.checkLimit(
        context.projectId,
        action,
        context.rateLimits
    );

    if (!result.allowed) {
        await globalAuditLogger.logSecurity(
            {
                projectId: context.projectId,
                userId: context.userId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
            },
            "rate_limit_exceeded",
            { action, reset_at: result.reset_at }
        );
    }

    return result;
}

/**
 * Sanitize input and log any warnings
 */
export async function securedSanitize(
    context: SecurityContext,
    input: string,
    inputType: "query" | "content"
): Promise<{ result: SanitizationResult; allowed: boolean }> {
    const result = sanitizeInput(input, inputType);

    // Log injection attempts
    if (result.injections_removed > 0) {
        await globalAuditLogger.logSecurity(
            {
                projectId: context.projectId,
                userId: context.userId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
            },
            "injection_attempt",
            {
                input_type: inputType,
                injections_removed: result.injections_removed,
                warnings: result.warnings
            }
        );
    }

    // Log but don't block for suspicious patterns
    if (result.warnings.length > 0 && result.injections_removed === 0) {
        await globalAuditLogger.log(
            {
                projectId: context.projectId,
                userId: context.userId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent
            },
            "read",
            "retrieval",
            "suspicious_input",
            { warnings: result.warnings }
        );
    }

    return { result, allowed: !result.blocked };
}

/**
 * Log a retrieval action with full details
 */
export async function logRetrieval(
    context: SecurityContext,
    query: string,
    chunkIds: string[],
    confidence: number
): Promise<void> {
    await globalAuditLogger.log(
        {
            projectId: context.projectId,
            userId: context.userId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            sessionId: context.sessionId
        },
        "retrieve",
        "retrieval",
        context.sessionId,
        {
            query_preview: query.substring(0, 100),
            chunks_retrieved: chunkIds.length,
            chunk_ids: chunkIds,
            confidence
        }
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    globalRateLimiter as rateLimiter,
    globalAuditLogger as auditLogger
};

export function getRateLimitStatus(projectId: string, isPremium: boolean = false): RateLimitStatus {
    const limits = isPremium
        ? SECURITY_CONFIG.PREMIUM_RATE_LIMITS
        : SECURITY_CONFIG.DEFAULT_RATE_LIMITS;
    return globalRateLimiter.getStatus(projectId, limits);
}
