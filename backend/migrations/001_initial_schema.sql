-- Initial schema for Thekedaar backend
-- Run with: psql "$DATABASE_URL" -f backend/migrations/init.sql

-- Optional: enable PostGIS for geo queries (uncomment if using PostGIS)
-- CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users: customers, contractors, admins
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'customer', -- customer | contractor | admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contractors: profile details linked to a user
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  description TEXT,
  categories TEXT[],
  services TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews left by customers for contractors
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Simple indices to speed up lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_contractors_user ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_contractor ON reviews(contractor_id);

-- For geo queries: a btree on lat/long can be used for simple bounding-box filters.
CREATE INDEX IF NOT EXISTS idx_contractors_lat_long ON contractors(latitude, longitude);
