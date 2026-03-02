-- Add precise user location storage and performant geo-distance search support.

CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS location_accuracy_m NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS location_source TEXT,
ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_location_lat_range_chk'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_location_lat_range_chk
    CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_location_lng_range_chk'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_location_lng_range_chk
    CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_location_lat_lng
  ON users(location_lat, location_lng);

CREATE INDEX IF NOT EXISTS idx_contractors_geo_earth
  ON contractors
  USING gist (
    ll_to_earth(
      COALESCE(lat, latitude)::float8,
      COALESCE(lng, longitude)::float8
    )
  )
  WHERE COALESCE(lat, latitude) IS NOT NULL
    AND COALESCE(lng, longitude) IS NOT NULL;
