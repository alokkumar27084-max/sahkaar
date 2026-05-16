-- ── 024: Schema Cleanup — Remove legacy chhota/bada type columns ──────────
-- The 'type' column on service_categories and service_requests was used to
-- distinguish between Quick Services (chhota) and Macro Services (bada).
-- Quick Services have been removed from the product; all remaining data is 'bada'.
-- We simplify the schema by dropping these now-redundant columns.

-- Drop type column from service_categories (all remaining data is 'bada')
ALTER TABLE service_categories DROP COLUMN IF EXISTS type;

-- Drop type column from service_requests (no longer needed)
ALTER TABLE service_requests DROP COLUMN IF EXISTS type;

-- Clean up: remove any stale directory-related indexes that may not have been removed
DROP INDEX IF EXISTS idx_directory_listings_category;
DROP INDEX IF EXISTS idx_directory_listings_location;
DROP INDEX IF EXISTS idx_directory_listings_user;
DROP INDEX IF EXISTS idx_svc_cat_type;
