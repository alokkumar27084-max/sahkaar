ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_tier VARCHAR(30) NOT NULL DEFAULT 'quick',
  ADD COLUMN IF NOT EXISTS payment_plan VARCHAR(50) NOT NULL DEFAULT 'full_escrow',
  ADD COLUMN IF NOT EXISTS estimated_project_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS escrow_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS milestone_details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_label TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_tier ON bookings(service_tier);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
