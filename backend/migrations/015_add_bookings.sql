CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  service_category VARCHAR(100) NOT NULL,
  service_tier VARCHAR(30) NOT NULL DEFAULT 'quick',
  payment_plan VARCHAR(50) NOT NULL DEFAULT 'full_escrow',
  status VARCHAR(50) DEFAULT 'PENDING',
  amount NUMERIC(10, 2) NOT NULL,
  estimated_project_value NUMERIC(12, 2),
  escrow_amount NUMERIC(12, 2),
  payment_status VARCHAR(50) DEFAULT 'UNPAID',
  milestone_details JSONB DEFAULT '[]'::jsonb,
  scheduled_for TIMESTAMPTZ,
  address_label TEXT,
  location_address TEXT,
  location_lat NUMERIC(10, 8),
  location_lng NUMERIC(11, 8),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_signature VARCHAR(255),
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'CREATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_contractor ON bookings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tier ON bookings(service_tier);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
