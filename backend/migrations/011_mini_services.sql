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

-- ── Seed: Macro Project Categories ──────────────────────────────
INSERT INTO service_categories (name, name_hi, slug, description, description_hi, icon, display_order) VALUES
  ('Home Construction', 'घर का निर्माण', 'home-construction', 'Complete house construction from foundation to finishing', 'नींव से लेकर फिनिशिंग तक पूरा मकान निर्माण', 'building', 1),
  ('Home Renovation', 'घर का रेनोवेशन', 'home-renovation', 'Kitchen remodel, bathroom renovation, room extension', 'किचन रीमॉडल, बाथरूम रेनोवेशन, कमरा एक्सटेंशन', 'wrench', 2),
  ('Interior Design', 'इंटीरियर डिज़ाइन', 'interior-design', 'Modular kitchen, false ceiling, furniture design, decor', 'मॉड्यूलर किचन, फॉल्स सीलिंग, फर्नीचर डिज़ाइन', 'palette', 3),
  ('Commercial Projects', 'कमर्शियल प्रोजेक्ट्स', 'commercial-projects', 'Office construction, shop interiors, warehouse setup', 'ऑफिस निर्माण, दुकान इंटीरियर, वेयरहाउस सेटअप', 'landmark', 4),
  ('Electrical Overhaul', 'इलेक्ट्रिकल ओवरहॉल', 'electrical-overhaul', 'Complete rewiring, panel upgrade, industrial electrical work', 'पूरी वायरिंग बदलना, पैनल अपग्रेड', 'cable', 5),
  ('Plumbing Overhaul', 'प्लंबिंग ओवरहॉल', 'plumbing-overhaul', 'Complete plumbing renovation, water tank, drainage system', 'पूरी प्लंबिंग रेनोवेशन, पानी की टंकी, ड्रेनेज सिस्टम', 'pipette', 6)
ON CONFLICT (slug) DO NOTHING;

-- NOTE: Seed data for specific services is handled in 019_seed_bada_services.sql.
-- Legacy 'chhota' seeds have been removed to align with the Macro-only model.


