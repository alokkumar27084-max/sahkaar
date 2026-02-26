-- Add portfolio_urls and id_proof_url to contractors
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[];

ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS id_proof_url TEXT;
