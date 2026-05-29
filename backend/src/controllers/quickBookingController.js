// ─────────────────────────────────────────────
// quickBookingController.js — Quick service booking flow
// ─────────────────────────────────────────────
const quickBookingModel = require('../models/quickBookingModel');
const subscriptionModel = require('../models/subscriptionModel');
const notificationService = require('../services/notificationService');

const BOOKING_FEE = 3000; // ₹30 in paise

async function createRazorpayOrder(amount, receipt) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return { id: `mock_order_${Date.now()}`, amount, currency: 'INR', receipt };
  }
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return rz.orders.create({ amount, currency: 'INR', receipt });
}

// POST /api/quick-bookings
exports.createBooking = async (req, res) => {
  try {
    const { contractor_id, service_name, service_details, scheduled_date,
            scheduled_time_slot, service_price, customer_address, customer_lat, customer_lng } = req.body;

    if (!contractor_id || !service_name || !scheduled_date) {
      return res.status(400).json({ ok: false, message: 'contractor_id, service_name, and scheduled_date are required' });
    }

    // Check lead limit
    const leadCheck = await subscriptionModel.canReceiveLead(contractor_id);
    if (!leadCheck.allowed) {
      return res.status(200).json({
        ok: true,
        lead_blocked: true,
        message: 'This contractor has reached their free lead limit.'
      });
    }

    const order = await createRazorpayOrder(BOOKING_FEE, `qb_${Date.now()}`);

    const booking = await quickBookingModel.create({
      customer_id: req.user.id,
      contractor_id,
      service_name,
      service_details,
      scheduled_date,
      scheduled_time_slot,
      service_price,
      customer_address,
      customer_lat,
      customer_lng,
      booking_fee_order_id: order.id,
    });

    await subscriptionModel.recordLead(contractor_id, req.user.id, 'booking');

    res.json({
      ok: true,
      booking,
      razorpay_order: {
        id: order.id,
        amount: BOOKING_FEE,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'mock_key',
      }
    });
  } catch (err) {
    console.error('createQuickBooking error:', err);
    res.status(500).json({ ok: false, message: 'Failed to create booking' });
  }
};

// POST /api/quick-bookings/verify
exports.verifyBookingFee = async (req, res) => {
  try {
    const { booking_id, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;

    const booking = await quickBookingModel.findById(booking_id);
    if (!booking) return res.status(404).json({ ok: false, message: 'Booking not found' });

    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const crypto = require('crypto');
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== razorpay_signature) {
        return res.status(400).json({ ok: false, message: 'Payment verification failed' });
      }
    }

    const updated = await quickBookingModel.setBookingFeePaid(booking_id, razorpay_payment_id || `mock_pay_${Date.now()}`);

    try {
      await notificationService.notify(booking.contractor_id, {
        type: 'quick_booking',
        message: `New quick service booking: ${booking.service_name} on ${new Date(booking.scheduled_date).toLocaleDateString()}`,
      });
    } catch (e) { console.warn('QS notification failed:', e.message); }

    res.json({ ok: true, booking: updated });
  } catch (err) {
    console.error('verifyBookingFee error:', err);
    res.status(500).json({ ok: false, message: 'Verification failed' });
  }
};

// GET /api/quick-bookings/me
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await quickBookingModel.findByCustomer(req.user.id);
    res.json({ ok: true, bookings });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch bookings' });
  }
};

// GET /api/quick-bookings/contractor/me
exports.getContractorBookings = async (req, res) => {
  try {
    const db = require('../config/db');
    const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
    if (!rows[0]) return res.json({ ok: true, bookings: [] });
    const bookings = await quickBookingModel.findByContractor(rows[0].id);
    res.json({ ok: true, bookings });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to fetch bookings' });
  }
};

// PUT /api/quick-bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await quickBookingModel.updateStatus(id, status);
    if (!updated) return res.status(404).json({ ok: false, message: 'Booking not found' });
    res.json({ ok: true, booking: updated });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to update status' });
  }
};

// POST /api/quick-bookings/:id/review
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const updated = await quickBookingModel.addReview(id, rating, review_text);
    if (!updated) return res.status(404).json({ ok: false, message: 'Booking not found' });
    res.json({ ok: true, booking: updated });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Failed to add review' });
  }
};
