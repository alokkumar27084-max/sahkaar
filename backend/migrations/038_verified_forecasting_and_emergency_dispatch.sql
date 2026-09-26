-- Provenance for demand forecasting and bounded emergency-worker offers.
ALTER TABLE demand_forecast_snapshots
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(30) NOT NULL DEFAULT 'legacy_unverified';

ALTER TABLE demand_forecast_snapshots
  DROP CONSTRAINT IF EXISTS demand_forecast_snapshots_data_source_check;
ALTER TABLE demand_forecast_snapshots
  ADD CONSTRAINT demand_forecast_snapshots_data_source_check
  CHECK (data_source IN ('legacy_unverified','observed','weighted_moving_average','evaluated_forecast','allocation_recommendation','demo'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_observed_demand_day
  ON demand_forecast_snapshots(locality, service_category, forecast_date)
  WHERE data_source = 'observed';

ALTER TABLE workforce_dispatch_offers
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_locality VARCHAR(150);

UPDATE workforce_dispatch_offers SET expires_at = offered_at + INTERVAL '24 hours' WHERE expires_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dispatch_offer_expiry ON workforce_dispatch_offers(status, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_booking_open_offer
  ON workforce_dispatch_offers(booking_id)
  WHERE booking_id IS NOT NULL AND status IN ('offered','accepted');

-- Remove known seeded/demo welfare and insurance records; these were not backed
-- by customer contributions or actual policy-provider integration.
DELETE FROM welfare_fund_contributions WHERE transaction_ref LIKE 'WLF-TXN-%';
DELETE FROM insurance_policies WHERE policy_number LIKE 'POL-SHK-%';

-- Forecasts inserted before this migration have no verified source provenance.
-- They remain for audit, but forecasting and accuracy exclude them.
