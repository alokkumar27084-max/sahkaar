-- Federation owner access, real federation locations and auditable welfare balances.
ALTER TABLE federations
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS razorpay_linked_account_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payout_onboarding_status VARCHAR(30) NOT NULL DEFAULT 'not_configured';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS federation_id UUID REFERENCES federations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS razorpay_linked_account_id VARCHAR(100);

CREATE TABLE IF NOT EXISTS federation_booking_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES federations(id),
  razorpay_transfer_id VARCHAR(100),
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'awaiting_release',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_federations_owner_user
  ON federations(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- Previous corpus numbers were seeded demo balances, not customer contributions.
-- Reset them so the displayed amount is backed only by ledgered funds.
UPDATE cooperative_societies SET welfare_pool_balance = 0;
UPDATE federations SET welfare_fund_balance = 0;

CREATE OR REPLACE FUNCTION prevent_cooperative_ledger_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Cooperative ledger entries are immutable';
END;
$$;

DROP TRIGGER IF EXISTS cooperative_ledger_immutable ON cooperative_ledger_entries;
CREATE TRIGGER cooperative_ledger_immutable
  BEFORE UPDATE OR DELETE ON cooperative_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_cooperative_ledger_mutation();

CREATE INDEX IF NOT EXISTS idx_coop_ledger_welfare_society
  ON cooperative_ledger_entries(society_id, created_at)
  WHERE entry_type IN ('welfare_contribution', 'welfare_claim_disbursement');
