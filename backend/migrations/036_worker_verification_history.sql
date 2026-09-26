-- SIH 26089: auditable worker verification and service coverage.
ALTER TABLE contractors
  ALTER COLUMN verification_status SET DEFAULT 'pending',
  ALTER COLUMN skills_certified SET DEFAULT false;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(6,2) NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS certificate_issued_at DATE,
  ADD COLUMN IF NOT EXISTS certificate_expires_at DATE,
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS cooperative_member_since DATE;

ALTER TABLE contractors ALTER COLUMN skill_certification_body DROP DEFAULT;
UPDATE contractors SET skill_certification_body = NULL WHERE certificate_url IS NULL;
UPDATE contractors SET id_document_url = id_proof_url WHERE id_document_url IS NULL AND id_proof_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS worker_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(30) NOT NULL CHECK (action IN ('submitted','approved','rejected','reverified','expired')),
  verification_status VARCHAR(30) NOT NULL,
  reason TEXT,
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_verification_history_worker
  ON worker_verification_history(worker_id, created_at DESC);
