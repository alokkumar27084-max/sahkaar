-- ── Service Architecture for Macro Services ─────────────────────
-- This migration sets up the core tables for the Macro Service model.
-- Legacy 'chhota' services have been deprecated.

-- ── Service Categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_hi TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_hi TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Services ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_hi TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_hi TEXT,
  price_starts_at INTEGER,
  price_label TEXT DEFAULT 'Starting at',
  image_url TEXT,
  icon TEXT,
  rating NUMERIC(3,2) DEFAULT 4.5,
  bookings_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Service Requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  category_id UUID REFERENCES service_categories(id),
  user_id UUID REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending | confirmed | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_svc_cat_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_svc_req_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_svc_req_created ON service_requests(created_at DESC);

-- NOTE: Seed data for Macro services is handled in later migrations (e.g., 019_seed_bada_services.sql).
-- Legacy 'chhota' seeds have been removed to align with the Macro-only model.

