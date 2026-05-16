-- Mini Services: service_categories, services, service_requests
-- Supports both Quick Services (chhota) and Big Projects (bada)

-- ── Service Categories ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_hi TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_hi TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'chhota',  -- 'chhota' | 'bada'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Services ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_hi TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_hi TEXT,
  price_starts_at INTEGER,
  price_label TEXT DEFAULT 'Starting at',
  image_url TEXT,
  icon TEXT,
  rating NUMERIC(3,2) DEFAULT 4.5,
  bookings_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Service Requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  category_id UUID REFERENCES service_categories(id),
  user_id UUID REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',  -- pending | confirmed | completed | cancelled
  type TEXT DEFAULT 'chhota',     -- 'chhota' | 'bada'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Ensure Columns Exist (Idempotency) ──────────────────────────
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'chhota';
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'chhota';

-- ── Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_svc_cat_type ON service_categories(type);
CREATE INDEX IF NOT EXISTS idx_svc_cat_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_svc_req_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_svc_req_created ON service_requests(created_at DESC);

-- ── Seed: Quick Services (Chhota) Categories ────────────────────
INSERT INTO service_categories (name, name_hi, slug, description, description_hi, icon, type, display_order) VALUES
  ('AC & Appliance Repair', 'AC और अप्लायंस रिपेयर', 'ac-appliance-repair', 'AC servicing, fridge repair, washing machine repair and more', 'AC सर्विसिंग, फ्रिज रिपेयर, वॉशिंग मशीन रिपेयर और भी बहुत कुछ', 'snowflake', 'chhota', 1),
  ('Home Cleaning', 'होम क्लीनिंग', 'home-cleaning', 'Deep cleaning, bathroom cleaning, kitchen cleaning, sofa cleaning', 'डीप क्लीनिंग, बाथरूम, किचन, सोफा क्लीनिंग', 'sparkles', 'chhota', 2),
  ('Electrician', 'इलेक्ट्रीशियन', 'electrician', 'Wiring, switchboard repair, fan installation, inverter setup', 'वायरिंग, स्विचबोर्ड रिपेयर, फैन इंस्टॉलेशन', 'zap', 'chhota', 3),
  ('Plumber', 'प्लंबर', 'plumber', 'Tap repair, pipe fitting, drain cleaning, water tank installation', 'टैप रिपेयर, पाइप फिटिंग, नाली सफाई', 'droplets', 'chhota', 4),
  ('Carpenter', 'कारपेंटर', 'carpenter', 'Furniture repair, door fitting, cupboard work, wood polishing', 'फर्नीचर रिपेयर, दरवाजा फिटिंग, अलमारी का काम', 'hammer', 'chhota', 5),
  ('Salon at Home', 'घर पर सैलून', 'salon-at-home', 'Haircut, facial, waxing, makeup at your doorstep', 'हेयरकट, फेशियल, वैक्सिंग, मेकअप आपके घर पर', 'scissors', 'chhota', 6),
  ('Pest Control', 'पेस्ट कंट्रोल', 'pest-control', 'Cockroach, termite, bed bug, mosquito treatment', 'कॉकरोच, दीमक, खटमल, मच्छर उपचार', 'bug', 'chhota', 7),
  ('Painting', 'पेंटिंग', 'painting-service', 'Wall painting, waterproofing, texture painting, POP work', 'वॉल पेंटिंग, वॉटरप्रूफिंग, टेक्सचर पेंटिंग', 'paintbrush', 'chhota', 8)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Big Projects (Bada) Categories ────────────────────────
INSERT INTO service_categories (name, name_hi, slug, description, description_hi, icon, type, display_order) VALUES
  ('Home Construction', 'घर का निर्माण', 'home-construction', 'Complete house construction from foundation to finishing', 'नींव से लेकर फिनिशिंग तक पूरा मकान निर्माण', 'building', 'bada', 1),
  ('Home Renovation', 'घर का रेनोवेशन', 'home-renovation', 'Kitchen remodel, bathroom renovation, room extension', 'किचन रीमॉडल, बाथरूम रेनोवेशन, कमरा एक्सटेंशन', 'wrench', 'bada', 2),
  ('Interior Design', 'इंटीरियर डिज़ाइन', 'interior-design', 'Modular kitchen, false ceiling, furniture design, decor', 'मॉड्यूलर किचन, फॉल्स सीलिंग, फर्नीचर डिज़ाइन', 'palette', 'bada', 3),
  ('Commercial Projects', 'कमर्शियल प्रोजेक्ट्स', 'commercial-projects', 'Office construction, shop interiors, warehouse setup', 'ऑफिस निर्माण, दुकान इंटीरियर, वेयरहाउस सेटअप', 'landmark', 'bada', 4),
  ('Electrical Overhaul', 'इलेक्ट्रिकल ओवरहॉल', 'electrical-overhaul', 'Complete rewiring, panel upgrade, industrial electrical work', 'पूरी वायरिंग बदलना, पैनल अपग्रेड', 'cable', 'bada', 5),
  ('Plumbing Overhaul', 'प्लंबिंग ओवरहॉल', 'plumbing-overhaul', 'Complete plumbing renovation, water tank, drainage system', 'पूरी प्लंबिंग रेनोवेशन, पानी की टंकी, ड्रेनेज सिस्टम', 'pipette', 'bada', 6)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Quick Services Items ──────────────────────────────────
