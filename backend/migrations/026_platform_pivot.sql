-- ============================================================
-- 026_platform_pivot.sql
-- Thekedaar Platform Pivot: Quick Services, Meet-First Booking,
-- Optional Escrow, Labour Chowk, SaaS PM, Subscription Model
-- ============================================================

-- 1. Extend contractors table with service type & quick service support
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) DEFAULT 'project';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS quick_services JSONB DEFAULT '[]';
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS response_time_minutes INT DEFAULT 60;

-- 2. Meetings table (meet-first booking flow)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  booking_fee_order_id VARCHAR(255),
  booking_fee_payment_id VARCHAR(255),
  booking_fee_status VARCHAR(20) DEFAULT 'UNPAID'
    CHECK (booking_fee_status IN ('UNPAID','PAID','REFUNDED')),
  proposed_date TIMESTAMPTZ NOT NULL,
  proposed_time_slot VARCHAR(50),
  proposed_location TEXT,
  proposed_lat DOUBLE PRECISION,
  proposed_lng DOUBLE PRECISION,
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','RESCHEDULED',
                      'COMPLETED','CANCELLED_BY_CUSTOMER',
                      'CANCELLED_BY_CONTRACTOR','NO_SHOW')),
  meeting_type VARCHAR(20) DEFAULT 'in_person'
    CHECK (meeting_type IN ('in_person','video_call','phone_call')),
  contractor_note TEXT,
  customer_note TEXT,
  service_category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Projects table (SaaS PM)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'PLANNING'
    CHECK (status IN ('PLANNING','IN_PROGRESS','ON_HOLD',
                      'COMPLETED','CANCELLED','DISPUTED')),
  escrow_opted BOOLEAN DEFAULT false,
  estimated_budget NUMERIC(12,2),
  actual_cost NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  payment_status VARCHAR(20) DEFAULT 'UNPAID'
    CHECK (payment_status IN ('UNPAID','IN_ESCROW','RELEASED','REFUNDED')),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','SKIPPED')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Project materials tracker
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity NUMERIC(10,2),
  unit VARCHAR(20),
  unit_price NUMERIC(10,2),
  total_price NUMERIC(12,2),
  vendor_name VARCHAR(255),
  purchase_date DATE,
  receipt_url TEXT,
  added_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Project manpower tracker
CREATE TABLE IF NOT EXISTS project_manpower (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  worker_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  daily_rate NUMERIC(8,2),
  days_worked NUMERIC(5,1) DEFAULT 0,
  total_paid NUMERIC(10,2) DEFAULT 0,
  phone VARCHAR(15),
  status VARCHAR(20) DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','COMPLETED','REMOVED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Project expenses
CREATE TABLE IF NOT EXISTS project_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE,
  receipt_url TEXT,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quick service bookings
CREATE TABLE IF NOT EXISTS quick_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_details JSONB,
  booking_fee_order_id VARCHAR(255),
  booking_fee_payment_id VARCHAR(255),
  booking_fee_status VARCHAR(20) DEFAULT 'UNPAID'
    CHECK (booking_fee_status IN ('UNPAID','PAID','REFUNDED')),
  scheduled_date DATE NOT NULL,
  scheduled_time_slot VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS',
                      'COMPLETED','CANCELLED_BY_CUSTOMER',
                      'CANCELLED_BY_CONTRACTOR','DISPUTED')),
  service_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  payment_method VARCHAR(20) DEFAULT 'CASH'
    CHECK (payment_method IN ('CASH','ONLINE','UPI')),
  customer_address TEXT,
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Subscriptions (revenue model: verification badge + priority listing)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(30) NOT NULL
    CHECK (plan_type IN ('verified_badge','priority_listing','premium')),
  status VARCHAR(20) DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED')),
  amount_paid NUMERIC(10,2) NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Lead tracking (5 free leads per contractor)
CREATE TABLE IF NOT EXISTS contractor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_type VARCHAR(30) DEFAULT 'profile_view'
    CHECK (lead_type IN ('profile_view','phone_reveal','chat_init','booking')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Dispute resolution requests
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  booking_type VARCHAR(20) NOT NULL
    CHECK (booking_type IN ('quick_booking','project','meeting')),
  booking_ref_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'OPEN'
    CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED')),
  resolution_note TEXT,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_customer ON meetings(customer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_contractor ON meetings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_contractor ON projects(contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_materials_project ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_manpower_project ON project_manpower(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_quick_bookings_customer ON quick_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_quick_bookings_contractor ON quick_bookings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_quick_bookings_status ON quick_bookings(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contractor ON subscriptions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_leads_contractor ON contractor_leads(contractor_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON contractor_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_disputes_reporter ON disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_contractors_service_type ON contractors(service_type);
