require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../src/config/db');

// Clearly labelled sample data for local demonstrations and judging presentations.
// It is idempotent and only updates records with the DEMO-IND identifiers below.
const locations = [
  { city: 'Bhopal', state: 'Madhya Pradesh', societyId: 'b2c3d4e5-0001-4000-8000-000000000001', lat: 23.2599, lng: 77.4126, worker: 'Demo Bhopal Electrical Cooperative', category: 'electrical', rate: 550 },
  { city: 'Indore', state: 'Madhya Pradesh', societyId: 'b2c3d4e5-0002-4000-8000-000000000002', lat: 22.7196, lng: 75.8577, worker: 'Demo Indore Plumbing Cooperative', category: 'plumbing', rate: 500 },
  { city: 'Mumbai', state: 'Maharashtra', societyId: 'b2c3d4e5-0003-4000-8000-000000000003', lat: 19.0760, lng: 72.8777, worker: 'Demo Mumbai Home Care Cooperative', category: 'cleaning', rate: 700 },
  { city: 'Pune', state: 'Maharashtra', societyId: 'b2c3d4e5-0004-4000-8000-000000000004', lat: 18.5204, lng: 73.8567, worker: 'Demo Pune Carpenter Cooperative', category: 'carpentry', rate: 650 },
  { city: 'New Delhi', state: 'Delhi', societyId: 'b2c3d4e5-0005-4000-8000-000000000005', lat: 28.6139, lng: 77.2090, worker: 'Demo Delhi Appliance Cooperative', category: 'appliance_repair', rate: 750 },
  { city: 'Jaipur', state: 'Rajasthan', societyId: 'b2c3d4e5-0006-4000-8000-000000000006', lat: 26.9124, lng: 75.7873, worker: 'Demo Jaipur Painting Cooperative', category: 'painting', rate: 575 },
  { city: 'Bengaluru', state: 'Karnataka', societyId: 'b2c3d4e5-0007-4000-8000-000000000007', lat: 12.9716, lng: 77.5946, worker: 'Demo Bengaluru Care Cooperative', category: 'caregiving', rate: 850 },
  { city: 'Lucknow', state: 'Uttar Pradesh', societyId: 'b2c3d4e5-0008-4000-8000-000000000008', lat: 26.8467, lng: 80.9462, worker: 'Demo Lucknow Garden Cooperative', category: 'gardening', rate: 475 },
  { city: 'Bhopal', state: 'Madhya Pradesh', societyId: '33333333-3333-4333-a333-333333333333', lat: 23.2383, lng: 77.4000, worker: 'Demo TT Nagar Electrical Cooperative', category: 'electrical', rate: 575 },
  { city: 'Bhopal', state: 'Madhya Pradesh', societyId: '33333333-3333-4333-a333-333333333333', lat: 23.2156, lng: 77.4305, worker: 'Demo Arera Home Care Cooperative', category: 'cleaning', rate: 525 },
  { city: 'Indore', state: 'Madhya Pradesh', societyId: '55555555-5555-4555-a555-555555555555', lat: 22.7533, lng: 75.8937, worker: 'Demo Vijay Nagar Plumbing Cooperative', category: 'plumbing', rate: 525 },
];

const idFor = (group, index) => `d0e${group}0000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(index + 1).padStart(12, '0')}`;

