-- Migration: Add labour_crew JSONB column to contractors
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS labour_crew JSONB DEFAULT '[]'::jsonb;
