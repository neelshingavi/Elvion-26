# FounderFlow Setup Guide

## 1. Prerequisites

- **Node.js**: v18.0.0+  ([Download](https://nodejs.org/))
- **npm**: v9+ (or Yarn/pnpm)
- **PostgreSQL**: v15+ with `pgvector` extension
- **Firebase Account**: For Auth & Firestore
- **Google AI Studio Key**: For Gemini API

## 2. Installation

```bash
# Clone the repository
git clone https://github.com/neelshingavi/Founder-Flow.git
cd Founder-Flow/founder-flow

# Install dependencies
npm install
```

## 3. Environment Configuration

Create a `.env.local` file in the root directory:

```ini
# --- Firebase (Authentication & App Data) ---
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="founderflow-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="founderflow-app"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="founderflow-app.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# --- Gemini AI (Agent Intelligence) ---
GEMINI_API_KEY="AIzaSy..."

# --- PostgreSQL (RAG Memory System) ---
# Connection string to your Postgres database (e.g., Neon, Supabase, Local)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
```

## 4. Database Setup (PostgreSQL)

You must run the following SQL commands to set up the RAG memory system. Connect to your PostgreSQL instance and execute:

```sql
-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Memory Chunks Table
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

-- 3. Create Indexes (HNSW for Vector Search)
CREATE INDEX IF NOT EXISTS idx_memory_chunks_embedding 
    ON memory_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_active 
    ON memory_chunks (project_id, is_active, is_invalidated);

CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_stage 
    ON memory_chunks (project_id, founder_stage);

CREATE INDEX IF NOT EXISTS idx_memory_chunks_project_tags 
    ON memory_chunks USING gin (tags);

-- 4. Audit Logs
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

-- 5. Ingestion Jobs
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
```

## 5. Deployment

### Render / Vercel
1. Push code to GitHub.
2. Import project in Vercel.
3. Add all Environment Variables from Section 3.
4. **Build Command**: `npm run build`
5. **Install Command**: `npm install`

### Troubleshooting
- **Firebase Error (auth/invalid-credential)**: The user does not exist in Firebase Auth. Sign up first.
- **PgVector Error**: Ensure your Postgres provider supports the `vector` extension. (Use Neon, Supabase, or self-hosted Postgres 15+).