async function seedIndiaDemoData() {
  const passwordHash = await bcrypt.hash('Demo@12345', 10);
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, location] of locations.entries()) {
      const workerUserId = idFor(1, index);
      const customerId = idFor(2, index);
      const workerId = idFor(3, index);
      const bookingId = idFor(4, index);

      await client.query(
        `INSERT INTO users (id, name, email, phone, role, password_hash, society_id)
         VALUES ($1, $2, $3, $4, 'contractor', $5, $6)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone, society_id=EXCLUDED.society_id`,
        [workerUserId, location.worker, `demo.worker.${index + 1}@sahkaar.test`, `+91910000${String(index + 1).padStart(4, '0')}`, passwordHash, location.societyId]
      );
      await client.query(
        `INSERT INTO users (id, name, email, phone, role, password_hash)
         VALUES ($1, $2, $3, $4, 'customer', $5)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, phone=EXCLUDED.phone`,
        [customerId, `Demo Customer ${location.city}`, `demo.customer.${index + 1}@sahkaar.test`, `+91920000${String(index + 1).padStart(4, '0')}`, passwordHash]
      );
      await client.query(
        `INSERT INTO contractors (
          id, user_id, business_name, category, categories, services, description, daily_rate,
          experience_years, location_text, lat, lng, latitude, longitude, society_id,
          member_registration_no, is_verified, verification_status, skills_certified,
          skill_certification_body, is_available, is_featured, service_radius_km, rating, review_count
        ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,7,$8,$9,$10,$9,$10,$11,$12,true,'verified',true,
          'Demo NCCT cooperative training record',true,true,30,4.7,18)
        ON CONFLICT (id) DO UPDATE SET business_name=EXCLUDED.business_name, category=EXCLUDED.category,
          categories=EXCLUDED.categories, daily_rate=EXCLUDED.daily_rate, location_text=EXCLUDED.location_text,
          lat=EXCLUDED.lat, lng=EXCLUDED.lng, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude,
          society_id=EXCLUDED.society_id, is_verified=true, verification_status='verified', is_available=true`,
        [workerId, workerUserId, location.worker, location.category, [location.category],
          `Synthetic demonstration worker record for ${location.city}. It is clearly marked as demo data.`,
          location.rate, `${location.city}, ${location.state}`, location.lat, location.lng, location.societyId,
          `DEMO-IND-${String(index + 1).padStart(3, '0')}`]
      );
      await client.query(
        `INSERT INTO bookings (
          id, customer_id, contractor_id, service_category, service_tier, payment_plan, status,
          amount, estimated_project_value, escrow_amount, payment_status, scheduled_for,
          address_label, location_address, location_lat, location_lng, service_lat, service_lng,
          service_locality, notes, is_emergency, priority_level, workflow_status, completed_at
        ) VALUES ($1,$2,$3,$4,'quick','full_escrow','COMPLETED',$5,$5,$5,'RELEASED',NOW() - ($6 || ' days')::interval,
          $7,$7,$8,$9,$8,$9,$10,'DEMO-IND synthetic completed booking',($11 % 4 = 0),'standard','completed',NOW() - ($6 || ' days')::interval)
        ON CONFLICT (id) DO UPDATE SET amount=EXCLUDED.amount, status='COMPLETED', payment_status='RELEASED',
          workflow_status='completed', service_locality=EXCLUDED.service_locality, completed_at=EXCLUDED.completed_at`,
        [bookingId, customerId, workerId, location.category, location.rate * 2, String(index + 2),
          `${location.city} demo service address`, location.lat, location.lng, location.city, index + 1]
      );

      const ledgerEntries = [
        ['worker_payout', Math.round(location.rate * 1.55), 'worker payout'],
        ['welfare_contribution', Math.round(location.rate * 0.12), 'welfare contribution'],
        ['federation_share', Math.round(location.rate * 0.10), 'federation share'],
      ];
      for (const [entryIndex, [entryType, amount, label]] of ledgerEntries.entries()) {
        await client.query(
          `INSERT INTO cooperative_ledger_entries (id, booking_id, society_id, federation_id, worker_id, entry_type, amount, reference)
           SELECT $1,$2,s.id,s.federation_id,$3,$4,$5,$6 FROM cooperative_societies s WHERE s.id=$7
           ON CONFLICT (id) DO NOTHING`,
          [idFor(5 + entryIndex, index), bookingId, workerId, entryType, amount, `DEMO-IND-${index + 1}-${label}`, location.societyId]
        );
      }
    }

    await client.query(`DELETE FROM demand_forecast_snapshots WHERE data_source='demo' AND locality = ANY($1::text[])`, [locations.map((item) => item.city)]);
    for (const [index, location] of locations.entries()) {
      for (let day = 7; day >= 1; day -= 1) {
        const actual = 4 + ((index + day) % 7);
        await client.query(
          `INSERT INTO demand_forecast_snapshots (locality, service_category, forecast_date, predicted_demand, actual_demand, confidence_score, seasonal_factor, data_source)
           VALUES ($1,$2,CURRENT_DATE - ($3 || ' days')::interval,$4,$5,0.86,1.05,'demo')`,
          [location.city, location.category, String(day), actual + 1, actual]
        );
      }
    }
    await client.query('COMMIT');
    console.log(`Seeded ${locations.length} labelled India demo workers, bookings, ledger entries, and forecast history.`);
    console.log('Demo login: demo.customer.1@sahkaar.test / Demo@12345');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedIndiaDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('India demo seed failed:', error.message);
    process.exit(1);
  });
