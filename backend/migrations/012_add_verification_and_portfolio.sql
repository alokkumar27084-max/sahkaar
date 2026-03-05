-- ── Add Verification and Tier Columns ───────────────────────────
ALTER TABLE contractors 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified', -- unverified | pending | approved | rejected
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard'; -- standard | silver | gold | platinum

-- ── Create Portfolio Items Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_contractor ON portfolio_items(contractor_id);
