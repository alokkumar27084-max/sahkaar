-- ============================================================
-- 034_nationwide_federation_jurisdiction.sql
-- Nationwide Multi-Federation & District Society Jurisdiction
-- ============================================================

-- 1. Add jurisdiction and territorial columns
ALTER TABLE federations ADD COLUMN IF NOT EXISTS jurisdiction_state VARCHAR(100);
ALTER TABLE federations ADD COLUMN IF NOT EXISTS jurisdiction_districts TEXT[] DEFAULT '{}';
ALTER TABLE federations ADD COLUMN IF NOT EXISTS is_national BOOLEAN DEFAULT false;
ALTER TABLE federations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS jurisdiction_districts TEXT[] DEFAULT '{}';
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS jurisdiction_state VARCHAR(100);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS pincodes TEXT[] DEFAULT '{}';
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Seed Nationwide State Federations
INSERT INTO federations (id, name, registration_no, state, jurisdiction_state, region, jurisdiction_districts, contact_email, contact_phone, office_address, welfare_fund_balance, is_national)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'National Apex Labour & Artisan Cooperative Federation of India (NALACFI)',
    'FED-IND-NAT-001',
    'National',
    'All India',
    'National',
    ARRAY['All Districts'],
    'apex@sahkaari.in',
    '+91 11 2334 5678',
    'NCUI Cooperative Complex, 3 Siri Institutional Area, August Kranti Marg, New Delhi 110016',
    50000000.00,
    true
  ),
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Madhya Pradesh State Labour & Artisan Cooperative Federation',
    'FED-MP-BPL-2024-001',
    'Madhya Pradesh',
    'Madhya Pradesh',
    'Central India',
    ARRAY['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Hoshangabad', 'Sehore', 'Raisen', 'Dewas'],
    'mp.federation@sahkaari.in',
    '+91 755 244 5566',
    'Sahakar Bhavan, Link Road No. 1, Apex Bank Campus, Bhopal, MP 462003',
    5000000.00,
    false
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Maharashtra State Kamgar Sahakari Mahasangh',
    'FED-MH-MUM-2024-002',
    'Maharashtra',
    'Maharashtra',
    'West India',
    ARRAY['Mumbai', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Kolhapur'],
    'mh.federation@sahkaari.in',
    '+91 22 2202 4433',
    'Sahakar Sankul, Nariman Point, Mumbai, Maharashtra 400021',
    8500000.00,
    false
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Delhi-NCR Skilled Artisan & Labour Cooperative Federation',
    'FED-DL-NCR-2024-003',
    'Delhi',
    'Delhi',
    'North India',
    ARRAY['Central Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Noida', 'Greater Noida', 'Gurugram', 'Faridabad', 'Ghaziabad'],
    'delhi.federation@sahkaari.in',
    '+91 11 2341 8899',
    'Cooperative House, Vikas Marg, Laxmi Nagar, New Delhi 110092',
    6000000.00,
    false
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004',
    'Rajasthan Rajya Shramik Sahakari Sangh',
    'FED-RJ-JPR-2024-004',
    'Rajasthan',
    'Rajasthan',
    'North-West India',
    ARRAY['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'],
    'rj.federation@sahkaari.in',
    '+91 141 274 1122',
    'Nehru Sahakar Bhawan, 22 Godam Circle, Jaipur, Rajasthan 302005',
    4200000.00,
    false
  ),
  (
    'a1b2c3d4-0005-4000-8000-000000000005',
    'Karnataka State Labour & Artisan Cooperative Union',
    'FED-KA-BLR-2024-005',
    'Karnataka',
    'Karnataka',
    'South India',
    ARRAY['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi'],
    'ka.federation@sahkaari.in',
    '+91 80 2226 3344',
    'Souharda Sahakari Soudha, Malleshwaram, Bengaluru, Karnataka 560003',
    7200000.00,
    false
  ),
  (
    'a1b2c3d4-0006-4000-8000-000000000006',
    'Uttar Pradesh Shram Sahakari Sangh Limited',
    'FED-UP-LKO-2024-006',
    'Uttar Pradesh',
    'Uttar Pradesh',
    'North India',
    ARRAY['Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Agra', 'Meerut', 'Bareilly', 'Gorakhpur', 'Aligarh'],
    'up.federation@sahkaari.in',
    '+91 522 223 9988',
    'Sahakarita Bhawan, 14 Vidhan Sabha Marg, Lucknow, Uttar Pradesh 226001',
    4800000.00,
    false
  )
ON CONFLICT (registration_no) DO UPDATE SET
  jurisdiction_state = EXCLUDED.jurisdiction_state,
  jurisdiction_districts = EXCLUDED.jurisdiction_districts,
  office_address = EXCLUDED.office_address;

