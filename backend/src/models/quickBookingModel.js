// ─────────────────────────────────────────────
// quickBookingModel.js — Quick Service Booking CRUD
// ─────────────────────────────────────────────
const db = require('../config/db');

const TABLE = 'quick_bookings';

async function ensureQuickBookingsSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
      service_name VARCHAR(255) NOT NULL,
      service_details JSONB,
      booking_fee_order_id VARCHAR(255),
      booking_fee_payment_id VARCHAR(255),
      booking_fee_status VARCHAR(20) DEFAULT 'UNPAID'
        CHECK (booking_fee_status IN ('UNPAID','PAID','REFUNDED')),
      scheduled_date DATE NOT NULL,
      scheduled_time_slot VARCHAR(50),
      status VARCHAR(20) DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','CONFIRMED','IN_PROGRESS',
                          'COMPLETED','CANCELLED_BY_CUSTOMER',
                          'CANCELLED_BY_CONTRACTOR','DISPUTED')),
      service_price NUMERIC(10,2),
      final_price NUMERIC(10,2),
      payment_method VARCHAR(20) DEFAULT 'CASH'
        CHECK (payment_method IN ('CASH','ONLINE','UPI')),
      customer_address TEXT,
      customer_lat DOUBLE PRECISION,
      customer_lng DOUBLE PRECISION,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      review_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(() => {});

  await db.query(`
    ALTER TABLE ${TABLE}
      ADD COLUMN IF NOT EXISTS service_details JSONB,
      ADD COLUMN IF NOT EXISTS booking_fee_order_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS booking_fee_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS booking_fee_status VARCHAR(20) DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS scheduled_date DATE,
      ADD COLUMN IF NOT EXISTS scheduled_time_slot VARCHAR(50),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS service_price NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS final_price NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'CASH',
      ADD COLUMN IF NOT EXISTS customer_address TEXT,
      ADD COLUMN IF NOT EXISTS customer_lat DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS customer_lng DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS rating INT,
      ADD COLUMN IF NOT EXISTS review_text TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `).catch(() => {});

  await db.query(`CREATE INDEX IF NOT EXISTS idx_quick_bookings_customer ON ${TABLE}(customer_id);`).catch(() => {});
  await db.query(`CREATE INDEX IF NOT EXISTS idx_quick_bookings_contractor ON ${TABLE}(contractor_id);`).catch(() => {});
  await db.query(`CREATE INDEX IF NOT EXISTS idx_quick_bookings_status ON ${TABLE}(status);`).catch(() => {});
}

exports.ensureQuickBookingsSchema = ensureQuickBookingsSchema;

exports.create = async ({ customer_id, contractor_id, service_name, service_details, scheduled_date, scheduled_time_slot, service_price, customer_address, customer_lat, customer_lng, booking_fee_order_id }) => {
  await ensureQuickBookingsSchema();

  const { rows } = await db.query(
    `INSERT INTO ${TABLE}
       (customer_id, contractor_id, service_name, service_details,
        scheduled_date, scheduled_time_slot, service_price,
        customer_address, customer_lat, customer_lng, booking_fee_order_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [customer_id, contractor_id, service_name, JSON.stringify(service_details || {}),
     scheduled_date, scheduled_time_slot, service_price,
     customer_address, customer_lat, customer_lng, booking_fee_order_id]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT qb.*, u.name AS customer_name, u.phone AS customer_phone,
            c.business_name AS contractor_name, cu.phone AS contractor_phone,
            c.photo_url AS contractor_photo
     FROM ${TABLE} qb
     JOIN users u ON qb.customer_id = u.id
     JOIN contractors c ON qb.contractor_id = c.id
     JOIN users cu ON c.user_id = cu.id
     WHERE qb.id = $1`,
    [id]
  );
  return rows[0];
};

exports.findByCustomer = async (customer_id) => {
  const { rows } = await db.query(
    `SELECT qb.*, c.business_name AS contractor_name, c.photo_url AS contractor_photo,
            cu.phone AS contractor_phone
     FROM ${TABLE} qb
     JOIN contractors c ON qb.contractor_id = c.id
     JOIN users cu ON c.user_id = cu.id
     WHERE qb.customer_id = $1
     ORDER BY qb.created_at DESC`,
    [customer_id]
  );
  return rows;
};

exports.findByContractor = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT qb.*, u.name AS customer_name, u.phone AS customer_phone
     FROM ${TABLE} qb
     JOIN users u ON qb.customer_id = u.id
     WHERE qb.contractor_id = $1
     ORDER BY qb.created_at DESC`,
    [contractor_id]
  );
  return rows;
};

exports.updateStatus = async (id, status) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE} SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, status]
  );
  return rows[0];
};

exports.setBookingFeePaid = async (id, payment_id) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET booking_fee_status = 'PAID', booking_fee_payment_id = $2,
         status = 'CONFIRMED', updated_at = NOW()
     WHERE id = $1 AND booking_fee_status = 'UNPAID' RETURNING *`,
    [id, payment_id]
  );
  return rows[0];
};

exports.addReview = async (id, rating, review_text) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET rating = $2, review_text = $3, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, rating, review_text]
  );
  return rows[0];
};

exports.setFinalPrice = async (id, final_price, payment_method) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET final_price = $2, payment_method = $3, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, final_price, payment_method]
  );
  return rows[0];
};
