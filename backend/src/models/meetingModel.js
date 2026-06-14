// ─────────────────────────────────────────────
// meetingModel.js — Meeting booking CRUD
// ─────────────────────────────────────────────
const db = require('../config/db');

const TABLE = 'meetings';

exports.create = async ({ customer_id, contractor_id, proposed_date, proposed_time_slot, proposed_location, proposed_lat, proposed_lng, meeting_type, customer_note, service_category, booking_fee_order_id }) => {
  const { rows } = await db.query(
    `INSERT INTO ${TABLE}
       (customer_id, contractor_id, proposed_date, proposed_time_slot,
        proposed_location, proposed_lat, proposed_lng, meeting_type,
        customer_note, service_category, booking_fee_order_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [customer_id, contractor_id, proposed_date, proposed_time_slot,
     proposed_location, proposed_lat, proposed_lng, meeting_type || 'in_person',
     customer_note, service_category, booking_fee_order_id]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT m.*, u.name AS customer_name, u.phone AS customer_phone,
            c.business_name AS contractor_name, cu.phone AS contractor_phone
     FROM ${TABLE} m
     JOIN users u ON m.customer_id = u.id
     JOIN contractors c ON m.contractor_id = c.id
     JOIN users cu ON c.user_id = cu.id
     WHERE m.id = $1`,
    [id]
  );
  return rows[0];
};

exports.findByCustomer = async (customer_id) => {
  const { rows } = await db.query(
    `SELECT m.*, c.business_name AS contractor_name, c.photo_url AS contractor_photo,
            c.category AS contractor_category
     FROM ${TABLE} m
     JOIN contractors c ON m.contractor_id = c.id
     WHERE m.customer_id = $1
     ORDER BY m.created_at DESC`,
    [customer_id]
  );
  return rows;
};

exports.findByContractor = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT m.*, u.name AS customer_name, u.phone AS customer_phone
     FROM ${TABLE} m
     JOIN users u ON m.customer_id = u.id
     WHERE m.contractor_id = $1
     ORDER BY m.created_at DESC`,
    [contractor_id]
  );
  return rows;
};

exports.updateStatus = async (id, status, note) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET status = $2, contractor_note = COALESCE($3, contractor_note), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, status, note]
  );
  return rows[0];
};

exports.reschedule = async (id, new_date, new_time_slot, note) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET proposed_date = $2, proposed_time_slot = $3, status = 'RESCHEDULED',
         contractor_note = COALESCE($4, contractor_note), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, new_date, new_time_slot, note]
  );
  return rows[0];
};

exports.setBookingFeePaid = async (id, payment_id) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET booking_fee_status = 'PAID', booking_fee_payment_id = $2, updated_at = NOW()
     WHERE id = $1 AND booking_fee_status = 'UNPAID' RETURNING *`,
    [id, payment_id]
  );
  return rows[0];
};

exports.setBookingFeeRefunded = async (id) => {
  const { rows } = await db.query(
    `UPDATE ${TABLE}
     SET booking_fee_status = 'REFUNDED', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0];
};
