-- site_settings table for admin-configurable values
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT now()
);

-- Seed defaults
INSERT INTO site_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('featured_limit', '8'),
  ('site_name', '"Thekedaar"'),
  ('support_email', '"hello@thekedaar.com"'),
  ('support_phone', '"+91 90000 00000"'),
  ('max_portfolio_photos', '5')
ON CONFLICT (key) DO NOTHING;
