-- Phase 2 roadmap alignment: add missing columns/tables while preserving existing schema.

-- Users enhancements
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Contractors enhancements and aliases for roadmap fields
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS daily_rate INTEGER,
ADD COLUMN IF NOT EXISTS experience_years INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_size INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_labour_group BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_responsibility_model BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS location_text TEXT,
ADD COLUMN IF NOT EXISTS lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Keep compatibility with older rows
UPDATE contractors
SET category = COALESCE(category, categories[1]),
    lat = COALESCE(lat, latitude),
    lng = COALESCE(lng, longitude),
    photo_url = COALESCE(photo_url, image_url),
    review_count = COALESCE(review_count, reviews_count, 0),
    updated_at = now();

-- Optional array alias used in roadmap naming
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS portfolio_photos TEXT[];

UPDATE contractors
SET portfolio_photos = COALESCE(portfolio_photos, portfolio_urls, '{}');

-- OTP table
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);

-- Session table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  contractor_id UUID REFERENCES contractors(id),
  reason TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_contractors_category ON contractors(category);
CREATE INDEX IF NOT EXISTS idx_contractors_rating_desc ON contractors(rating DESC);
CREATE INDEX IF NOT EXISTS idx_contractors_verified ON contractors(is_verified);
CREATE INDEX IF NOT EXISTS idx_contractors_featured ON contractors(is_featured);