-- AC & Appliance
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='ac-appliance-repair'), 'AC Service & Repair', 'AC सर्विस और रिपेयर', 'ac-service-repair', 'Gas refill, filter cleaning, general servicing', 'गैस रिफिल, फिल्टर क्लीनिंग, सामान्य सर्विसिंग', 499, 'wind', 1),
  ((SELECT id FROM service_categories WHERE slug='ac-appliance-repair'), 'Refrigerator Repair', 'फ्रिज रिपेयर', 'fridge-repair', 'Cooling issue, gas leak, thermostat repair', 'कूलिंग प्रॉब्लेम, गैस लीक, थर्मोस्टेट रिपेयर', 349, 'thermometer', 2),
  ((SELECT id FROM service_categories WHERE slug='ac-appliance-repair'), 'Washing Machine Repair', 'वॉशिंग मशीन रिपेयर', 'washing-machine-repair', 'Drum issue, drainage, motor repair', 'ड्रम प्रॉब्लेम, ड्रेनेज, मोटर रिपेयर', 399, 'loader', 3),
  ((SELECT id FROM service_categories WHERE slug='ac-appliance-repair'), 'RO/Water Purifier Service', 'RO/वॉटर प्यूरीफायर सर्विस', 'ro-water-purifier', 'Filter change, membrane replacement, UV lamp', 'फिल्टर बदलना, मेम्ब्रेन बदलना', 299, 'droplet', 4)
ON CONFLICT (slug) DO NOTHING;

-- Cleaning
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='home-cleaning'), 'Full Home Deep Cleaning', 'पूरे घर की डीप क्लीनिंग', 'full-home-cleaning', '2BHK/3BHK complete deep cleaning with steam', '2BHK/3BHK पूरी डीप क्लीनिंग', 1999, 'home', 1),
  ((SELECT id FROM service_categories WHERE slug='home-cleaning'), 'Bathroom Cleaning', 'बाथरूम क्लीनिंग', 'bathroom-cleaning', 'Tile scrubbing, descaling, disinfection', 'टाइल स्क्रबिंग, डीस्केलिंग', 499, 'bath', 2),
  ((SELECT id FROM service_categories WHERE slug='home-cleaning'), 'Kitchen Deep Cleaning', 'किचन डीप क्लीनिंग', 'kitchen-cleaning', 'Chimney, gas stove, cabinet, floor cleaning', 'चिमनी, गैस स्टोव, कैबिनेट, फ्लोर क्लीनिंग', 899, 'chefHat', 3),
  ((SELECT id FROM service_categories WHERE slug='home-cleaning'), 'Sofa & Carpet Cleaning', 'सोफा और कार्पेट क्लीनिंग', 'sofa-carpet-cleaning', 'Steam cleaning, stain removal, deodorizing', 'स्टीम क्लीनिंग, दाग हटाना', 599, 'sofa', 4)
ON CONFLICT (slug) DO NOTHING;

-- Electrician
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='electrician'), 'Fan Installation & Repair', 'फैन लगाना और रिपेयर', 'fan-install-repair', 'Ceiling fan, exhaust fan installation or repair', 'सीलिंग फैन, एग्जॉस्ट फैन लगाना या रिपेयर', 199, 'fan', 1),
  ((SELECT id FROM service_categories WHERE slug='electrician'), 'Switchboard & Wiring', 'स्विचबोर्ड और वायरिंग', 'switchboard-wiring', 'New switchboard, wiring repair, MCB installation', 'नया स्विचबोर्ड, वायरिंग रिपेयर', 249, 'toggleRight', 2),
  ((SELECT id FROM service_categories WHERE slug='electrician'), 'Inverter & Battery Setup', 'इनवर्टर और बैटरी सेटअप', 'inverter-battery', 'New inverter installation, battery replacement', 'नया इनवर्टर लगाना, बैटरी बदलना', 499, 'battery', 3)
ON CONFLICT (slug) DO NOTHING;

