-- SIH 26089: cooperative service lifecycle, financial allocation and auditability.

ALTER TABLE contractors
  ALTER COLUMN verification_status SET DEFAULT 'pending',
  ALTER COLUMN skills_certified SET DEFAULT false;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) NOT NULL DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatch_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS service_lng NUMERIC(9,6);

CREATE TABLE IF NOT EXISTS booking_financial_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  gross_amount NUMERIC(12,2) NOT NULL,
  worker_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  society_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  federation_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  welfare_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooperative_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  society_id UUID REFERENCES cooperative_societies(id) ON DELETE SET NULL,
  federation_id UUID REFERENCES federations(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  entry_type VARCHAR(40) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  reference VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooperative_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  action VARCHAR(60) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_dispatch_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  locality VARCHAR(150) NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  priority VARCHAR(30) NOT NULL DEFAULT 'high',
  status VARCHAR(30) NOT NULL DEFAULT 'offered' CHECK (status IN ('offered','accepted','declined','expired')),
  notes TEXT,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS welfare_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  society_id UUID REFERENCES cooperative_societies(id) ON DELETE SET NULL,
  claim_type VARCHAR(120) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED','DISBURSED')),
  insurance_ref VARCHAR(120),
  supporting_document_url TEXT,
  filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_amount NUMERIC(12,2),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dispatch_offers_worker ON workforce_dispatch_offers(worker_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_workflow_status ON bookings(workflow_status);
CREATE INDEX IF NOT EXISTS idx_booking_ledger_booking ON cooperative_ledger_entries(booking_id);
CREATE INDEX IF NOT EXISTS idx_coop_audit_booking ON cooperative_audit_logs(booking_id, created_at DESC);

UPDATE bookings
SET workflow_status = CASE
  WHEN status = 'COMPLETED' THEN 'completed'
  WHEN status = 'IN_PROGRESS' THEN 'accepted'
  WHEN status IN ('CANCELLED', 'DISPUTED') THEN lower(status)
  ELSE 'created'
END
WHERE workflow_status = 'created';

UPDATE bookings
SET service_lat = COALESCE(service_lat, location_lat),
    service_lng = COALESCE(service_lng, location_lng)
WHERE (service_lat IS NULL OR service_lng IS NULL)
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL;
