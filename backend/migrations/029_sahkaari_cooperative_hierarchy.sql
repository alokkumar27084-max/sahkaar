-- ============================================================
-- 029_sahkaari_cooperative_hierarchy.sql
-- SahKaari: Cooperative-Owned Digital Marketplace Platform
-- 3-Tier Hierarchy: Federation -> Primary Cooperative Society -> Verified Worker
-- ============================================================

-- 1. Federations Table (Apex / State Level Cooperative Federations)
CREATE TABLE IF NOT EXISTS federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100) UNIQUE,
  state VARCHAR(100) NOT NULL DEFAULT 'Madhya Pradesh',
  region VARCHAR(100) NOT NULL DEFAULT 'Central India',
  contact_email VARCHAR(150),
  contact_phone VARCHAR(50),
  office_address TEXT,
  welfare_fund_balance NUMERIC(14, 2) DEFAULT 2500000.00,
  insurance_partner VARCHAR(150) DEFAULT 'National Insurance Co-operative Scheme',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cooperative Societies Table (Primary District & Ward Level Societies)
CREATE TABLE IF NOT EXISTS cooperative_societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID REFERENCES federations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100) UNIQUE,
  district VARCHAR(100) NOT NULL DEFAULT 'Bhopal',
  region VARCHAR(100) NOT NULL DEFAULT 'Madhya Pradesh',
  contact_phone VARCHAR(50),
  contact_email VARCHAR(150),
  office_address TEXT,
  total_members INT DEFAULT 0,
  verified_members INT DEFAULT 0,
  welfare_pool_balance NUMERIC(12, 2) DEFAULT 450000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Extend Users table with Society and Federation References
ALTER TABLE users ADD COLUMN IF NOT EXISTS society_id UUID REFERENCES cooperative_societies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS federation_id UUID REFERENCES federations(id) ON DELETE SET NULL;

-- 4. Extend Contractors (Workers) table with Cooperative Society Hierarchy & Credentials
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS society_id UUID REFERENCES cooperative_societies(id) ON DELETE SET NULL;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS member_registration_no VARCHAR(100);
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS welfare_id VARCHAR(100);
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS skills_certified BOOLEAN DEFAULT true;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'verified';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS id_document_type VARCHAR(100) DEFAULT 'Aadhaar / Co-op ID';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS skill_certification_body VARCHAR(150) DEFAULT 'NCCT & State Skill Mission';

