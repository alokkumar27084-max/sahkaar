-- Seed Services for the 'bada' categories

-- Home Construction
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='home-construction'), 'Full Home Construction', 'पूरा घर निर्माण', 'full-home-construction', 'Turnkey housing project from foundation to finish.', 'नींव से फिनिश तक टर्नकी हाउसिंग प्रोजेक्ट।', 1500000, 'building', 1),
  ((SELECT id FROM service_categories WHERE slug='home-construction'), 'Floor Addition', 'मंजिल जोड़ना', 'floor-addition', 'Add an extra floor or room to your existing home.', 'अपने मौजूदा घर में अतिरिक्त मंजिल या कमरा जोड़ें।', 500000, 'layers', 2),
  ((SELECT id FROM service_categories WHERE slug='home-construction'), 'Boundary Wall & Gates', 'दीवार और गेट', 'boundary-wall-gates', 'Construction of boundary walls and heavy gates.', 'चारदीवारी और भारी गेट का निर्माण।', 100000, 'shield', 3)
ON CONFLICT (slug) DO NOTHING;

-- Home Renovation
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='home-renovation'), 'Kitchen Remodel', 'किचन रीमॉडल', 'kitchen-remodel', 'Full modular kitchen renovation.', 'फुल मॉड्यूलर किचन रेनोवेशन।', 75000, 'chefHat', 1),
  ((SELECT id FROM service_categories WHERE slug='home-renovation'), 'Bathroom Renovation', 'बाथरूम रेनोवेशन', 'bathroom-renovation', 'Tiles, fittings, plumbing overhaul.', 'टाइल्स, फिटिंग, प्लंबिंग ओवरहाल।', 40000, 'bath', 2),
  ((SELECT id FROM service_categories WHERE slug='home-renovation'), 'Full House Revamp', 'पूल घर रेनोवेशन', 'full-house-revamp', 'Complete interior and exterior renovation.', 'पूरा इंटीरियर और एक्सटीरियर रेनोवेशन।', 250000, 'home', 3)
ON CONFLICT (slug) DO NOTHING;

-- Interior Design
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='interior-design'), 'Living Room Interior', 'लिविंग रूम इंटीरियर', 'living-room-interior', 'False ceiling, TV unit, Sofa set styling.', 'फॉल्स सीलिंग, टीवी यूनिट, सोफा सेट स्टाइलिंग।', 60000, 'sofa', 1),
  ((SELECT id FROM service_categories WHERE slug='interior-design'), 'Bedroom Wardrobes & Bed', 'बेडरूम इंटीरियर', 'bedroom-wardrobes-bed', 'Custom luxury bedroom interiors.', 'कस्टम लक्जरी बेडरूम इंटीरियर।', 85000, 'armchair', 2)
ON CONFLICT (slug) DO NOTHING;

-- Commercial Projects
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='commercial-projects'), 'Office Workspace Setup', 'ऑफिस वर्कस्पेस सेटअप', 'office-workspace-setup', 'Desks, glass partitions, and networking.', 'डेस्क, ग्लास पार्टीशन, और नेटवर्किंग।', 300000, 'briefcase', 1),
  ((SELECT id FROM service_categories WHERE slug='commercial-projects'), 'Retail Shop Interior', 'रिटेल शॉप इंटीरियर', 'retail-shop-interior', 'Racks, displays, aesthetic lighting.', 'रैक, डिस्प्ले, एस्थेटिक लाइटिंग।', 150000, 'shoppingBag', 2)
ON CONFLICT (slug) DO NOTHING;

-- Electrical Overhaul
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='electrical-overhaul'), 'Complete House Rewiring', 'पूरे घर की रीवायरिंग', 'complete-house-rewiring', 'Replace all old wires, MCB, and boards.', 'सभी पुराने तार, एमसीबी और बोर्ड बदलें।', 45000, 'zap', 1),
  ((SELECT id FROM service_categories WHERE slug='electrical-overhaul'), 'Commercial Panel Setup', 'कमर्शियल पैनल सेटअप', 'commercial-panel-setup', 'Three phase panels for factories and large offices.', 'कारखानों और बड़े कार्यालयों के लिए थ्री फेज पैनल।', 80000, 'server', 2)
ON CONFLICT (slug) DO NOTHING;

-- Plumbing Overhaul
INSERT INTO services (category_id, name, name_hi, slug, description, description_hi, price_starts_at, icon, display_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='plumbing-overhaul'), 'New House Pipeline', 'नए घर की पाइपलाइन', 'new-house-pipeline', 'Complete CPVC piping from tank to taps.', 'टैंक से नल तक पूरी सीपीवीसी पाइपिंग।', 35000, 'gitMerge', 1),
  ((SELECT id FROM service_categories WHERE slug='plumbing-overhaul'), 'Sewage and Drainage Line', 'गटर और ड्रेनेज लाइन', 'sewage-drainage-line', 'Underground heavy PVC drainage system.', 'अंडरग्राउंड हैवी पीवीसी ड्रेनेज सिस्टम।', 50000, 'droplets', 2)
ON CONFLICT (slug) DO NOTHING;