-- 3. Seed District-Level Primary Labour Cooperative Societies
INSERT INTO cooperative_societies (id, federation_id, name, registration_no, district, jurisdiction_districts, jurisdiction_state, region, contact_phone, contact_email, office_address, welfare_pool_balance)
VALUES
  (
    'b2c3d4e5-0001-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Bhopal Shramik & Karigar Sahakari Samiti Maryadit',
    'SOC-MP-BPL-001',
    'Bhopal',
    ARRAY['Bhopal', 'Sehore', 'Raisen'],
    'Madhya Pradesh',
    'Madhya Pradesh',
    '+91 755 277 8899',
    'bhopal.society@sahkaari.in',
    'Plot 42, Zone II, MP Nagar, Bhopal, MP 462011',
    850000.00
  ),
  (
    'b2c3d4e5-0002-4000-8000-000000000002',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Indore Shilpkar & Shramik Sahakari Sanstha',
    'SOC-MP-IND-002',
    'Indore',
    ARRAY['Indore', 'Dewas', 'Ujjain'],
    'Madhya Pradesh',
    'Madhya Pradesh',
    '+91 731 255 4433',
    'indore.society@sahkaari.in',
    '14/2 South Tukoganj, MG Road, Indore, MP 452001',
    920000.00
  ),
  (
    'b2c3d4e5-0003-4000-8000-000000000003',
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Mumbai Metropolitan Kamgar Sahakari Sanstha',
    'SOC-MH-MUM-003',
    'Mumbai',
    ARRAY['Mumbai', 'Mumbai Suburban', 'Thane', 'Navi Mumbai'],
    'Maharashtra',
    'Maharashtra',
    '+91 22 2884 1122',
    'mumbai.society@sahkaari.in',
    'Shop 18, Dadar Cooperative Plaza, Senapati Bapat Marg, Dadar West, Mumbai 400028',
    1500000.00
  ),
  (
    'b2c3d4e5-0004-4000-8000-000000000004',
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Pune Jilha Shramik Sahakari Mandali',
    'SOC-MH-PUN-004',
    'Pune',
    ARRAY['Pune', 'Solapur', 'Satara'],
    'Maharashtra',
    'Maharashtra',
    '+91 20 2553 6677',
    'pune.society@sahkaari.in',
    'FC Road, Shivajinagar, Pune, Maharashtra 411005',
    1100000.00
  ),
  (
    'b2c3d4e5-0005-4000-8000-000000000005',
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Delhi NCR Artisan & Maintenance Cooperative Society',
    'SOC-DL-NCR-005',
    'New Delhi',
    ARRAY['Central Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'Noida', 'Gurugram'],
    'Delhi',
    'Delhi',
    '+91 11 2341 7766',
    'delhi.society@sahkaari.in',
    'Unit 5, Shankar Market, Connaught Place, New Delhi 110001',
    1250000.00
  ),
  (
    'b2c3d4e5-0006-4000-8000-000000000006',
    'a1b2c3d4-0004-4000-8000-000000000004',
    'Jaipur Karigar Vikas Sahakari Samiti',
    'SOC-RJ-JPR-006',
    'Jaipur',
    ARRAY['Jaipur', 'Ajmer', 'Alwar', 'Dausa'],
    'Rajasthan',
    'Rajasthan',
    '+91 141 237 9900',
    'jaipur.society@sahkaari.in',
    'MI Road, Near Panch Batti, Jaipur, Rajasthan 302001',
    780000.00
  ),
  (
    'b2c3d4e5-0007-4000-8000-000000000007',
    'a1b2c3d4-0005-4000-8000-000000000005',
    'Bengaluru City Skilled Labour Cooperative Society',
    'SOC-KA-BLR-007',
    'Bengaluru',
    ARRAY['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru'],
    'Karnataka',
    'Karnataka',
    '+91 80 2558 7766',
    'blr.society@sahkaari.in',
    'Brigade Towers, Residency Road, Bengaluru, Karnataka 560025',
    1400000.00
  ),
  (
    'b2c3d4e5-0008-4000-8000-000000000008',
    'a1b2c3d4-0006-4000-8000-000000000006',
    'Lucknow Shramik Kalyan Sahakari Samiti',
    'SOC-UP-LKO-008',
    'Lucknow',
    ARRAY['Lucknow', 'Kanpur', 'Unnao', 'Barabanki'],
    'Uttar Pradesh',
    'Uttar Pradesh',
    '+91 522 261 4455',
    'lko.society@sahkaari.in',
    'Hazratganj Main Market, Lucknow, Uttar Pradesh 226001',
    820000.00
  )
ON CONFLICT (registration_no) DO UPDATE SET
  district = EXCLUDED.district,
  jurisdiction_districts = EXCLUDED.jurisdiction_districts,
  jurisdiction_state = EXCLUDED.jurisdiction_state,
  office_address = EXCLUDED.office_address;
