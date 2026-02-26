-- Add contractor availability flag for dashboard toggle
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