-- Plumber
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='plumber'), 'Tap & Mixer Repair', 'टैप और मिक्सर रिपेयर', 'tap-mixer-repair', 'Leaking tap, mixer installation, water flow fix', 'टैप लीक, मिक्सर लगाना', 149, 'droplets', 1),
  ((SELECT id FROM service_categories WHERE slug='plumber'), 'Drain & Pipe Cleaning', 'नाली और पाइप सफाई', 'drain-pipe-cleaning', 'Blocked drain, pipe cleaning, sewage fix', 'बंद नाली, पाइप सफाई', 299, 'pipette', 2),
  ((SELECT id FROM service_categories WHERE slug='plumber'), 'Water Tank Installation', 'वॉटर टैंक इंस्टॉलेशन', 'water-tank-install', 'Overhead or underground tank setup', 'ऊपरी या अंडरग्राउंड टैंक सेटअप', 999, 'container', 3)
ON CONFLICT (slug) DO NOTHING;

-- Carpenter
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='carpenter'), 'Door & Window Repair', 'दरवाजा और खिड़की रिपेयर', 'door-window-repair', 'Hinge fix, lock repair, frame adjustment', 'कब्ज़ा ठीक करना, ताला रिपेयर', 249, 'door', 1),
  ((SELECT id FROM service_categories WHERE slug='carpenter'), 'Furniture Assembly', 'फर्नीचर असेंबली', 'furniture-assembly', 'Bed, wardrobe, table assembly and disassembly', 'बेड, अलमारी, टेबल लगाना और खोलना', 349, 'armchair', 2),
  ((SELECT id FROM service_categories WHERE slug='carpenter'), 'Custom Woodwork', 'कस्टम वुडवर्क', 'custom-woodwork', 'Custom shelves, cabinets, wooden partitions', 'कस्टम शेल्फ, कैबिनेट, लकड़ी पार्टीशन', 999, 'trees', 3)
ON CONFLICT (slug) DO NOTHING;

-- Salon at Home
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='salon-at-home'), 'Haircut for Men', 'पुरुषों के लिए हेयरकट', 'haircut-men', 'Professional haircut at home', 'घर बैठे प्रोफेशनल हेयरकट', 199, 'scissors', 1),
  ((SELECT id FROM service_categories WHERE slug='salon-at-home'), 'Facial & Cleanup', 'फेशियल और क्लीनअप', 'facial-cleanup', 'Gold facial, fruit facial, deep cleansing', 'गोल्ड फेशियल, फ्रूट फेशियल', 399, 'sparkles', 2),
  ((SELECT id FROM service_categories WHERE slug='salon-at-home'), 'Full Body Waxing', 'फुल बॉडी वैक्सिंग', 'full-body-waxing', 'Arms, legs, underarms, full body waxing', 'हाथ, पैर, अंडरआर्म्स, फुल बॉडी वैक्सिंग', 599, 'star', 3)
ON CONFLICT (slug) DO NOTHING;

-- Pest Control
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='pest-control'), 'Cockroach Treatment', 'कॉकरोच ट्रीटमेंट', 'cockroach-treatment', 'Gel treatment, spray treatment for cockroaches', 'जेल ट्रीटमेंट, स्प्रे ट्रीटमेंट', 499, 'bug', 1),
  ((SELECT id FROM service_categories WHERE slug='pest-control'), 'Termite Control', 'दीमक कंट्रोल', 'termite-control', 'Anti-termite treatment for home and furniture', 'घर और फर्नीचर के लिए एंटी-टर्माइट ट्रीटमेंट', 1499, 'shield', 2),
  ((SELECT id FROM service_categories WHERE slug='pest-control'), 'Mosquito Treatment', 'मच्छर ट्रीटमेंट', 'mosquito-treatment', 'Fogging, larviciding for mosquito control', 'फॉगिंग, लार्विसाइडिंग', 699, 'target', 3)
ON CONFLICT (slug) DO NOTHING;

-- Painting
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='painting-service'), 'Room Painting', 'कमरे की पेंटिंग', 'room-painting', 'Single room wall painting with premium paint', 'एक कमरे की वॉल पेंटिंग', 2499, 'paintbrush', 1),
  ((SELECT id FROM service_categories WHERE slug='painting-service'), 'Waterproofing', 'वॉटरप्रूफिंग', 'waterproofing', 'Terrace, bathroom, wall waterproofing', 'छत, बाथरूम, दीवार वॉटरप्रूफिंग', 1999, 'umbrella', 2),
  ((SELECT id FROM service_categories WHERE slug='painting-service'), 'Texture & POP Work', 'टेक्सचर और POP का काम', 'texture-pop-work', 'Designer wall texture, POP ceiling, wall panels', 'डिज़ाइनर वॉल टेक्सचर, POP सीलिंग', 3499, 'layers', 3)
ON CONFLICT (slug) DO NOTHING;
