-- 020_add_contractor_onboarding_data.sql
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
