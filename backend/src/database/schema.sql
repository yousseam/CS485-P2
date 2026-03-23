-- Database Schema for AI Specification Breakdown Application
-- Supports both US1 (AI breakdown) and US2 (review/edit before publishing)

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS jira_connections CASCADE;
DROP TABLE IF EXISTS generated_tasks CASCADE;
DROP TABLE IF EXISTS suggestion_batches CASCADE;
DROP TABLE IF EXISTS specification_documents CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ProjectLead', -- 'ProjectLead' or 'Developer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specification documents table
CREATE TABLE specification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(512) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  storage_key VARCHAR(512), -- S3 key or local file path
  raw_text TEXT NOT NULL, -- Extracted text content
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'Processing', -- Processing, Completed, Failed
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestion batches table (represents one AI generation session)
CREATE TABLE suggestion_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES specification_documents(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, DISCARDED
  prompt_version VARCHAR(50),
  model VARCHAR(100),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  idempotency_key_last_publish VARCHAR(255)
);

-- Generated tasks (AI-suggested issues that can be edited before publishing)
CREATE TABLE generated_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES suggestion_batches(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'AI', -- 'AI' or 'HUMAN_SEEDED'

  -- Issue fields
  task_type VARCHAR(20) NOT NULL DEFAULT 'story', -- 'epic' or 'story'
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  acceptance_criteria TEXT[],

  -- Metadata
  suggested_priority VARCHAR(20), -- 'P0', 'P1', 'P2', 'P3'
  suggested_story_points INT,
  size VARCHAR(10), -- 'S', 'M', 'L', 'XL'
  tags TEXT[] DEFAULT '{}',
  flagged_as_gap BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT,

  -- Status and approval
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, REJECTED
  sort_order INT DEFAULT 0,
  jira_issue_id VARCHAR(100), -- Set after successful publish
  jira_issue_key VARCHAR(100), -- e.g., "ABC-1234"

  -- Version tracking for optimistic locking
  version INT DEFAULT 1,

  -- Edit tracking
  last_edited_by UUID REFERENCES users(id),
  last_edited_at TIMESTAMPTZ,

  -- AI metadata (raw LLM output for traceability)
  generated_payload JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jira connections (per user, for future real integration)
CREATE TABLE jira_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  cloud_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit events (append-only log of all changes)
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'USER', 'PROJECT', 'DOCUMENT', 'BATCH', 'TASK'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'PUBLISH', 'DISCARD', 'DELETE'
  actor_id UUID NOT NULL REFERENCES users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  diff JSONB, -- Field-level before/after changes
  reason TEXT,
  request_id VARCHAR(255) -- For tracing API requests
);

-- Indexes for common queries
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_spec_docs_project ON specification_documents(project_id);
CREATE INDEX idx_spec_docs_status ON specification_documents(status);
CREATE INDEX idx_suggestion_batches_document ON suggestion_batches(document_id);
CREATE INDEX idx_suggestion_batches_status ON suggestion_batches(status);
CREATE INDEX idx_tasks_batch ON generated_tasks(batch_id);
CREATE INDEX idx_tasks_project ON generated_tasks(project_id);
CREATE INDEX idx_tasks_status ON generated_tasks(status);
CREATE INDEX idx_tasks_approved ON generated_tasks(batch_id, status) WHERE status = 'APPROVED';
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id);

-- Create a default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2b$10$rOq5J5Q5Q5Q5Q5Q5Q5Q5Qu5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', -- bcrypt hash of 'admin123'
  'ProjectLead'
);
