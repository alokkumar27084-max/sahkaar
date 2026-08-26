const db = require('../src/config/db');
const bcrypt = require('bcrypt');

async function seedDemoUsers() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@sahkaar.in');
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'Password@123');

  if (isProduction && (!adminEmail || !adminPassword)) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in production');
  }

  const hash = await bcrypt.hash(adminPassword, 12);

  if (isProduction) {
    await db.query(
      'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = $2, email = $3, phone = $4, role = $5, password_hash = $6',
      ['00000000-0000-0000-0000-000000000004', process.env.ADMIN_NAME || 'National Cooperative Admin', adminEmail, process.env.ADMIN_PHONE || null, 'admin', hash]
    );
    console.log(`Production admin account seeded for ${adminEmail}`);
    return;
  }
  
  // 1. Customer
  await db.query(
    'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET password_hash = $6, name = $2',
    ['00000000-0000-0000-0000-000000000001', 'Demo Citizen (Bhopal)', 'customer@sahkaar.in', '+919876543210', 'customer', hash]
  );

  // 2. Society Admin
  await db.query(
    'INSERT INTO users (id, name, email, phone, role, society_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET password_hash = $7, society_id = $6',
    ['00000000-0000-0000-0000-000000000002', 'Bhopal Society Secretary', 'society_admin@sahkaar.in', '+919800011111', 'society_admin', '33333333-3333-4333-a333-333333333333', hash]
  );

  // 3. Federation Admin
  await db.query(
    'INSERT INTO users (id, name, email, phone, role, federation_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET password_hash = $7, federation_id = $6',
    ['00000000-0000-0000-0000-000000000003', 'State Federation Director', 'federation_admin@sahkaar.in', '+919800022222', 'federation_admin', '11111111-1111-4111-a111-111111111111', hash]
  );

  // 4. Admin
  await db.query(
    'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET password_hash = $6',
    ['00000000-0000-0000-0000-000000000004', 'National Cooperative Admin', 'admin@sahkaar.in', '+919999999999', 'admin', hash]
  );

  console.log('Demo accounts seeded successfully!');
}

seedDemoUsers().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
