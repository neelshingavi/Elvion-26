# FounderFlow Architecture & Overview

## 1. Executive Summary

FounderFlow is an **AI-powered Startup Operating System** that connects founders and investors through intelligent workflows. The platform enables founders to:
- **Validate ideas** instantly with AI market analysis
- **Generate strategic roadmaps** based on stage and industry
- **Execute tasks** with specialized AI agents (Recall, Plan, Execute)
- **Negotiate investment deals** with structured workflows

**Platform Type:** B2B SaaS / Marketplace Hybrid  
**Primary Tech Stack:** Next.js 16 (App Router), Firebase (Auth/Firestore), PostgreSQL (pgvector RAG), Google Gemini 2.0  
**Target Market:** India-focused startup ecosystem  

---

## 2. High-Level Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | Server-side rendering, React Server Components |
| **Styling** | Tailwind CSS + Framer Motion | Responsive UI and animations |
| **Auth** | Firebase Authentication | Google OAuth + Email/Password |
| **Primary DB** | Firebase Firestore | Real-time object data (Users, Startups, Tasks) |
| **Vector DB** | PostgreSQL + pgvector | Long-term RAG memory, embeddings, semantic search |
| **AI LLM** | Google Gemini 2.0 Flash | Agent reasoning, content generation |
| **Deployment** | Vercel (Frontend) + Neon (Postgres) | Serverless infrastructure |

### Architecture Diagram

```ascii
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js 16 (App Router + React 18)              │   │
│  │  - Founder Dashboard                                         │   │
│  │  - Investor Portal                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ /api/rag/*   │ │/api/validate │ │/api/roadmap  │ │/api/tasks    ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│         │                 │                │               │        │
└─────────┼─────────────────┼────────────────┼───────────────┼────────┘
          │                 │                │               │
          ▼                 ▼                ▼               ▼
┌──────────────────┐ ┌────────────────┐ ┌───────────────────────────┐
│ Firebase Firestore│ │ PostgreSQL RAG │ │    Google Gemini AI       │
│ (Real-time Data)  │ │ (Vector Memory)│ │   (Reasoning Engine)      │
└──────────────────┘ └────────────────┘ └───────────────────────────┘
```

---

## 3. Core Systems

### A. RAG Memory System (New)

A production-grade **Synthetic Long-Term Memory** system powered by PostgreSQL and pgvector.

- **Objective:** Provide agents with deep, localized context about the startup.
- **Key Features:**
  - **Strict Multi-Tenancy:** Row-Level Security (RLS) enforces `project_id` isolation.
  - **Causal Integrity:** Memories form a causal chain (`supersedes`, `refines`, `contradicts`).
  - **India Context:** Specialized `LocalizerAgent` adapts advice for Indian market/regulations.
  - **Hybrid Search:** Combines vector similarity with metadata filtering (stage, source type).

### B. Agent Implementation

The platform uses a multi-agent system orchestrated by a `SupervisorAgent`:

1.  **Researcher:** Gathers data using RAG hybrid search.
2.  **Strategist:** Analyzes gaps and contradictions in retrieved context.
3.  **Localizer:** Ensures all advice is relevant to India (e.g., "Private Ltd" vs "LLC").
4.  **Executor:** Converts strategy into actionable tasks.

### C. Real-Time Data (Firestore)

Used for high-frequency, user-facing data synchronization.

- **Startups:** Core project data.
- **Tasks:** AI and user-generated tasks.
- **Deals:** Investment negotiation state machine.
- **Messages:** Real-time chat between founders and investors.

---

## 4. Frontend Architecture

**Directory Structure:**

```
src/
├── app/                    # Route handlers (App Router)
│   ├── admin/              # Admin portal
│   ├── api/                # API Routes (Server actions)
│   ├── founder/            # Founder workflows
│   ├── investor/           # Investor workflows
│   ├── login/              # Auth pages
│   └── onboarding/         # Onboarding flow
├── components/             # Shared UI components
│   ├── deals/              # Deal specific UI
│   ├── messaging/          # Chat UI
│   └── shared/             # Atomic design components
├── lib/                    # Business logic
│   ├── rag/                # RAG system core (db, agents, ingestion)
│   ├── agents/             # Legacy agent helpers
│   └── startup-service.ts  # Firestore service layer
└── hooks/                  # Custom React hooks (useStartup, useAuth)
```

**State Management:**
- **Auth:** `AuthContext` (Firebase)
- **Data:** `useStartup` hook (Firestore real-time listeners)
- **UI:** Local state + URL params

---

## 5. Database Schema

### A. PostgreSQL (RAG Memory)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `memory_chunks` | Stores semantic memory | `id`, `project_id`, `content`, `embedding` (vector), `metadata`, `causal_parent_id` |
| `ingestion_jobs` | Tracks async processing | `id`, `project_id`, `status`, `source_url` |
| `audit_logs` | Security & usage logs | `id`, `project_id`, `user_id`, `action`, `resource_id` |

### B. Firestore (Application Data)

| Collection | Document Structure | Purpose |
|------------|--------------------|---------|
| `users` | `{ uid, role, activeStartupId, email }` | User profiles |
| `startups` | `{ startupId, ownerId, stage, industry }` | Project root |
| `tasks` | `{ id, startupId, status, title }` | Action items |
| `startupMemory` | `{ id, startupId, type, content }` | **Legacy** event log (migrating to Postgres) |
| `deals` | `{ id, startupId, investorId, status, terms }` | Deal flow state |
| `chats` | `{ id, participants, lastMessage }` | Messaging metadata |

---

## 6. Security & Governance

- **Authentication:** Strict Firebase Auth.
- **Authorization:**
  - **Firestore:** Security Rules based on `request.auth.uid`.
  - **PostgreSQL:** RLS policies ensuring users only query their own `project_id`.
- **AI Safety:**
  - **Prompt Injection:** Input sanitization layer.
  - **Rate Limiting:** Token bucket limits per project.
  - **Audit:** All RAG accesses are logged.

---

## 7. Deployment

- **Frontend:** Vercel (Automatic deployments via Git)
- **Database (SQL):** Neon / Supabase (PostgreSQL with pgvector)
- **Database (NoSQL):** Firebase (Google Cloud)
- **Environment Variables:** Managed via Vercel Dashboard directly.

*This document is the Single Source of Truth for FounderFlow Architecture as of Feb 2026.*
