-- ── Drop Local Directory Table ─────────────────────────────────
DROP TABLE IF EXISTS directory_listings CASCADE;

-- ── Remove Quick Services (Chhota) ───────────────────────────
-- These deletions are only necessary if the 'type' column still exists.
-- If 'type' was already removed from migration 011, these steps are redundant.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_requests' AND column_name='type') THEN
        DELETE FROM service_requests WHERE type = 'chhota';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_categories' AND column_name='type') THEN
        DELETE FROM services WHERE category_id IN (SELECT id FROM service_categories WHERE type = 'chhota');
        DELETE FROM service_categories WHERE type = 'chhota';
    END IF;
END $$;

