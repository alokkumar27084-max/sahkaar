const subscriptionModel = require('../models/subscriptionModel');
const db = require('../config/db');
const { isMockPaymentMode, verifyPaymentSignature } = require('../utils/razorpay');

const PLAN_PRICES = {
  verified_badge: 49900,
  priority_listing: 39900,
  premium: 249900,
};

// Helper: create Razorpay order
async function createRazorpayOrder(amount, receipt) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return { id: `mock_sub_order_${Date.now()}`, amount, currency: 'INR', receipt };
  }
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return rz.orders.create({ amount, currency: 'INR', receipt });
}

// POST /api/subscriptions/purchase — Buy a subscription
exports.purchaseSubscription = async (req, res, next) => {
  try {
    const { plan_type } = req.body;
    if (!PLAN_PRICES[plan_type]) {
      return res.status(400).json({ ok: false, message: 'Invalid plan type' });
    }

    // Get contractor ID for user
    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    if (!rows[0]) {
      return res.status(400).json({ ok: false, message: 'Contractor profile required' });
    }
    const contractor_id = rows[0].id;

    let price = PLAN_PRICES[plan_type];

    const order = await createRazorpayOrder(price, `sub_${contractor_id}_${Date.now()}`);
    await subscriptionModel.recordPaymentOrder({
      contractor_id,
      plan_type,
      amount_paise: price,
      razorpay_order_id: order.id,
    });

    res.json({
      ok: true,
      razorpayOrderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID || 'mock_key_only_for_dev',
      amount: price,
      currency: 'INR'
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/subscriptions/verify — Verify Razorpay payment signature
exports.verifyPurchase = async (req, res, next) => {
  try {
    const { plan_type, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;
    if (!PLAN_PRICES[plan_type] || !razorpay_order_id) {
      return res.status(400).json({ ok: false, message: 'Invalid subscription payment data' });
    }

    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    if (!rows[0]) return res.status(400).json({ ok: false, message: 'Contractor profile required' });
    const contractor_id = rows[0].id;

    const mockMode = isMockPaymentMode();
    if (!mockMode && !verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })) {
      return res.status(400).json({ ok: false, message: 'Payment verification failed' });
    }

    const paymentId = mockMode ? (razorpay_payment_id || `mock_sub_pay_${Date.now()}`) : razorpay_payment_id;
    const sub = await subscriptionModel.activateFromPaymentOrder({
      contractor_id,
      plan_type,
      razorpay_order_id,
      razorpay_payment_id: paymentId,
    });

    // Update contractor profile flags
    if (plan_type === 'verified_badge' || plan_type === 'premium') {
      await db.query(`UPDATE contractors SET is_verified = true WHERE id = $1`, [contractor_id]);
    }
    if (plan_type === 'priority_listing' || plan_type === 'premium') {
      await db.query(`UPDATE contractors SET is_featured = true WHERE id = $1`, [contractor_id]);
    }

    res.json({ ok: true, subscription: sub });
  } catch (err) {
    return next(err);
  }
};

// GET /api/subscriptions/status — Contractor current subscription status and leads remaining
exports.getStatus = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    if (!rows[0]) return res.status(400).json({ ok: false, message: 'Contractor profile required' });
    const contractor_id = rows[0].id;

    const [activeSub, verified, priority, leadStatus, leadHistory, leadCount] = await Promise.all([
      subscriptionModel.getActiveSubscription(contractor_id),
      subscriptionModel.hasVerifiedBadge(contractor_id),
      subscriptionModel.hasPriorityListing(contractor_id),
      subscriptionModel.canReceiveLead(contractor_id),
      subscriptionModel.getLeadHistory(contractor_id, 10),
      subscriptionModel.getLeadCount(contractor_id),
    ]);

    res.json({
      ok: true,
      contractor_id,
      subscription: {
        plan_active: !!activeSub,
        plan_type: activeSub ? activeSub.plan_type : null,
        expires_at: activeSub ? activeSub.expires_at : null,
        leads_used: leadCount || 0,
        has_verified_badge: verified,
        has_priority_listing: priority,
      },
      active_subscription: activeSub,
      has_verified_badge: verified,
      has_priority_listing: priority,
      lead_status: leadStatus,
      lead_history: leadHistory,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/subscriptions/history — Contractor subscription billing history
exports.getHistory = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    if (!rows[0]) return res.status(400).json({ ok: false, message: 'Contractor profile required' });
    const history = await subscriptionModel.getSubscriptionHistory(rows[0].id);
    res.json({ ok: true, history });
  } catch (err) {
    return next(err);
  }
};

// ── Disputes ──

// POST /api/subscriptions/disputes — File a dispute (free resolution service)
exports.fileDispute = async (req, res, next) => {
  try {
    const { booking_type, booking_ref_id, reason, description, evidence_urls } = req.body;
    if (!booking_type || !booking_ref_id || !reason) {
      return res.status(400).json({ ok: false, message: 'booking_type, booking_ref_id, and reason are required' });
    }

    const dispute = await subscriptionModel.createDispute({
      reporter_id: req.user.id,
      booking_type,
      booking_ref_id,
      reason,
      description,
      evidence_urls,
    });

    res.status(201).json({ ok: true, dispute });
  } catch (err) {
    return next(err);
  }
};

// GET /api/subscriptions/disputes/me — Get user's disputes
exports.getMyDisputes = async (req, res, next) => {
  try {
    const disputes = await subscriptionModel.getDisputesByUser(req.user.id);
    res.json({ ok: true, disputes });
  } catch (err) {
    return next(err);
  }
};
