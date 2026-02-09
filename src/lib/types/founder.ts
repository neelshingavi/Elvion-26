/**
 * FounderFlow - Core Type Definitions
 * Comprehensive type system for the founder-first AI-powered startup operating system
 */

import { Timestamp } from "firebase/firestore";

// ============================================
// SECTION 1: FOUNDER & USER TYPES
// ============================================

export type FounderRole = "founder" | "admin";

export interface FounderProfile {
    uid: string;
    role: FounderRole;
    email: string;
    displayName?: string;
    photoURL?: string;
    bannerURL?: string;
    activeStartupId?: string;
    // Onboarding intake data
    founderIntake?: FounderIntake;
    about?: string;
    skills?: string[];
    age?: number;
    phone?: string;
    education?: string;
    location?: string;
    // Account metadata
    accountStatus: "active" | "suspended";
    lastLoginAt?: Timestamp;
    createdAt: Timestamp;
    connectionCount?: number;
    industries?: string[];
    // India-specific demographics
    demographicSegment?: IndianDemographic;
}

export interface FounderIntake {
    background: string;
    priorExperience: string;
    riskAppetite: "conservative" | "moderate" | "aggressive";
    longTermVision: string;
    interviewCompletedAt: Timestamp;
    interviewDurationMinutes: number;
}

export type IndianDemographic =
    | "tier1_metro"           // Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad
    | "tier2_emerging"        // Pune, Ahmedabad, Jaipur, Lucknow, etc.
    | "tier3_aspirational"    // Smaller cities with growing startup presence
    | "rural_digital"         // Rural areas with digital connectivity
    | "nri_returnee"          // Non-resident Indians returning to build
    | "student_founder"       // College/university founders
    | "corporate_spinout"     // Founders from corporate backgrounds
    | "serial_entrepreneur";  // Experienced repeat founders

// ============================================
// SECTION 2: PROJECT/STARTUP TYPES
// ============================================

export type StartupStage =
    | "idea_submitted"
    | "intake_complete"
    | "idea_validated"
    | "roadmap_created"
    | "execution_active"
    | "mvp"
    | "launch"
    | "growth"
    | "pivot_mode";

export type ProjectStatus = "active" | "archived" | "paused";

