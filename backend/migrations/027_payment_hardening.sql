CREATE TABLE IF NOT EXISTS subscription_payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  plan_type VARCHAR(30) NOT NULL
    CHECK (plan_type IN ('verified_badge','priority_listing','premium')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payment_orders_contractor
  ON subscription_payment_orders(contractor_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_booking_fee_payment_unique
  ON meetings(booking_fee_payment_id)
  WHERE booking_fee_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quick_bookings_fee_payment_unique
  ON quick_bookings(booking_fee_payment_id)
  WHERE booking_fee_payment_id IS NOT NULL;
