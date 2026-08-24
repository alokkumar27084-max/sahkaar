-- ============================================================
-- 030_worker_federation_verification_and_subscriptions.sql
-- SahKaari: Master Artisan & Cooperative Worker Verification
-- ============================================================

-- Add verification document URLs and federation audit columns
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS cooperative_card_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS badge_type VARCHAR(50) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update default verification_status if needed
ALTER TABLE contractors ALTER COLUMN verification_status SET DEFAULT 'pending';

-- Create performance indexes for search and verification queue
CREATE INDEX IF NOT EXISTS idx_contractors_verification ON contractors(verification_status, is_verified);
CREATE INDEX IF NOT EXISTS idx_contractors_society_verif ON contractors(society_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_contractors_geo ON contractors(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractors_featured_rating ON contractors(is_featured, rating DESC NULLS LAST);
