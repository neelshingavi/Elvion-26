# Project Overview and Architecture

## Executive Summary

FounderFlow is a startup ecosystem platform that connects founders and investors through AI-powered workflows. The platform enables founders to validate ideas, generate strategic roadmaps, execute tasks with AI assistance, and negotiate investment deals with investors.

**Platform Type:** B2B SaaS / Marketplace Hybrid  
**Primary Technology Stack:** Next.js 16 (App Router), Firebase (Auth, Firestore, Storage), Google Gemini AI  
**Target Market:** India-focused startup ecosystem  
**Document Version:** 2.0 (January 2026)

> [!IMPORTANT]
> **As of January 2026:** The platform has been streamlined to support only **Founder** and **Investor** roles. Customer and Job Seeker sections have been removed.

---

## Table of Contents

1. [Product Vision](#product-vision)
2. [High-Level System Architecture](#high-level-system-architecture)
3. [User Roles & Flows](#user-roles--flows)
4. [Core Modules](#core-modules)
5. [Data Flow](#data-flow)
6. [Design Principles](#design-principles)
7. [Known Limitations](#known-limitations)

---

## Product Vision

### Problem Statement

Early-stage founders in India face three critical challenges:
1. **Validation Gap:** No structured way to stress-test business ideas before committing resources
2. **Execution Complexity:** Lack of strategic guidance to prioritize actions during chaotic startup phases
3. **Capital Access:** Difficulty connecting with investors and managing investment negotiations professionally

### Target Users

| Role | Description | Primary Goals |
|------|-------------|---------------|
| **Founders** | Early-stage startup founders | Validate ideas, plan execution, raise capital |
| **Investors** | Angels, VCs, Micro-VCs | Discover startups, manage portfolios, track performance |
| **Administrators** | Platform operators | Manage users, startups, system health |

### Core Value Proposition

FounderFlow provides an **AI-powered operating system for early-stage startups** that:
- Reduces idea-to-validation time from weeks to hours
- Generates actionable roadmaps based on validated ideas
- Automates common founder tasks with specialized AI agents
- Facilitates structured deal negotiation between founders and investors


---

## High-Level System Architecture

### Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (App Router + Turbopack)             │   │
│  │  ├── React 18 (Client Components)                            │   │
│  │  ├── Tailwind CSS + Framer Motion                            │   │
│  │  └── React Markdown (Content Rendering)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ validate-idea│ │generate-road-│ │generate-tasks│ │ execute-task ││
│  │    /api/     │ │   map /api/  │ │    /api/     │ │    /api/     ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│   Firebase Firestore  │ │  Firebase Auth   │ │   Google Gemini AI  │
│   (Primary Database)  │ │ (Authentication) │ │ (LLM with fallback) │
└──────────────────────┘ └──────────────────┘ └─────────────────────┘
```

### Frontend Architecture

**Framework:** Next.js 16 with App Router (using Turbopack for development)

**Directory Structure:**
```
src/
├── app/                    # Route handlers (App Router pattern)
│   ├── admin/              # Admin portal pages
│   ├── api/                # Server-side API routes
│   ├── customer/           # Customer portal pages
│   ├── founder/            # Founder dashboard pages
│   ├── investor/           # Investor portal pages
│   ├── job-seeker/         # Job seeker portal pages
│   ├── login/              # Authentication page
│   ├── onboarding/         # User onboarding flow
│   └── projects/           # Project management
├── components/             # Shared React components
│   ├── deals/              # Deal negotiation components
│   ├── messaging/          # Chat/messaging components
│   └── shared/             # Cross-role components
├── context/                # React Context providers
│   └── AuthContext.tsx     # Firebase Auth state management
├── hooks/                  # Custom React hooks
│   └── useStartup.ts       # Primary data hook for startup context
└── lib/                    # Service layer and utilities
    ├── types/              # TypeScript type definitions
    └── *.ts                # Service modules
```

**State Management:**
- **Client State:** React useState, useEffect hooks
- **Auth State:** Firebase Auth via AuthContext
- **Data Fetching:** Real-time Firestore `onSnapshot` listeners via `useStartup` hook
- **Animation:** Framer Motion for page transitions and micro-interactions

### Backend Architecture

**Server Framework:** Next.js API Routes (serverless functions)

**API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/validate-idea` | POST | AI-powered idea validation |
| `/api/generate-roadmap` | POST | Strategic roadmap generation |
| `/api/generate-tasks` | POST | Task decomposition from roadmap |
| `/api/execute-task` | POST | Execute founder tasks with AI |
| `/api/admin/delete-user` | DELETE | Admin user deletion |

**Service Layer:**
The `src/lib/` directory contains domain-specific service modules:

| Service | File | Responsibility |
|---------|------|----------------|
| Startup | `startup-service.ts` | Core startup/project CRUD, tasks, memory |
| Investor | `investor-service.ts` | Portfolio, access control, metrics |
| Deal | `deal-service.ts` | Deal negotiation state machine |
| Messaging | `messaging-service.ts` | Real-time chat between users |
| Connection | `connection-service.ts` | User networking/connections |
| Customer | `customer-service.ts` | Customer profiles, feedback |
| Job Seeker | `job-seeker-service.ts` | Talent profiles, matching |
| Admin | `admin-service.ts` | Bulk operations, cleanup |

### Database Design Philosophy

**Database:** Firebase Firestore (NoSQL document database)

**Core Collections:**

```
firestore/
├── users/                  # User profiles (all roles)
├── startups/               # Startup/project documents
├── startup_members/        # User-to-startup relationships
├── startupMemory/          # Timeline/event log per startup
├── tasks/                  # AI-generated and manual tasks
├── agentRuns/              # AI agent execution logs
├── deals/                  # Investment negotiations
├── dealflow/               # Legacy deal pipeline (kanban)
├── connections/            # User networking relationships
├── connection_requests/    # Pending connection invites
├── chat_rooms/             # Messaging room metadata
├── chats/{chatId}/messages # Chat messages (subcollection)
├── notifications/          # In-app notifications
├── investor_portfolio/     # Investor-to-startup investments
├── project_investor_access/# Investor access permissions
├── project_metrics/        # Startup performance metrics
├── project_risks/          # AI-generated risk analyses
├── decision_logs/          # Founder decision history
├── investor_updates/       # Startup updates for investors
├── investor_notes/         # Private investor notes
├── customers/              # Customer profiles
├── customerEvents/         # Customer activity tracking
├── feedback/               # Customer feedback submissions
├── jobSeekers/             # Job seeker profiles
└── applications/           # Job applications
```

**Design Patterns:**
- **Document-centric:** Each entity (startup, user, deal) is a self-contained document
- **Denormalization:** Key fields duplicated for query efficiency (e.g., `ownerId` in startups)
- **Subcollections:** Used for chat messages to enable efficient pagination
- **Composite IDs:** Connection documents use sorted user ID pairs as document ID

### AI / Multi-Agent Architecture

**LLM Provider:** Google Gemini with multi-model fallback strategy

**Model Cascade:**
```
1. gemini-2.0-flash-lite-preview-02-05 (fastest)
2. gemini-2.0-flash-exp (experimental)
3. gemini-2.0-flash (stable)
4. gemini-flash-latest (fallback)
```

**Agent Types:**

| Agent | API Route | Function |
|-------|-----------|----------|
| **Idea Validation Agent** | `/api/validate-idea` | Analyzes business ideas, generates viability scores, market research |
| **Strategic Planning Agent** | `/api/generate-roadmap` | Creates phased execution roadmap with milestones |
| **Execution Agent** | `/api/generate-tasks` | Decomposes roadmap into atomic tasks |
| **Task Execution Agent** | `/api/execute-task` | Performs arbitrary tasks based on founder instructions |

**AI Response Handling:**
- JSON parsing with regex extraction for structured outputs
- Retry logic with exponential backoff
- Model fallback on quota/not-found errors
- Results persisted to `startupMemory` collection

### Authentication & Authorization Flow

**Authentication:** Firebase Authentication (Google OAuth + Email/Password)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                           │
│                                                                   │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────────────┐    │
│  │  Login  │────▶│ Firebase    │────▶│ AuthContext         │    │
│  │  Page   │     │ Auth SDK    │     │ (user state)        │    │
│  └─────────┘     └─────────────┘     └─────────────────────┘    │
│                                               │                   │
│                                               ▼                   │
│                                      ┌─────────────────────┐     │
│                                      │ users/{uid} doc     │     │
│                                      │ - role              │     │
│                                      │ - activeStartupId   │     │
│                                      └─────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

**Authorization Model:**

| Level | Implementation |
|-------|----------------|
| Route Protection | Layout components check `useAuth()` |
| Role-Based Access | `userData.role` determines portal access |
| Project-Level Permissions | `startup_members` collection defines roles |
| Investor Access | `project_investor_access` grants scoped access |

**Permission Matrix (via `useStartup` hook):**

| Role | canEdit | canManageTasks | canViewFinancials |
|------|---------|----------------|-------------------|
| owner | ✓ | ✓ | ✓ |
| cofounder | ✓ | ✓ | ✓ |
| team | ✗ | ✓ | ✗ |
| mentor | ✗ | ✗ | ✗ |
| investor | ✗ | ✗ | ✓ |

---

## User Roles & Flows

### Founder Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FOUNDER JOURNEY                             │
│                                                                      │
│  ┌────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐         │
│  │ Create │───▶│ Validate │───▶│Generate │───▶│ Execute  │         │
│  │ Startup│    │   Idea   │    │ Roadmap │    │  Tasks   │         │
│  └────────┘    └──────────┘    └─────────┘    └──────────┘         │
│       │                                              │               │
│       │              Stage: idea_submitted           │               │
│       │              Stage: idea_validated           │               │
│       │              Stage: roadmap_created          │               │
│       │              Stage: execution_active ────────┘               │
│       │                                                              │
│       ▼                                                              │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              FOUNDER DASHBOARD                              │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │     │
│  │  │Timeline │ │ Tasks   │ │ Deals   │ │ Investor Match  │  │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Pages:**
- `/founder/dashboard` - Command center with stats, agents, tasks
- `/founder/idea-validation` - AI idea validation wizard
- `/founder/planning` - Roadmap generation and viewing
- `/founder/tasks` - Task board with AI execution
- `/founder/timeline` - Startup memory/event log
- `/founder/matching` - Investor discovery
- `/founder/deals` - Deal negotiation management

### Investor Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INVESTOR JOURNEY                            │
│                                                                      │
│  ┌────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐         │
│  │Discover│───▶│  Review  │───▶│ Deal    │───▶│Portfolio │         │
│  │Startups│    │ Project  │    │Negotiate│    │ Monitor  │         │
│  └────────┘    └──────────┘    └─────────┘    └──────────┘         │
│       │                              │                               │
│       │                              │                               │
│       ▼                              ▼                               │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              INVESTOR DASHBOARD                             │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │     │
│  │  │Portfolio│ │Dealflow │ │ Deals   │ │ Startup Deep    │  │     │
│  │  │Overview │ │Pipeline │ │Inbox    │ │ Dive            │  │     │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘  │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Pages:**
- `/investor/dashboard` - Portfolio intelligence and health scores
- `/investor/dealflow` - Kanban pipeline for deal tracking
- `/investor/deals` - Active deal negotiations
- `/investor/startups` - Startup discovery
- `/investor/project/[projectId]` - Deep dive into specific startup

### Customer Flow

**Purpose:** Enable beta testing and feedback collection for startups

**Key Pages:**
- `/customer/dashboard` - Activity overview
- `/customer/products` - Discover testable products
- `/customer/reviews` - Submitted feedback
- `/customer/feedback/[startupId]` - Submit feedback for specific startup

### Job Seeker Flow

**Purpose:** Match talent with startup opportunities

**Key Pages:**
- `/job-seeker/dashboard` - Match overview
- `/job-seeker/onboarding` - Profile setup
- `/job-seeker/matches` - AI-matched startup opportunities
- `/job-seeker/profile` - Skills and preferences

---

## Core Modules

### 1. Project/Startup Management

**Primary Service:** `startup-service.ts`

**Core Entity: Startup**
```typescript
interface Startup {
    startupId: string;
    ownerId: string;
    name: string;
    industry: string;
    stage: "idea_submitted" | "idea_validated" | "roadmap_created" | 
           "execution_active" | "mvp" | "launch" | "growth";
    projectStatus: "active" | "archived";
    vision?: string;
    problemStatement?: string;
    idea: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

**Stage Progression:**
1. `idea_submitted` → Create startup
2. `idea_validated` → Pass AI validation (score > 40)
3. `roadmap_created` → Generate strategic roadmap
4. `execution_active` → Tasks generated and in progress
5. `mvp` / `launch` / `growth` → Manual progression

### 2. AI Task System

**Entities:**
- **Task:** Individual work item with AI-generated response
- **AgentRun:** Execution log for AI agents

**Task Lifecycle:**
```
pending ─────▶ done (after AI execution)
```

**Sprint Execution:** Tasks can be run in parallel batches via the "Run Sprint" feature.

### 3. Deal Negotiation System

**Primary Service:** `deal-service.ts`

**State Machine:**
```
PROPOSED ─┬─▶ COUNTERED ─┬─▶ NEGOTIATING ─┬─▶ ACCEPTED ──▶ LOCKED
          │              │                │
          ├─▶ DECLINED   ├─▶ DECLINED     ├─▶ DECLINED
          │              │                │
          └─▶ EXPIRED    └─▶ EXPIRED      └─▶ EXPIRED
```

**Deal Terms:**
```typescript
interface DealTerms {
    investmentAmount: number;      // USD
    equityPercentage: number;      // 0-100
    impliedValuation: number;      // Auto-calculated
    postMoneyValuation: number;    // Auto-calculated
    instrumentType: "EQUITY" | "SAFE" | "CONVERTIBLE_NOTE";
    conditions?: string;
}
```

**Bidirectional Initiation:** Either founder (ask) or investor (offer) can initiate.

### 4. Messaging System

**Primary Service:** `messaging-service.ts`

**Design:**
- Deterministic chat IDs: `[uid1, uid2].sort().join("_")`
- Messages stored in subcollection: `chats/{chatId}/messages`
- Real-time via Firestore `onSnapshot`

### 5. Connection/Networking System

**Primary Service:** `connection-service.ts`

**Flow:**
```
User A ──▶ Send Request ──▶ User B
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Accept              Reject
                    │
                    ▼
            Create Connection
            (bidirectional)
```

---

## Data Flow

### End-to-End Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      React Components                           │  │
│  │                           │                                     │  │
│  │                           ▼                                     │  │
│  │                    ┌─────────────┐                              │  │
│  │                    │ useStartup  │ (Real-time listeners)        │  │
│  │                    └─────────────┘                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │  Firestore  │  │  API Route  │  │  Firebase   │
           │  (Direct)   │  │  (Server)   │  │  Auth       │
           └─────────────┘  └─────────────┘  └─────────────┘
                    │               │
                    │               ▼
                    │       ┌─────────────┐
                    │       │  Gemini AI  │
                    │       └─────────────┘
                    │               │
                    └───────┬───────┘
                            ▼
                    ┌─────────────────┐
                    │   Firestore     │
                    │  (Persistence)  │
                    └─────────────────┘
```

### Project-Scoped Data Isolation

All startup-related data is queried with `where("startupId", "==", activeStartupId)`:
- Tasks
- Memory entries
- Agent runs
- Team members

**Active Startup Pattern:**
1. User has `activeStartupId` in their user document
2. `useStartup` hook reads this and sets up listeners
3. All data shown is scoped to active startup
4. Switching startups changes `activeStartupId` and triggers re-subscription

---

## Design Principles

### 1. Real-Time First

All primary data flows use Firestore `onSnapshot` for instant updates without page refresh.

**Trade-off:** Higher Firestore read costs vs. better UX.

### 2. AI as First-Class Citizen

AI agents are not afterthoughts but core features. The platform progression (idea → validated → roadmap → tasks) is gated by AI outputs.

**Trade-off:** Dependence on Gemini API availability.

### 3. Role-Based Portal Separation

Each user role has a completely separate layout and page structure rather than shared views with conditional rendering.

**Trade-off:** Some code duplication vs. clearer boundaries and easier role-specific iteration.

### 4. Document-Centric Data Model

Firestore's NoSQL nature is embraced rather than forced into relational patterns. Denormalization is preferred over joins.

**Trade-off:** Data consistency requires careful service layer discipline.

### 5. Progressive Complexity

Features are layered:
- **Layer 1:** Basic CRUD (startups, tasks)
- **Layer 2:** AI integration (validation, roadmap)
- **Layer 3:** Multi-party (deals, messaging)
- **Layer 4:** Analytics (portfolio health, metrics)

---

## Known Limitations

### Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No SSR for authenticated pages | SEO impact on dashboard pages | Login/onboarding pages can be SSR |
| Firestore query constraints | No full-text search, limited compound queries | Client-side filtering, separate search index needed |
| Single Firestore database | No data isolation between regions | Acceptable for India-focused MVP |
| No offline support | App requires internet | Progressive Web App not implemented |
| No rate limiting on AI calls | Potential API quota exhaustion | Model fallback chain helps |

### Non-Goals (Explicitly Out of Scope)

1. **Multi-tenancy:** Platform is single-tenant (one ecosystem, not white-label)
2. **Legal/Compliance:** Deal system tracks negotiations but is not legally binding
3. **Payment Processing:** No financial transactions within platform
4. **Document Storage:** No cap table or contract management
5. **Mobile Native Apps:** Web-only for now (responsive but not native)
6. **Real-time Collaboration:** Documents are not co-edited (single-author model)

### Scalability Constraints

- **Single Region:** Firebase in default location
- **No CDN:** Static assets served via Next.js
- **No Background Jobs:** All AI processing is synchronous
- **No Queue System:** Parallel task execution limited by client connection

---

*This document serves as the single source of truth for understanding FounderFlow's architecture. It should be updated as the system evolves.*
