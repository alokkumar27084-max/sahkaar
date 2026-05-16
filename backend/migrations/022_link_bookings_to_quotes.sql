-- 022_link_bookings_to_quotes.sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_quote ON bookings(quote_id);
