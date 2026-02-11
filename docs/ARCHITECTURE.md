 # FounderFlow System Architecture

**Document Version**: 2.0  
**Last Updated**: February 11, 2026  
**Status**: Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Architecture](#5-database-architecture)
6. [AI & Agent System](#6-ai--agent-system)
7. [RAG Memory System](#7-rag-memory-system)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Data Flow](#9-data-flow)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Executive Summary

FounderFlow is an **AI-powered Startup Operating System** built on Next.js 16 with a multi-database architecture combining Firebase Firestore for operational data and PostgreSQL+pgvector for semantic memory.

### **Key Architectural Decisions**

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Server-side rendering, React Server Components, built-in API routes |
| **Firebase Firestore** | Real-time updates, flexible schema, managed infrastructure |
| **PostgreSQL + pgvector** | Vector similarity search for RAG, ACID compliance |
| **Google Gemini 2.0** | State-of-the-art LLM with competitive pricing |
| **Multi-Agent System** | Specialized agents for different tasks (validation, planning, execution) |
| **Hybrid Search** | Combines vector similarity with keyword matching for better retrieval |

---

## 2. System Overview

### **2.1 High-Level Architecture**

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 (App Router + React 19)                 │  │
│  │                                                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │   Founder    │  │   Investor   │  │   Admin Portal       │  │  │
│  │  │   Dashboard  │  │   Portal     │  │   (Internal Only)    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ /api/rag/*   │ │/api/validate │ │/api/roadmap  │ │/api/tasks   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
│         │                 │                │               │         │
└─────────┼─────────────────┼────────────────┼───────────────┼─────────┘
          │                 │                │               │
          ▼                 ▼                ▼               ▼
┌──────────────────┐ ┌────────────────┐ ┌───────────────────────────┐
│ Firebase         │ │ PostgreSQL     │ │    Google Gemini AI       │
│ • Firestore      │ │ + pgvector     │ │ • Gemini 2.0 Flash        │
│ • Auth           │ │ (RAG Memory)   │ │ • Embeddings (768-dim)    │
│ • Storage        │ │ • HNSW Index   │ │ • Multi-model fallback    │
└──────────────────┘ └────────────────┘ └───────────────────────────┘
```

### **2.2 Technology Stack**

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16.1.3 | SSR, RSC, App Router |
| | React | 19.2.3 | UI library |
| | TailwindCSS | 4.0 | Styling |
| | Framer Motion | Latest | Animations |
| **Backend** | Next.js API Routes | 16.1.3 | Serverless functions |
| | Firebase Functions | Latest | Background jobs |
| **Databases** | Firebase Firestore | Latest | Operational data |
| | PostgreSQL | 15+ | Vector storage |
| | pgvector | 0.5+ | Vector similarity |
| **AI/ML** | Google Gemini | 2.0 | LLM reasoning |
| | Gemini Embeddings | text-embedding-004 | 768-dim vectors |
| **Auth** | Firebase Auth | Latest | User authentication |
| **Deployment** | Vercel | Latest | Frontend hosting |
| | Supabase/Neon | Latest | PostgreSQL hosting |

---

## 3. Frontend Architecture

### **3.1 Directory Structure**

```
src/app/
├── (auth)/                    # Auth-protected routes
│   ├── founder/               # Founder-specific pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── tasks/             # Task management
│   │   ├── roadmap/           # Strategic planning
│   │   ├── canvas/            # Strategy canvas
│   │   ├── pitch-deck/        # Pitch deck generator
│   │   ├── weekly-review/     # Weekly review & pivots
│   │   ├── market-intel/      # Market intelligence
│   │   ├── timeline/          # Startup memory timeline
│   │   ├── chats/             # Messaging
│   │   └── profile/           # Profile management
│   ├── investor/              # Investor portal (future)
│   └── admin/                 # Admin portal
├── api/                       # API routes
│   ├── validate-idea/         # Idea validation agent
│   ├── generate-roadmap/      # Roadmap generation
│   ├── generate-tasks/        # Task generation
│   ├── execute-task/          # Task execution
│   ├── generate-pitch-deck/   # Pitch deck creation
│   ├── simulate-pivot/        # Pivot simulation
│   └── rag/                   # RAG system endpoints
├── login/                     # Authentication pages
├── onboarding/                # Onboarding flow
└── page.tsx                   # Landing page
```

### **3.2 State Management**

| State Type | Solution | Scope |
|------------|----------|-------|
| **Authentication** | `AuthContext` | Global |
| **Startup Data** | `useStartup` hook | Per-startup |
| **UI State** | Local state + URL params | Component |
| **Real-time Updates** | Firestore listeners | Per-collection |

### **3.3 Component Architecture**

```
components/
├── ui/                        # Atomic design components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── Loader.tsx
├── profile/                   # Profile components
│   └── ProfileEditor.tsx
├── messaging/                 # Chat components
│   └── MessagingHub.tsx
├── weekly-review/             # Review components
│   └── AnalyticsInsights.tsx
└── Sidebar.tsx                # Main navigation
```

---

## 4. Backend Architecture

### **4.1 API Route Structure**

All API routes follow this pattern:

```typescript
// src/app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const user = auth.currentUser;
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse and validate input
        const body = await request.json();
        // ... validation logic

        // 3. Execute business logic
        const result = await someService(body);

        // 4. Return response
        return NextResponse.json(result);
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
```

### **4.2 Service Layer**

| Service | File | Purpose |
|---------|------|---------|
| **Startup Service** | `lib/startup-service.ts` | Firestore CRUD for startups |
| **Profile Service** | `lib/profile-service.ts` | User profile management |
| **Messaging Service** | `lib/messaging-service.ts` | Chat functionality |
| **Admin Service** | `lib/admin-service.ts` | Admin operations |
| **Connection Service** | `lib/connection-service.ts` | Founder networking |
| **Gemini Service** | `lib/gemini.ts` | AI API client |
| **RAG Service** | `lib/rag/index.ts` | Memory retrieval |

---

## 5. Database Architecture

### **5.1 Firestore Schema**

```
firestore/
├── users/                     # User profiles
│   └── {uid}
│       ├── uid: string
│       ├── email: string
│       ├── role: "founder" | "investor" | "admin"
│       ├── activeStartupId: string
│       ├── isOnboardingCompleted: boolean
│       └── profile: {...}
├── startups/                  # Core startup data
│   └── {startupId}
│       ├── name: string
│       ├── industry: string
│       ├── stage: string
│       ├── ownerId: string
│       └── ...
├── startup_members/           # Team membership
│   └── {membershipId}
│       ├── startupId: string
│       ├── userId: string
│       └── role: string
├── tasks/                     # Action items
│   └── {taskId}
│       ├── startupId: string
│       ├── title: string
│       ├── status: "pending" | "done"
│       ├── aiResponse: string
│       └── ...
├── startupMemory/             # Event log (legacy)
│   └── {memoryId}
│       ├── startupId: string
│       ├── type: string
│       ├── content: any
│       └── timestamp: Timestamp
├── roadmaps/                  # Strategic roadmaps
├── canvases/                  # Strategy documents
├── pitchDecks/                # Pitch presentations
├── agentRuns/                 # AI audit logs
├── connections/               # Founder network
└── chat_rooms/                # Messaging
    └── {chatId}/messages/     # Message subcollection
```

### **5.2 PostgreSQL Schema (RAG)**

```sql
-- Memory chunks with vector embeddings
CREATE TABLE project_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding vector(768),
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_content_per_project UNIQUE (project_id, content_hash)
);

-- HNSW index for fast vector similarity search
CREATE INDEX idx_memory_embedding 
    ON project_memory USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Composite index for project-scoped queries
CREATE INDEX idx_memory_project_active 
    ON project_memory (project_id, created_at DESC);
```

### **5.3 Data Relationships**

```
User (1) ──────────── (N) Startup Memberships
                            │
                            │
Startup (1) ────────── (N) Tasks
    │
    ├────────────────── (N) Memories
    ├────────────────── (1) Roadmap
    ├────────────────── (1) Canvas
    └────────────────── (1) Pitch Deck
```

---

## 6. AI & Agent System

### **6.1 Agent Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPERVISOR AGENT                          │
│  • Orchestrates all sub-agents                              │
│  • Enforces security boundaries                             │
│  • Manages agent lifecycle                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ RESEARCHER   │ │STRATEGIST│ │LOCALIZER │ │  EXECUTOR    │
│ • Hybrid     │ │• Analyzes│ │• India   │ │• Converts    │
│   search     │ │  gaps    │ │  context │ │  to tasks    │
│ • Re-ranking │ │• Detects │ │• Validates│ │• Generates   │
│              │ │  conflicts│ │  advice  │ │  actions     │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### **6.2 Agent Types**

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Validator** | Idea validation | Startup idea | Viability score, risks, suggestions |
| **Planner** | Roadmap generation | Startup context | Phase-based roadmap |
| **Executor** | Task generation | Strategy/idea | Actionable tasks |
| **Researcher** | RAG retrieval | Query + context | Ranked memory chunks |
| **Strategist** | Gap analysis | Retrieved context | Confidence score, gaps |
| **Localizer** | India adaptation | Generic advice | Localized recommendations |

### **6.3 Prompt Engineering**

All prompts follow this structure:

```typescript
const prompt = `
You are a ${agentRole} for an early-stage startup.

CONTEXT:
${startupContext}

RETRIEVED MEMORY:
${ragContext}

TASK:
${specificTask}

OUTPUT FORMAT:
${jsonSchema}

CONSTRAINTS:
- Focus on India market
- Be specific and actionable
- Provide confidence scores
`;
```

---

## 7. RAG Memory System

### **7.1 RAG Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                        │
│                                                              │
│  Document → Sanitize → Chunk → Classify → Embed → Store    │
│              (800 chars)  (Gemini)  (768-dim)  (pgvector)   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RETRIEVAL PIPELINE                        │
│                                                              │
│  Query → Embed → Hybrid Search → Re-rank → Compress → LLM  │
│          (768-dim) (Vector+FTS)  (Multi-factor) (Gemini)    │
└─────────────────────────────────────────────────────────────┘
```

### **7.2 Chunking Strategy**

- **Method**: Recursive character splitting
- **Chunk Size**: 800 characters (~200 tokens)
- **Overlap**: 80 characters (~20 tokens)
- **Rationale**: Optimized to reduce multi-topic contamination while preserving context

### **7.3 Embedding Model**

- **Provider**: Google Generative AI
- **Model**: `text-embedding-004`
- **Dimensions**: 768
- **Task Types**:
  - `RETRIEVAL_DOCUMENT` for storage
  - `RETRIEVAL_QUERY` for search

### **7.4 Hybrid Search Formula**

```
FINAL_SCORE = 
  [
    (VECTOR_SIMILARITY × 0.7) + 
    (KEYWORD_SCORE × 0.3)
  ] 
  × FOUNDER_WEIGHT 
  × exp(-days_old / 90)

CONFIDENCE = (top_score × 0.7) + (avg_score × 0.3)
```

### **7.5 Memory Types**

- `decision` — Strategic decisions
- `metric` — Performance data
- `investor_feedback` — Investor interactions
- `task` — Action items
- `research` — Market research
- `note` — General notes

Auto-classified during ingestion via Gemini.

### **7.6 Safety Features**

- **Prompt Injection Sanitization**: Strips malicious patterns
- **Similarity Thresholding**: Minimum 0.65 (configurable)
- **Confidence Gating**: Rejects low-confidence retrievals (<0.5)
- **Hard Isolation**: Explicit `WHERE project_id = ?` filter
- **Deduplication**: SHA-256 hash prevents duplicate embeddings

---

## 8. Authentication & Authorization

### **8.1 Authentication Flow**

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│   Firebase Auth                      │
│   • Google OAuth                     │
│   • Email/Password                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│   AuthContext (React)                │
│   • Subscribes to auth state         │
│   • Fetches user profile             │
│   • Provides global auth state       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│   Protected Routes                   │
│   • Redirect if not authenticated    │
│   • Load user-specific data          │
└──────────────────────────────────────┘
```

### **8.2 Authorization Model**

| Resource | Owner | Team Member | Public |
|----------|-------|-------------|--------|
| **Startup** | Read/Write | Read/Write* | None |
| **Tasks** | Read/Write | Read/Write | None |
| **Memory** | Read/Write | Read | None |
| **Profile** | Read/Write | None | Read (limited) |

*Role-based permissions within team

### **8.3 Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Startups: owner and team members only
    match /startups/{startupId} {
      allow read: if isTeamMember(startupId);
      allow write: if isOwnerOrCofounder(startupId);
    }
    
    // Tasks: team members can read/write
    match /tasks/{taskId} {
      allow read, write: if isTeamMember(resource.data.startupId);
    }
  }
}
```

### **8.4 PostgreSQL Row-Level Security**

```sql
-- Enable RLS
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own project data
CREATE POLICY project_isolation ON project_memory
    FOR ALL
    USING (project_id = current_setting('app.current_project_id'));
```

---

## 9. Data Flow

### **9.1 Idea Validation Flow**

```
User Input (Idea)
    │
    ▼
POST /api/validate-idea
    │
    ├─→ Authenticate user
    ├─→ Validate input
    ├─→ Fetch startup context
    ├─→ Retrieve RAG context
    │       │
    │       ▼
    │   Hybrid search (vector + keyword)
    │   Re-rank by relevance
    │   Compress top chunks
    │
    ├─→ Call Gemini with context
    │       │
    │       ▼
    │   Generate validation report
    │   Parse JSON response
    │
    ├─→ Save to startupMemory
    ├─→ Update startup stage
    │
    ▼
Return validation result to UI
```

### **9.2 Task Execution Flow**

```
User clicks "Run Sprint"
    │
    ▼
For each pending task:
    │
    ▼
POST /api/execute-task
    │
    ├─→ Fetch task details
    ├─→ Retrieve RAG context
    ├─→ Call Gemini with instruction
    ├─→ Save AI response to task
    ├─→ Mark task as done
    │
    ▼
Update UI with results
```

---

## 10. Deployment Architecture

### **10.1 Production Stack**

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js Application (SSR + API Routes)         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│   Firebase   │ │Supabase/ │ │  Google  │ │   Vercel     │
│   (Auth +    │ │  Neon    │ │  Gemini  │ │   Edge       │
│  Firestore)  │ │(Postgres)│ │   API    │ │  Functions   │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### **10.2 Environment Separation**

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Production** | `main` | `founderflow.com` | Live users |
| **Staging** | `staging` | `staging.founderflow.com` | Pre-release testing |
| **Preview** | PR branches | Auto-generated | PR review |
| **Development** | Local | `localhost:3000` | Development |

### **10.3 Scaling Strategy**

- **Horizontal**: Vercel auto-scales based on traffic
- **Database**: Firebase auto-scales, PostgreSQL connection pooling
- **AI**: Rate limiting + model fallback chain
- **Caching**: Edge caching for static assets

---

## Appendix: Key Design Patterns

### **A. Service-Oriented Architecture**

All business logic is encapsulated in service modules (`lib/*-service.ts`), keeping API routes thin and focused on HTTP handling.

### **B. Multi-Agent Orchestration**

Agents are composed rather than monolithic, allowing for specialized behavior and easier testing.

### **C. Hybrid Database Strategy**

Firestore for operational data (real-time, flexible schema) + PostgreSQL for analytical data (vector search, ACID).

### **D. Progressive Enhancement**

Core functionality works without JavaScript, enhanced with client-side interactivity.

---

**Document Maintained By**: Engineering Team  
**Review Frequency**: Quarterly or after major architectural changes
