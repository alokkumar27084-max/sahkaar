// ─────────────────────────────────────────────
// quickBookingModel.js — Quick Service Booking CRUD
// ─────────────────────────────────────────────
const db = require('../config/db');

const TABLE = 'quick_bookings';

exports.create = async ({ customer_id, contractor_id, service_name, service_details, scheduled_date, scheduled_time_slot, service_price, customer_address, customer_lat, customer_lng, booking_fee_order_id }) => {
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