export interface Startup {
    startupId: string;
    ownerId: string;
    name: string;
    oneSentencePitch: string;        // Required: One-sentence pitch
    targetDemographic: IndianDemographic;  // Required: India-specific segment
    industry: string;
    stage: StartupStage;
    projectStatus: ProjectStatus;
    vision?: string;
    problemStatement?: string;
    idea: string;
    // Business plan sections
    businessPlan?: LiveBusinessPlan;
    // First 48 hours data
    first48HoursPlan?: First48HoursPlan;
    // Timestamps
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface StartupMember {
    id: string;
    startupId: string;
    userId: string;
    role: "owner" | "cofounder" | "team" | "mentor";
    joinedAt: Timestamp;
}

export interface LiveBusinessPlan {
    sections: BusinessPlanSection[];
    lastUpdated: Timestamp;
    aiGeneratedInsights: string[];
}

export interface BusinessPlanSection {
    id: string;
    title: string;
    content: string;
    linkedDataModels: string[];  // IDs of linked assumptions/data
    lastEdited: Timestamp;
    aiSuggestions?: string[];
}

export interface First48HoursPlan {
    generatedAt: Timestamp;
    tasks: First48HoursTask[];
    completionPercentage: number;
}

export interface First48HoursTask {
    id: string;
    title: string;
    description: string;
    assumptionBeingValidated: string;
    timeBoxHours: number;
    status: "pending" | "in_progress" | "done";
    priority: "high" | "medium" | "low";
    dueAt: Timestamp;
}

// ============================================
// SECTION 3: CANVAS & DOCUMENT TYPES
// ============================================

export interface CanvasBlock {
    id: string;
    type: CanvasBlockType;
    content: string;
    metadata?: Record<string, any>;
    position: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    aiAnnotations?: AIAnnotation[];
}

export type CanvasBlockType =
    | "heading1"
    | "heading2"
    | "heading3"
    | "paragraph"
    | "bullet_list"
    | "numbered_list"
    | "quote"
    | "code"
    | "embed"        // Loom, Figma, etc.
    | "table"
    | "chart"
    | "divider"
    | "ai_suggestion";

export interface AIAnnotation {
    id: string;
    type: "warning" | "suggestion" | "insight" | "risk";
    message: string;
    confidence: number;  // 0-100
    createdAt: Timestamp;
    dismissed: boolean;
}

export interface StrategyCanvas {
    id: string;
    startupId: string;
    title: string;
    blocks: CanvasBlock[];
    version: number;
    versionHistory: CanvasVersion[];
    collaborators: string[];  // user IDs
    lastEditedBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CanvasVersion {
    version: number;
    blocks: CanvasBlock[];
    savedAt: Timestamp;
    savedBy: string;
    changeDescription?: string;
}

// ============================================
// SECTION 4: TASK & ROADMAP TYPES
// ============================================

export interface Task {
    id: string;
    startupId: string;
    title: string;
    description?: string;
    instruction?: string;
    reason?: string;
    priority: TaskPriority;
    status: TaskStatus;
    // Goal linkage
    goalId?: string;
    milestoneId?: string;
    // AI metadata
    createdByAgent?: string;
    aiResponse?: string;
    aiPriorityScore?: number;  // 0-100
    isStale?: boolean;
    // Timestamps
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
    dueDate?: Timestamp;
    // Feedback
    rating?: 1 | 2 | 3 | 4 | 5;
}

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done" | "blocked" | "cancelled";

export interface Goal {
    id: string;
    startupId: string;
    title: string;
    description: string;
    targetDate: Timestamp;
    status: "active" | "achieved" | "abandoned";
    milestones: Milestone[];
    tasks: string[];  // Task IDs
    createdAt: Timestamp;
}

export interface Milestone {
    id: string;
    title: string;
    description: string;
    targetDate: Timestamp;
    status: "pending" | "achieved";
    dependsOn: string[];  // Other milestone IDs
}

export interface RoadmapPhase {
    id: string;
    title: string;
    description: string;
    startDate: Timestamp;
    endDate: Timestamp;
    goals: string[];  // Goal IDs
    status: "upcoming" | "active" | "completed";
}

export interface Sprint {
    id: string;
    startupId: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    tasks: string[];  // Task IDs
    aiProposedScope: string[];
    velocity?: number;  // Historical velocity score
    status: "planning" | "active" | "completed" | "cancelled";
}

// ============================================
// SECTION 5: MARKET INTELLIGENCE TYPES
// ============================================

export interface MarketPulse {
    id: string;
    startupId: string;
    timestamp: Timestamp;
    keywordTrends: KeywordTrend[];
    socialSentiment: SocialSentiment;
    regulatoryUpdates: RegulatoryUpdate[];
}

export interface KeywordTrend {
    keyword: string;
    volume: number;
    trend: "rising" | "stable" | "declining";
    relevanceScore: number;
}

export interface SocialSentiment {
    overallScore: number;  // -100 to 100
    platforms: {
        twitter?: number;
        linkedin?: number;
        reddit?: number;
    };
    topMentions: string[];
}

export interface RegulatoryUpdate {
    id: string;
    title: string;
    summary: string;
    impact: "high" | "medium" | "low";
    source: string;
    publishedAt: Timestamp;
    relevanceToStartup: string;
}

export interface Competitor {
    id: string;
    startupId: string;  // Parent startup tracking this competitor
    name: string;
    website?: string;
    description: string;
    // Auto-updating fields
    lastFunding?: {
        amount: string;
        round: string;
        date: Timestamp;
        investors: string[];
    };
    pricing?: string[];
    features?: string[];
    recentLaunches?: {
        title: string;
        date: Timestamp;
        description: string;
    }[];
    // Alert tracking
    lastChecked: Timestamp;
    changeAlerts: CompetitorAlert[];
}

export interface CompetitorAlert {
    id: string;
    type: "funding" | "pricing" | "feature" | "launch" | "team";
    title: string;
    description: string;
    createdAt: Timestamp;
    isRead: boolean;
}

// ============================================
// SECTION 6: AI AGENT TYPES
// ============================================

export type AgentType =
    | "strategist"    // Reasoning model for pivots, planning, trade-offs
    | "researcher"    // Search + RAG for data gathering
    | "critic"        // Identifies flaws, challenges assumptions
    | "executor"      // Converts strategy into tasks
    | "validator"     // Idea validation
    | "planner"       // Roadmap generation
    | "networking";   // Founder connections

export interface AgentRun {
    id: string;
    startupId: string;
    agentType: AgentType;
    status: AgentRunStatus;
    input?: string;
    result?: string;
    error?: string;
    // Timing
    createdAt: Timestamp;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    // Audit
    tokensUsed?: number;
    modelUsed?: string;
}

export type AgentRunStatus = "queued" | "running" | "success" | "failure" | "cancelled";

export interface AgentState {
    agentType: AgentType;
    isActive: boolean;
    currentTask?: string;
    lastActivityAt?: Timestamp;
    queuedTasks: number;
}

// ============================================
// SECTION 7: MEMORY & CONTEXT TYPES
// ============================================

export interface StartupMemory {
    id: string;
    startupId: string;
    type: MemoryType;
    source: "user" | "agent";
    content: string;
    // Semantic indexing
    embedding?: number[];  // Vector embedding for semantic search
    concepts?: string[];   // Extracted concepts
    // Relationships
    linkedMemories?: string[];
    linkedTasks?: string[];
    linkedDecisions?: string[];
    // Timestamps
    timestamp: Timestamp;
}

export type MemoryType =
    | "idea"
    | "decision"
    | "pivot"
    | "agent-output"
    | "user-input"
    | "meeting-note"
    | "research"
    | "assumption"
    | "validation-result";

export interface ContextBlock {
    id: string;
    type: "memory" | "document" | "task" | "competitor" | "market";
    title: string;
    summary: string;
    sourceId: string;
    addedAt: Timestamp;
    isActive: boolean;
}

export interface AIContext {
    startupId: string;
    activeBlocks: ContextBlock[];
    maxTokenBudget: number;
    currentTokenUsage: number;
    lastUpdated: Timestamp;
}

// ============================================
// SECTION 8: PIVOT & REVIEW TYPES
// ============================================

export interface PivotSimulation {
    id: string;
    startupId: string;
    proposedChange: string;
    createdAt: Timestamp;
    status: "pending" | "analyzed" | "accepted" | "rejected";
    impactReport?: PivotImpactReport;
}

export interface PivotImpactReport {
    summary: string;
    roadmapChanges: {
        affected: string[];  // Phase/Goal IDs
        description: string;
    };
    teamImplications: {
        rolesNeeded: string[];
        rolesRedundant: string[];
        trainingRequired: string[];
    };
    financialDeltas: {
        runwayImpact: string;
        costChanges: string;
        revenueProjectionChange: string;
    };
    risks: string[];
    opportunities: string[];
    recommendedAction: "proceed" | "reconsider" | "abort";
    confidence: number;
}

export interface WeeklyReview {
    id: string;
    startupId: string;
    weekOf: Timestamp;
    status: "pending" | "completed" | "skipped";
    // Goals vs Actuals
    goalsSet: string[];
    goalsCompleted: string[];
    tasksCompleted: number;
    // Market context
    marketThreats: string[];
    marketOpportunities: string[];
    // AI insights
    aiSummary?: string;
    aiRecommendations?: string[];
    completedAt?: Timestamp;
}

// ============================================
// SECTION 9: PITCH DECK TYPES
// ============================================

export interface PitchDeck {
    id: string;
    startupId: string;
    title: string;
    slides: PitchSlide[];
    template: PitchTemplate;
    generatedFromCanvas: boolean;
    lastExported?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface PitchSlide {
    id: string;
    position: number;
    type: SlideType;
    title: string;
    content: SlideContent;
    notes?: string;
    linkedCanvasBlocks?: string[];
}

export type SlideType =
    | "title"
    | "problem"
    | "solution"
    | "market"
    | "product"
    | "business_model"
    | "traction"
    | "team"
    | "competition"
    | "financials"
    | "ask"
    | "custom";

export interface SlideContent {
    headline?: string;
    body?: string;
    bullets?: string[];
    metrics?: { label: string; value: string }[];
    image?: string;
    chart?: ChartData;
}

export interface ChartData {
    type: "bar" | "line" | "pie" | "area";
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        color?: string;
    }[];
}

export type PitchTemplate =
    | "sequoia"
    | "yc"
    | "india_vc"
    | "corporate"
    | "minimal";

// ============================================
// SECTION 10: REGULATORY & COMPLIANCE (INDIA)
// ============================================

export interface RegulatoryCheck {
    id: string;
    startupId: string;
    query: string;
    response: string;
    sources: RegulatorySource[];
    createdAt: Timestamp;
    relevantLaws: string[];
    complianceRisks: ComplianceRisk[];
}

export interface RegulatorySource {
    title: string;
    url?: string;
    type: "law" | "regulation" | "guideline" | "case_law";
    jurisdiction: "central" | "state" | "sector";
}

export interface ComplianceRisk {
    area: string;
    severity: "critical" | "high" | "medium" | "low";
    description: string;
    remediation: string;
}

// ============================================
// SECTION 11: CONNECTION & CHAT TYPES
// ============================================

export interface Connection {
    id: string;
    users: [string, string];  // Two founder UIDs
    status: "active" | "blocked";
    createdAt: Timestamp;
    metadata?: {
        introducedBy?: string;
        context?: string;
    };
}

export interface ConnectionRequest {
    id: string;
    fromId: string;
    toId: string;
    status: "pending" | "accepted" | "rejected";
    message?: string;
    createdAt: Timestamp;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    type: "direct" | "group";
    name?: string;
    lastMessage?: ChatMessage;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: "text" | "image" | "file" | "ai_insight";
    metadata?: Record<string, any>;
    createdAt: Timestamp;
    readBy: string[];
}

// ============================================
// SECTION 12: AI INTERACTION PATTERNS
// ============================================

export interface AIInteraction {
    id: string;
    startupId: string;
    userId: string;
    pattern: AIInteractionPattern;
    input: string;
    output: string;
    accepted: boolean;
    createdAt: Timestamp;
}

export type AIInteractionPattern =
    | "cursor"      // Inline generation triggered by selection/hotkey
    | "sidekick"    // Persistent chat panel
    | "ghost"       // Tab-acceptable greyed suggestions
    | "command";    // Slash commands

export interface StructuredAIOutput {
    type: StructuredOutputType;
    data: any;
    renderHint: string;
}

export type StructuredOutputType =
    | "checklist"
    | "table"
    | "chart"
    | "pros_cons"
    | "timeline"
    | "comparison"
    | "markdown";
