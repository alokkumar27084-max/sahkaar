-- 028_seed_bhopal_contractors.sql
-- Seed high quality professional contractors within 30km of Bhopal center (23.259933, 77.412613)

DO $$
DECLARE
  v_user_id UUID;
  v_contractor_id UUID;
BEGIN

  -- 1. Bhopal Civil & Structure Construction (M P Nagar)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Bhopal Civil & Structure Construction', '+919826011111', 'mpnagar.civil@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.233500, 77.432600, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Bhopal Civil & Structure Construction', 'Home Construction', ARRAY['Home Construction', 'Home Renovation'],
    'Top-rated civil building contractors in M P Nagar specializing in RCC structures, multi-story home construction, foundation engineering, and turnkey residential projects.',
    ARRAY['Full Home Construction', 'Floor Addition', 'Boundary Wall & Gates'],
    1800, 12, 25, false, true, 'M P Nagar Zone 1, Bhopal', 23.233500, 77.432600, 23.233500, 77.432600,
    true, true, true, 'both', 'platinum', 4.9, 38
  )
  ON CONFLICT DO NOTHING;

  -- 2. Elite Spaces Interior & Design (Arera Colony)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Elite Spaces Interior & Design', '+919826022222', 'arera.interiors@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.214400, 77.438900, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Elite Spaces Interior & Design', 'Interior Design', ARRAY['Interior Design', 'Home Renovation'],
    'Luxury interior design studio, modular kitchen installations, false ceilings, custom wardrobe fabrication, and premium woodwork for bungalows and flats in Arera Colony.',
    ARRAY['Living Room Interior', 'Bedroom Wardrobes & Bed', 'Kitchen Remodel'],
    2200, 9, 14, false, true, 'E-3 Arera Colony, Bhopal', 23.214400, 77.438900, 23.214400, 77.438900,
    true, true, true, 'both', 'gold', 4.8, 29
  )
  ON CONFLICT DO NOTHING;

  -- 3. Kolar Electricals & Wiring Solution (Kolar Road)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Kolar Electricals & Wiring Solution', '+919826033333', 'kolar.electric@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.178800, 77.419000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Kolar Electricals & Wiring Solution', 'Electrical Overhaul', ARRAY['Electrical Overhaul'],
    'Professional 3-phase commercial wiring, MCB distribution panel setups, inverter installation, smart home automation, and electrical safety audits across Kolar Road & Chunar Bhatti.',
    ARRAY['Complete House Rewiring', 'Commercial Panel Setup'],
    950, 7, 8, false, false, 'Kolar Road, Near Chunar Bhatti, Bhopal', 23.178800, 77.419000, 23.178800, 77.419000,
    true, false, true, 'quick', 'silver', 4.7, 21
  )
  ON CONFLICT DO NOTHING;

  -- 4. Indrapuri Plumbing & Sanitary Works (Indrapuri)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Indrapuri Plumbing & Sanitary Works', '+919826044444', 'indrapuri.plumb@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.253000, 77.469000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Indrapuri Plumbing & Sanitary Works', 'Plumbing Overhaul', ARRAY['Plumbing Overhaul'],
    'Complete CPVC pipeline laying, underground drainage solutions, overhead water tank installations, pressure pump fittings, and acoustic leak detection in Indrapuri & BHEL township.',
    ARRAY['New House Pipeline', 'Sewage and Drainage Line'],
    850, 10, 6, false, false, 'Sector C Indrapuri, BHEL, Bhopal', 23.253000, 77.469000, 23.253000, 77.469000,
    true, false, true, 'quick', 'standard', 4.6, 18
  )
  ON CONFLICT DO NOTHING;

  -- 5. Bhopal Paint & Home Renovation (New Market)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Bhopal Paint & Home Renovation', '+919826055555', 'newmarket.renovations@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.242000, 77.402000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Bhopal Paint & Home Renovation', 'Home Renovation', ARRAY['Home Renovation', 'Interior Design'],
    'Complete interior & exterior painting, royal texture coatings, dampness waterproofing, tile re-grouting, and complete bathroom remodels near New Market & TT Nagar.',
    ARRAY['Full House Revamp', 'Bathroom Renovation', 'Kitchen Remodel'],
    1200, 11, 15, true, true, 'TT Nagar, Near New Market, Bhopal', 23.242000, 77.402000, 23.242000, 77.402000,
    true, true, true, 'both', 'silver', 4.8, 34
  )
  ON CONFLICT DO NOTHING;

  -- 6. Shree Ram Masonry & Tile Workers (Ayodhya Bypass)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Shree Ram Masonry & Tile Workers', '+919826066666', 'ayodhya.tile@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.275000, 77.468000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Shree Ram Masonry & Tile Workers', 'Home Construction', ARRAY['Home Construction'],
    'Expert vitrified tile fitting, Italian marble floor polishing, brickwork masonry, plastering, and boundary wall construction serving Ayodhya Bypass, Minal Residency & Karond.',
    ARRAY['Boundary Wall & Gates', 'Floor Addition'],
    1400, 8, 12, true, false, 'Ayodhya Bypass Road, Bhopal', 23.275000, 77.468000, 23.275000, 77.468000,
    true, false, true, 'project', 'standard', 4.5, 15
  )
  ON CONFLICT DO NOTHING;

  -- 7. Sant Hirdaram Carpenter & Woodwork Studio (Bairagarh)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Sant Hirdaram Carpenter & Woodwork Studio', '+919826077777', 'bairagarh.wood@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.268000, 77.345000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Sant Hirdaram Carpenter & Woodwork Studio', 'Interior Design', ARRAY['Interior Design'],
    'Custom teakwood furniture, modern sliding wardrobes, main door wooden frames, veneer polishing, and wooden wall paneling in Bairagarh & Airport Road.',
    ARRAY['Bedroom Wardrobes & Bed', 'Living Room Interior'],
    1300, 15, 10, false, true, 'Main Road Bairagarh, Sant Hirdaram Nagar, Bhopal', 23.268000, 77.345000, 23.268000, 77.345000,
    true, false, true, 'both', 'silver', 4.7, 24
  )
  ON CONFLICT DO NOTHING;

  -- 8. Narmada Commercial Building Services (Hoshangabad Road)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Narmada Commercial Building Services', '+919826088888', 'hoshangabad.commercial@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.185000, 77.458000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Narmada Commercial Building Services', 'Commercial Projects', ARRAY['Commercial Projects', 'Home Construction'],
    'Commercial complex construction, corporate office glass partitions, acoustic ceiling insulation, showroom interiors, and heavy structural works along Hoshangabad Road highway corridor.',
    ARRAY['Office Workspace Setup', 'Retail Shop Interior'],
    2500, 14, 35, false, true, 'Hoshangabad Road, Misrod, Bhopal', 23.185000, 77.458000, 23.185000, 77.458000,
    true, true, true, 'project', 'gold', 4.9, 42
  )
  ON CONFLICT DO NOTHING;

  -- 9. Mandideep Industrial Fab & Heavy Works (Mandideep)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Mandideep Industrial Fab & Heavy Works', '+919826099999', 'mandideep.industrial@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.102000, 77.518000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Mandideep Industrial Fab & Heavy Works', 'Commercial Projects', ARRAY['Commercial Projects'],
    'Industrial warehouse shed fabrication, heavy cabling, PEB structures, high voltage transformer paneling, and factory civil maintenance in Mandideep industrial zone.',
    ARRAY['Commercial Panel Setup', 'Office Workspace Setup'],
    3000, 16, 40, true, true, 'Industrial Area Phase 1, Mandideep', 23.102000, 77.518000, 23.102000, 77.518000,
    true, false, true, 'project', 'platinum', 4.8, 19
  )
  ON CONFLICT DO NOTHING;

  -- 10. Karond Builder & Construction Group (Karond)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Karond Builder & Construction Group', '+919826010101', 'karond.builders@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.295000, 77.405000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Karond Builder & Construction Group', 'Home Construction', ARRAY['Home Construction', 'Home Renovation'],
    'Independent house construction, foundation piling, septic tank & soak pit construction, and roof heat proofing along Karond square & Berasia Road.',
    ARRAY['Full Home Construction', 'Boundary Wall & Gates'],
    1600, 9, 18, true, false, 'Karond Square, Berasia Road, Bhopal', 23.295000, 77.405000, 23.295000, 77.405000,
    true, false, true, 'both', 'silver', 4.6, 22
  )
  ON CONFLICT DO NOTHING;

  -- 11. Vindhyachal Eco Architect & Contractors (Bhadbhada Road)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Vindhyachal Eco Architect & Contractors', '+919826020202', 'bhadbhada.eco@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.218000, 77.368000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Vindhyachal Eco Architect & Contractors', 'Home Renovation', ARRAY['Home Renovation', 'Interior Design'],
    'Sustainable eco-renovation, rainwater harvesting filter systems, solar rooftop structure installation, terrace gardens, and waterproofing near Bhadbhada Dam & Suraj Nagar.',
    ARRAY['Full House Revamp', 'Kitchen Remodel'],
    2000, 10, 12, false, true, 'Suraj Nagar, Bhadbhada Road, Bhopal', 23.218000, 77.368000, 23.218000, 77.368000,
    true, true, true, 'project', 'gold', 4.9, 31
  )
  ON CONFLICT DO NOTHING;

  -- 12. Airport City Interior Decorators (Gandhi Nagar / Airport)
  INSERT INTO users (name, phone, email, password_hash, role, location_lat, location_lng, location_source)
  VALUES ('Airport City Interior Decorators', '+919826060606', 'airport.decor@thekedaar.in', '$2b$10$wE0v2XQ2E8V7R4F6e8V7R.E8V7R4F6e8V7R4F6e8V7R4F6e8V7R4F6', 'contractor', 23.289000, 77.338000, 'GPS')
  ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, location_lat = EXCLUDED.location_lat, location_lng = EXCLUDED.location_lng
  RETURNING id INTO v_user_id;

  INSERT INTO contractors (
    user_id, business_name, category, categories, description, services, daily_rate, experience_years, team_size,
    is_labour_group, is_responsibility_model, location_text, lat, lng, latitude, longitude,
    is_verified, is_featured, is_available, service_type, tier, rating, reviews_count
  ) VALUES (
    v_user_id, 'Airport City Interior Decorators', 'Interior Design', ARRAY['Interior Design', 'Home Renovation'],
    'Modern flat interior turnkeys, ambient LED profile lighting, acrylic modular kitchens, CNC jali dividers, and 3D wall decor near Raja Bhoj Airport & Gandhi Nagar.',
    ARRAY['Living Room Interior', 'Kitchen Remodel', 'Bedroom Wardrobes & Bed'],
    1900, 8, 11, false, true, 'Gandhi Nagar, Airport Road, Bhopal', 23.289000, 77.338000, 23.289000, 77.338000,
    true, false, true, 'both', 'silver', 4.7, 19
  )
  ON CONFLICT DO NOTHING;

END $$;
