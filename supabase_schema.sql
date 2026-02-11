-- Enable pgvector extension for RAG
create extension if not exists vector;

-- PROJECTS TABLE
-- Stores the high-level startup metadata
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null, -- Links to Auth User
  name text not null,
  description text,
  vertical text, -- e.g., 'SaaS', 'D2C_Fashion'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CANVAS STATES TABLE (The "Live" Graph)
-- Stores the current state of the DAG for a project
create table if not exists canvas_states (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  
  -- The core graph data (React Flow structure)
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  
  -- Global Agentic State
  global_state jsonb default '{"decisionVelocity": 0.5}'::jsonb,
  
  version_number int default 1,
  updated_at timestamptz default now(),
  
  unique(project_id) -- Only one live state per project
);

-- VERSION HISTORY TABLE
-- Immutable snapshots of the graph for "Project Memory"
create table if not exists canvas_versions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  
  version_number int not null,
  nodes jsonb not null,
  edges jsonb not null,
  global_state jsonb,
  
  reason_for_snapshot text, -- e.g., "Pivot to B2B", "Manual Backup"
  created_at timestamptz default now()
);

-- RAG MEMORY TABLE
-- Stores semantic chunks for the "Node Editing Assistant"
create table if not exists project_memory (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  
  content text not null, -- The actual text chunk
  embedding vector(1536), -- OpenAI/Gemini embedding dimension
  
  metadata jsonb, -- e.g., source_url, tags
  created_at timestamptz default now()
);

-- HITL COMMENTS TABLE
-- Stores dialogue for "Red Blocks" (Founder approvals/rejections)
create table if not exists node_comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  node_id text not null, -- The UUID string from React Flow node
  
  user_id uuid, -- Null if System/Agent
  message text not null,
  action_taken text, -- 'approved', 'rejected', 'comment'
  
  created_at timestamptz default now()
);

-- INDEXES
create index on project_memory using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
create index on node_comments (project_id, node_id);
