-- ── Drop Local Directory Table ─────────────────────────────────
DROP TABLE IF EXISTS directory_listings CASCADE;

-- ── Remove Quick Services (Chhota) ───────────────────────────
DELETE FROM service_requests WHERE type = 'chhota';
DELETE FROM services WHERE category_id IN (SELECT id FROM service_categories WHERE type = 'chhota');
DELETE FROM service_categories WHERE type = 'chhota';
