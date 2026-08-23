const db = require('../src/config/db');
const bcrypt = require('bcrypt');

const trades = [
  { id: '11111111-1111-4001-a111-000000000001', name: 'Ramesh Sharma Electrical Works', cat: 'electrical', title: 'Certified Master Electrician', rate: 450, phone: '+919826001001', exp: 12, loc: 'MP Nagar Zone 2, Bhopal', lat: 23.2324, lng: 77.4278 },
  { id: '11111111-1111-4001-a111-000000000002', name: 'Suresh Kumar Plumbing Services', cat: 'plumbing', title: 'Licensed Sanitary & Pipe Expert', rate: 400, phone: '+919826001002', exp: 9, loc: 'Arera Colony E-3, Bhopal', lat: 23.2156, lng: 77.4361 },
  { id: '11111111-1111-4001-a111-000000000003', name: 'Vishwakarma Carpentry & Woodcraft', cat: 'carpentry', title: 'Artisan Wood & Modular Furniture Specialist', rate: 550, phone: '+919826001003', exp: 15, loc: 'Kolar Road Ward 80, Bhopal', lat: 23.1782, lng: 77.4190 },
  { id: '11111111-1111-4001-a111-000000000004', name: 'Kailash Rangsaaz Painting Cooperative', cat: 'painting', title: 'Eco-Friendly Home & Wall Painting', rate: 500, phone: '+919826001004', exp: 11, loc: 'TT Nagar New Market, Bhopal', lat: 23.2410, lng: 77.3995 },
  { id: '11111111-1111-4001-a111-000000000005', name: 'Shanta Devi Mahila Sahakari Griha Seva', cat: 'domestic_help', title: 'Verified Housekeeper & Domestic Assistant', rate: 350, phone: '+919826001005', exp: 7, loc: 'Shahpura Sector B, Bhopal', lat: 23.1932, lng: 77.4320 },
  { id: '11111111-1111-4001-a111-000000000006', name: 'Seva Sankalp Elder & Patient Care', cat: 'caregiving', title: 'Certified Geriatric & Nursing Care Assistant', rate: 600, phone: '+919826001006', exp: 8, loc: 'Hoshangabad Road, Bhopal', lat: 23.1901, lng: 77.4523 },
  { id: '11111111-1111-4001-a111-000000000007', name: 'Bhopal Sahakari Driver Association', cat: 'driver', title: 'Professional Chauffeur & Heavy/Light Vehicle Driver', rate: 500, phone: '+919826001007', exp: 10, loc: 'Indrapuri Sector C, Bhopal', lat: 23.2505, lng: 77.4698 },
  { id: '11111111-1111-4001-a111-000000000008', name: 'Harit Kranti Mali & Landscape Samiti', cat: 'gardening', title: 'Horticulture, Lawn Care & Terrace Gardening', rate: 350, phone: '+919826001008', exp: 14, loc: 'Bawadiya Kalan, Bhopal', lat: 23.1812, lng: 77.4501 },
  { id: '11111111-1111-4001-a111-000000000009', name: 'Swachh Shramik Deep Clean Cooperative', cat: 'cleaning', title: 'Mechanized Deep House & Water Tank Cleaning', rate: 450, phone: '+919826001009', exp: 6, loc: 'Govindpura Industrial Ward, Bhopal', lat: 23.2612, lng: 77.4520 },
  { id: '11111111-1111-4001-a111-000000000010', name: 'CoolTech Appliance & AC Cooperative', cat: 'appliance_repair', title: 'Inverter AC, RO, Fridge & Geyser Technician', rate: 450, phone: '+919826001010', exp: 9, loc: 'Ayodhya Bypass, Bhopal', lat: 23.2750, lng: 77.4680 },
  { id: '11111111-1111-4001-a111-000000000011', name: 'Bhopal Rajmistri Shramik Sangh', cat: 'masonry', title: 'Civil Masonry, Plaster, Tile & Leakage Repair', rate: 550, phone: '+919826001011', exp: 16, loc: 'Karond Chauraha, Bhopal', lat: 23.2980, lng: 77.4010 }
];

async function seedAllTrades() {
  const hash = await bcrypt.hash('Password@123', 10);
  const societyId = '33333333-3333-4333-a333-333333333333';

  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    const padded = String(i + 1).padStart(12, '0');
    const userId = `00000000-0000-4000-b000-${padded}`;
    const email = `worker.${t.cat}@sahkaari.in`;
    const regNo = `MEM-BPL-2026-${String(i + 100).padStart(4, '0')}`;
    const welfareId = `WLF-2026-${String(i + 8000).padStart(5, '0')}`;
    const desc = `${t.title} affiliated with Bhopal Primary Labour Cooperative. Government verified and covered under Pradhan Mantri Suraksha Bima Yojana.`;

    // 1. Create / Update User
    await db.query(
      'INSERT INTO users (id, name, email, phone, role, password_hash, society_id) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name = $2, phone = $4',
      [userId, t.name, email, t.phone, 'contractor', hash, societyId]
    );

    // 2. Create / Update Contractor Profile
    await db.query(
      `INSERT INTO contractors (
        id, user_id, business_name, category, categories, description, daily_rate, 
        experience_years, location_text, lat, lng, latitude, longitude, 
        is_verified, is_featured, society_id, member_registration_no, welfare_id, 
        skills_certified, skill_certification_body
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $10, $11, true, true, $12, $13, $14, true, 'National Council for Cooperative Training (NCCT)')
      ON CONFLICT (id) DO UPDATE SET 
        business_name = $3, category = $4, categories = $5, description = $6, 
        daily_rate = $7, experience_years = $8, location_text = $9, 
        lat = $10, lng = $11, latitude = $10, longitude = $11, is_verified = true,
        member_registration_no = $13, welfare_id = $14`,
      [
        t.id,
        userId,
        t.name,
        t.cat,
        [t.cat],
        desc,
        t.rate,
        t.exp,
        t.loc,
        t.lat,
        t.lng,
        societyId,
        regNo,
        welfareId
      ]
    );

    // 3. Create / Update Insurance Policy
    await db.query(
      `INSERT INTO insurance_policies (
        worker_id, policy_name, policy_number, provider, coverage_amount, coverage_details, status, valid_till
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        t.id,
        'Pradhan Mantri Suraksha Bima Yojana (Accidental Death & Disability Cover)',
        `PMSBY-SHK-${String(i + 4000).padStart(5, '0')}`,
        'National Cooperative Insurance Trust & Life Assurance',
        500000.00,
        'Includes ₹5,00,000 accidental disability cover, emergency family medical protection, and workplace safety assurance.',
        'ACTIVE',
        '2027-05-31'
      ]
    );
  }

  console.log('Seeded all 11 household & community trades and PMSBY policies successfully!');
}

seedAllTrades().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
