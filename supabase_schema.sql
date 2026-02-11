-- Enable pgvector extension for RAG
create extension if not exists vector;

-- PROJECTS TABLE
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  name text not null,
  description text,
  vertical text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RAG MEMORY TABLE (Enhanced)
-- Stores semantic chunks with hybrid search and weighting support
create table if not exists project_memory (
  id uuid default gen_random_uuid() primary key,
  project_id text not null, -- startupId from Firebase
  
  content text not null,
  embedding vector(768), -- Gemini text-embedding-004
  metadata jsonb,
  
  -- Tier 2 & 3 Enhancements
  content_hash text, -- SHA-256 for dedup
  memory_type text, -- 'decision', 'task', etc.
  founder_weight float default 1.0, -- 1.5 for user overrides
  is_active boolean default true,
  superseded_by uuid, -- ID of memory that replaces this one
  
  -- Generated FTS column for Hybrid Search
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists project_memory_embedding_idx on project_memory using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists project_memory_project_id_idx on project_memory (project_id);
create index if not exists project_memory_hash_idx on project_memory (content_hash);
create index if not exists project_memory_fts_idx on project_memory using gin (fts);

-- HITL COMMENTS TABLE
create table if not exists node_comments (
  id uuid default gen_random_uuid() primary key,
  project_id text not null,
  node_id text not null,
  user_id uuid,
  message text not null,
  action_taken text,
  created_at timestamptz default now()
);
create index on node_comments (project_id, node_id);

-- HYBRID MATCH FUNCTION (Tier 2)
create or replace function match_documents (
  query_embedding vector(768),
  query_text text,
  match_threshold float,
  match_count int,
  p_project_id text, -- text to match Firebase ID
  p_memory_types text[] default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float,
  final_score float,
  memory_type text,
  created_at timestamptz
)
language plpgsql
as $$
declare
  -- Weight configuration
  w_vector float := 0.7;
  w_keyword float := 0.3;
  w_age_decay float := 90.0; -- Days to decay to ~36% relevance
begin
  return query
  select
    pm.id,
    pm.content,
    pm.metadata,
    (1 - (pm.embedding <=> query_embedding)) as similarity,
    
    -- Final Score Calculation
    -- 1. Base Hybrid Score
    (
      ((1 - (pm.embedding <=> query_embedding)) * w_vector) +
      (ts_rank(pm.fts, plainto_tsquery('english', query_text)) * w_keyword) 
    ) 
    * 
    -- 2. Founder Weighting
    pm.founder_weight 
    * 
    -- 3. Temporal Decay (Newer is better)
    exp(-(extract(epoch from (now() - pm.created_at)) / 86400) / w_age_decay)
    as final_score,
    
    pm.memory_type,
    pm.created_at
  from project_memory pm
  where 
    -- Hard Isolation
    pm.project_id = p_project_id
    -- Active Check
    and pm.is_active = true
    -- Similarity Threshold (Optimization: pre-filter by vector similarity to avoid full scan)
    and (1 - (pm.embedding <=> query_embedding)) > match_threshold
    -- Optional Type Filter
    and (p_memory_types is null or pm.memory_type = any(p_memory_types))
  order by final_score desc
  limit match_count;
end;
$$;