-- 5. Welfare Fund Contributions (Worker Social Security Pool)
CREATE TABLE IF NOT EXISTS welfare_fund_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  society_id UUID REFERENCES cooperative_societies(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
  period VARCHAR(50) NOT NULL DEFAULT 'August 2026',
  status VARCHAR(30) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PENDING', 'PROCESSING')),
  contribution_date DATE DEFAULT CURRENT_DATE,
  transaction_ref VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insurance Policies (Accident, Health & Life for Cooperative Workers)
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  policy_name VARCHAR(255) NOT NULL DEFAULT 'Pradhan Mantri Suraksha Bima - Sahkari Suraksha',
  policy_number VARCHAR(100) NOT NULL,
  provider VARCHAR(150) NOT NULL DEFAULT 'Cooperative Health & Life Trust',
  coverage_amount NUMERIC(12, 2) NOT NULL DEFAULT 500000.00,
  coverage_details TEXT DEFAULT 'Includes accidental disability cover, emergency hospitalisation, and family income protection.',
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RENEWAL_DUE', 'EXPIRED')),
  valid_till DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Demand Forecast Snapshots (AI / Statistical Demand Prediction grouped by Locality + Service Category)
CREATE TABLE IF NOT EXISTS demand_forecast_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locality VARCHAR(150) NOT NULL,
  service_category VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,
  predicted_demand INT NOT NULL,
  actual_demand INT DEFAULT 0,
  confidence_score NUMERIC(4, 2) DEFAULT 0.92,
  seasonal_factor NUMERIC(4, 2) DEFAULT 1.15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Extend Bookings table with Emergency & Priority Flags
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS priority_level VARCHAR(30) DEFAULT 'standard';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS welfare_fee NUMERIC(8, 2) DEFAULT 25.00;

-- 9. Create Performance & Discovery Indexes
CREATE INDEX IF NOT EXISTS idx_contractors_society ON contractors(society_id);
CREATE INDEX IF NOT EXISTS idx_coop_soc_fed ON cooperative_societies(federation_id);
CREATE INDEX IF NOT EXISTS idx_welfare_worker ON welfare_fund_contributions(worker_id);
CREATE INDEX IF NOT EXISTS idx_insurance_worker ON insurance_policies(worker_id);
CREATE INDEX IF NOT EXISTS idx_forecast_loc_cat ON demand_forecast_snapshots(locality, service_category, forecast_date);
CREATE INDEX IF NOT EXISTS idx_bookings_emergency ON bookings(is_emergency);

-- ============================================================
-- INITIAL SEED DATA FOR COOPERATIVE HIERARCHY & DEMO READINESS
-- ============================================================

-- 1. Seed Federations
INSERT INTO federations (id, name, registration_no, state, region, contact_email, contact_phone, office_address, welfare_fund_balance)
VALUES 
  ('11111111-1111-4111-a111-111111111111', 'Madhya Pradesh State Labour & Construction Cooperative Federation', 'FED-MP-2018-0941', 'Madhya Pradesh', 'Central Zone', 'contact@mpscfl.coop.in', '+91 755 244 8900', 'Sahakar Bhavan, Link Road No. 1, Bhopal, MP 462003', 4850000.00),
  ('22222222-2222-4222-a222-222222222222', 'Maharashtra State Labourers & Artisan Co-operative Union', 'FED-MH-2016-1823', 'Maharashtra', 'Western Zone', 'nodal@mahacoop.gov.in', '+91 22 2202 4432', 'Sahakar Setu, Nariman Point, Mumbai, MH 400021', 8900000.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Primary Cooperative Societies
INSERT INTO cooperative_societies (id, federation_id, name, registration_no, district, region, contact_phone, contact_email, office_address, total_members, verified_members, welfare_pool_balance)
VALUES
  ('33333333-3333-4333-a333-333333333333', '11111111-1111-4111-a111-111111111111', 'Bhopal Shramik & Karigar Sahakari Samiti (Ward 1-25)', 'SOC-BPL-2020-0412', 'Bhopal', 'Madhya Pradesh', '+91 755 255 1201', 'bhopal.west@sahkaari.in', 'Near GTB Complex, TT Nagar, Bhopal, MP 462003', 184, 178, 620000.00),
  ('44444444-4444-4444-a444-444444444444', '11111111-1111-4111-a111-111111111111', 'Bhopal Central Technical & Artisan Cooperative Society', 'SOC-BPL-2021-0889', 'Bhopal', 'Madhya Pradesh', '+91 755 277 4390', 'bhopal.central@sahkaari.in', 'MP Nagar Zone-II, Near Sargam Cinema, Bhopal, MP 462011', 142, 139, 480000.00),
  ('55555555-5555-4555-a555-555555555555', '11111111-1111-4111-a111-111111111111', 'Indore District Shramik Vikas Sahakari Sanstha', 'SOC-IND-2019-1102', 'Indore', 'Madhya Pradesh', '+91 731 249 8812', 'indore.coop@sahkaari.in', 'RNT Marg, Near High Court, Indore, MP 452001', 260, 252, 940000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Associate all existing contractors with a Cooperative Society if unlinked
UPDATE contractors
SET 
  society_id = '33333333-3333-4333-a333-333333333333',
  member_registration_no = COALESCE(member_registration_no, 'MEM-BPL-' || LPAD((FLOOR(RANDOM()*8999 + 1000))::TEXT, 5, '0')),
  welfare_id = COALESCE(welfare_id, 'WLF-2026-' || LPAD((FLOOR(RANDOM()*89999 + 10000))::TEXT, 6, '0')),
  skills_certified = true,
  verification_status = 'verified',
  is_verified = true
WHERE society_id IS NULL;

-- 4. Seed Welfare Contributions for Contractors
INSERT INTO welfare_fund_contributions (worker_id, society_id, amount, period, status, contribution_date, transaction_ref)
SELECT 
  c.id, 
  c.society_id, 
  250.00, 
  'August 2026', 
  'PAID', 
  CURRENT_DATE - INTERVAL '5 days', 
  'WLF-TXN-' || SUBSTRING(c.id::text, 1, 8)
FROM contractors c
WHERE c.society_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. Seed Insurance Policies for Contractors
INSERT INTO insurance_policies (worker_id, policy_name, policy_number, provider, coverage_amount, coverage_details, status, valid_till)
SELECT 
  c.id, 
  'Pradhan Mantri Suraksha Bima - Sahkari Shramik Suraksha', 
  'POL-SHK-' || SUBSTRING(c.id::text, 1, 8) || '-2026', 
  'National Cooperative General Insurance Corp', 
  500000.00, 
  'Comprehensive personal accident, occupational disability benefit of Rs 5 Lakhs, and emergency cashless family OPD assistance.', 
  'ACTIVE', 
  CURRENT_DATE + INTERVAL '320 days'
FROM contractors c
ON CONFLICT DO NOTHING;

-- 6. Seed Demand Forecast Snapshots for Key Localities & Trade Categories
INSERT INTO demand_forecast_snapshots (locality, service_category, forecast_date, predicted_demand, actual_demand, confidence_score, seasonal_factor)
VALUES
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '6 days', 38, 35, 0.94, 1.10),
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '5 days', 42, 40, 0.95, 1.12),
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '4 days', 45, 47, 0.91, 1.15),
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '3 days', 50, 48, 0.93, 1.20),
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '2 days', 55, 52, 0.96, 1.22),
  ('MP Nagar', 'electrical', CURRENT_DATE - INTERVAL '1 day', 60, 58, 0.95, 1.25),
  ('MP Nagar', 'electrical', CURRENT_DATE, 65, 62, 0.94, 1.28),
  ('MP Nagar', 'electrical', CURRENT_DATE + INTERVAL '1 day', 68, 0, 0.92, 1.30),
  ('MP Nagar', 'electrical', CURRENT_DATE + INTERVAL '2 days', 72, 0, 0.91, 1.35),
  ('MP Nagar', 'electrical', CURRENT_DATE + INTERVAL '3 days', 70, 0, 0.90, 1.32),
  
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '6 days', 28, 26, 0.92, 1.05),
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '5 days', 31, 30, 0.93, 1.08),
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '4 days', 35, 33, 0.94, 1.10),
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '3 days', 39, 41, 0.91, 1.15),
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '2 days', 44, 42, 0.95, 1.18),
  ('Arera Colony', 'plumbing', CURRENT_DATE - INTERVAL '1 day', 48, 46, 0.94, 1.20),
  ('Arera Colony', 'plumbing', CURRENT_DATE, 52, 50, 0.93, 1.22),
  ('Arera Colony', 'plumbing', CURRENT_DATE + INTERVAL '1 day', 55, 0, 0.92, 1.24),
  ('Arera Colony', 'plumbing', CURRENT_DATE + INTERVAL '2 days', 58, 0, 0.90, 1.26),
  ('Arera Colony', 'plumbing', CURRENT_DATE + INTERVAL '3 days', 60, 0, 0.89, 1.28),

  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '6 days', 18, 20, 0.88, 1.00),
  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '5 days', 22, 21, 0.90, 1.02),
  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '4 days', 25, 24, 0.91, 1.05),
  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '3 days', 30, 29, 0.92, 1.08),
  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '2 days', 32, 34, 0.93, 1.10),
  ('Kolar Road', 'construction', CURRENT_DATE - INTERVAL '1 day', 36, 35, 0.94, 1.12),
  ('Kolar Road', 'construction', CURRENT_DATE, 40, 38, 0.92, 1.15),
  ('Kolar Road', 'construction', CURRENT_DATE + INTERVAL '1 day', 42, 0, 0.91, 1.16),
  ('Kolar Road', 'construction', CURRENT_DATE + INTERVAL '2 days', 45, 0, 0.89, 1.18),
  ('Kolar Road', 'construction', CURRENT_DATE + INTERVAL '3 days', 48, 0, 0.88, 1.20)
ON CONFLICT DO NOTHING;
