-- GenoGov SAAS - Supabase Database Schema

-- 1. Table for Family Trees / Cases
CREATE TABLE IF NOT EXISTS trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL, -- Stores { nodes, edges, individuals, families }
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Audit Logs (Compliance & Security)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    case_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g., 'Save', 'Delete', 'AI Diagnosis'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security (RLS)
-- Note: In a real municipal environment, you would restrict this to authenticated users
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Helpful Indexes
CREATE INDEX IF NOT EXISTS idx_trees_case_number ON trees(case_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
