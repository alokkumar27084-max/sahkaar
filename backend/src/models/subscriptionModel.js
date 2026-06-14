// ─────────────────────────────────────────────
// subscriptionModel.js — Subscription & Lead Tracking
// Revenue: Verification badge, priority listing, 5 free leads
// ─────────────────────────────────────────────
const db = require('../config/db');

// ── Subscriptions ──

exports.createSubscription = async ({ contractor_id, plan_type, amount_paid, razorpay_order_id, razorpay_payment_id, duration_days }) => {
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + (duration_days || 30));

  const { rows } = await db.query(
    `INSERT INTO subscriptions
       (contractor_id, plan_type, amount_paid, razorpay_order_id, razorpay_payment_id, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [contractor_id, plan_type, amount_paid, razorpay_order_id, razorpay_payment_id, expires_at]
  );
  return rows[0];
};

exports.recordPaymentOrder = async ({ contractor_id, plan_type, amount_paise, razorpay_order_id }) => {
  const { rows } = await db.query(
    `INSERT INTO subscription_payment_orders
       (contractor_id, plan_type, amount_paise, razorpay_order_id)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [contractor_id, plan_type, amount_paise, razorpay_order_id]
  );
  return rows[0];
};

exports.activateFromPaymentOrder = async ({ contractor_id, plan_type, razorpay_order_id, razorpay_payment_id }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      `SELECT * FROM subscription_payment_orders
       WHERE contractor_id = $1 AND plan_type = $2 AND razorpay_order_id = $3
       FOR UPDATE`,
      [contractor_id, plan_type, razorpay_order_id]
    );
    const order = orderResult.rows[0];
    if (!order) {
      const error = new Error('Subscription payment order not found');
      error.status = 400;
      throw error;
    }

    if (order.consumed_at) {
      const existing = await client.query(
        `SELECT * FROM subscriptions
         WHERE contractor_id = $1 AND razorpay_order_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [contractor_id, razorpay_order_id]
      );
      await client.query('COMMIT');
      return existing.rows[0] || null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const subscription = await client.query(
      `INSERT INTO subscriptions
         (contractor_id, plan_type, amount_paid, razorpay_order_id, razorpay_payment_id, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [contractor_id, plan_type, Number(order.amount_paise) / 100, razorpay_order_id, razorpay_payment_id, expiresAt]
    );
    await client.query(
      `UPDATE subscription_payment_orders SET consumed_at = NOW() WHERE id = $1`,
      [order.id]
    );
    await client.query('COMMIT');
    return subscription.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

exports.getActiveSubscription = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT * FROM subscriptions
     WHERE contractor_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [contractor_id]
  );
  return rows[0] || null;
};

exports.getSubscriptionHistory = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT * FROM subscriptions WHERE contractor_id = $1 ORDER BY created_at DESC`,
    [contractor_id]
  );
  return rows;
};

exports.expireSubscriptions = async () => {
  const { rowCount } = await db.query(
    `UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at <= NOW()`
  );
  return rowCount;
};

exports.hasVerifiedBadge = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM subscriptions
     WHERE contractor_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
       AND plan_type IN ('verified_badge', 'premium')`,
    [contractor_id]
  );
  return parseInt(rows[0].cnt) > 0;
};

exports.hasPriorityListing = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM subscriptions
     WHERE contractor_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
       AND plan_type IN ('priority_listing', 'premium')`,
    [contractor_id]
  );
  return parseInt(rows[0].cnt) > 0;
};

// ── Lead Tracking ──

const FREE_LEAD_LIMIT = 5;

exports.recordLead = async (contractor_id, customer_id, lead_type) => {
  const { rows } = await db.query(
    `INSERT INTO contractor_leads (contractor_id, customer_id, lead_type)
     VALUES ($1,$2,$3) RETURNING *`,
    [contractor_id, customer_id, lead_type]
  );
  return rows[0];
};

exports.getLeadCount = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total FROM contractor_leads WHERE contractor_id = $1`,
    [contractor_id]
  );
  return parseInt(rows[0].total);
};

exports.getMonthlyLeadCount = async (contractor_id) => {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS total FROM contractor_leads
     WHERE contractor_id = $1
       AND created_at >= date_trunc('month', NOW())`,
    [contractor_id]
  );
  return parseInt(rows[0].total);
};

exports.canReceiveLead = async (contractor_id) => {
  // Check if contractor has active subscription
  const sub = await exports.getActiveSubscription(contractor_id);
  if (sub) return { allowed: true, reason: 'subscribed' };

  // Check free lead count
  const count = await exports.getLeadCount(contractor_id);
  if (count < FREE_LEAD_LIMIT) {
    return { allowed: true, reason: 'free', remaining: FREE_LEAD_LIMIT - count };
  }

  return { allowed: false, reason: 'limit_reached', limit: FREE_LEAD_LIMIT };
};

exports.getLeadHistory = async (contractor_id, limit = 50) => {
  const { rows } = await db.query(
    `SELECT cl.*, u.name AS customer_name
     FROM contractor_leads cl
     LEFT JOIN users u ON cl.customer_id = u.id
     WHERE cl.contractor_id = $1
     ORDER BY cl.created_at DESC LIMIT $2`,
    [contractor_id, limit]
  );
  return rows;
};

// ── Disputes ──

exports.createDispute = async ({ reporter_id, booking_type, booking_ref_id, reason, description, evidence_urls }) => {
  const { rows } = await db.query(
    `INSERT INTO disputes (reporter_id, booking_type, booking_ref_id, reason, description, evidence_urls)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [reporter_id, booking_type, booking_ref_id, reason, description, JSON.stringify(evidence_urls || [])]
  );
  return rows[0];
};

exports.getDisputesByUser = async (reporter_id) => {
  const { rows } = await db.query(
    `SELECT * FROM disputes WHERE reporter_id = $1 ORDER BY created_at DESC`,
    [reporter_id]
  );
  return rows;
};

exports.getAllDisputes = async (status) => {
  let query = `SELECT d.*, u.name AS reporter_name FROM disputes d JOIN users u ON d.reporter_id = u.id`;
  const vals = [];
  if (status) {
    query += ` WHERE d.status = $1`;
    vals.push(status);
  }
  query += ` ORDER BY d.created_at DESC`;
  const { rows } = await db.query(query, vals);
  return rows;
};

exports.resolveDispute = async (id, { status, resolution_note, resolved_by }) => {
  const { rows } = await db.query(
    `UPDATE disputes SET status=$2, resolution_note=$3, resolved_by=$4, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [id, status, resolution_note, resolved_by]
  );
  return rows[0];
};
