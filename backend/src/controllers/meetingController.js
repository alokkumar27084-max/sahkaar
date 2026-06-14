// ─────────────────────────────────────────────
// meetingController.js — Meet-first booking flow
// ─────────────────────────────────────────────
const meetingModel = require('../models/meetingModel');
const subscriptionModel = require('../models/subscriptionModel');
const notificationService = require('../services/notificationService');
const { isMockPaymentMode, verifyPaymentSignature } = require('../utils/razorpay');

const BOOKING_FEE = 3000; // ₹30 in paise

// Helper: create Razorpay order (mock if keys missing)
async function createRazorpayOrder(amount, receipt) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return { id: `mock_order_${Date.now()}`, amount, currency: 'INR', receipt };
  }
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return rz.orders.create({ amount, currency: 'INR', receipt });
}

// POST /api/meetings — Book a meeting
exports.bookMeeting = async (req, res) => {
  try {
    const { contractor_id, proposed_date, proposed_time_slot, proposed_location,
            proposed_lat, proposed_lng, meeting_type, customer_note, service_category } = req.body;

    if (!contractor_id || !proposed_date) {
      return res.status(400).json({ ok: false, message: 'contractor_id and proposed_date are required' });
    }

    // Check lead limit
    const leadCheck = await subscriptionModel.canReceiveLead(contractor_id);
    if (!leadCheck.allowed) {
      return res.status(200).json({
        ok: true,
        lead_blocked: true,
        message: 'This contractor has reached their free lead limit. They need to subscribe to receive more leads.'
      });
    }

    // Create Razorpay order for ₹30
    const order = await createRazorpayOrder(BOOKING_FEE, `meeting_${Date.now()}`);

    const meeting = await meetingModel.create({
      customer_id: req.user.id,
      contractor_id,
      proposed_date,
      proposed_time_slot,
      proposed_location,
      proposed_lat,
      proposed_lng,
      meeting_type,
      customer_note,
      service_category,
      booking_fee_order_id: order.id,
    });

    // Record lead
    await subscriptionModel.recordLead(contractor_id, req.user.id, 'booking');

    res.json({
      ok: true,
      meeting,
      razorpay_order: {
        id: order.id,
        amount: BOOKING_FEE,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'mock_key',
      }
    });
  } catch (err) {
    console.error('bookMeeting error:', err);
    res.status(500).json({ ok: false, message: 'Failed to book meeting' });
  }
};

// POST /api/meetings/verify — Verify ₹30 payment
exports.verifyPayment = async (req, res) => {
  try {
    const { meeting_id, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;

    const meeting = await meetingModel.findById(meeting_id);
    if (!meeting) return res.status(404).json({ ok: false, message: 'Meeting not found' });
    if (String(meeting.customer_id) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }
    if (!razorpay_order_id || razorpay_order_id !== meeting.booking_fee_order_id) {
      return res.status(400).json({ ok: false, message: 'Payment order does not match meeting' });
    }
    if (meeting.booking_fee_status === 'PAID') {
      return res.json({ ok: true, meeting });
    }

    const mockMode = isMockPaymentMode();
    if (!mockMode && !verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })) {
      return res.status(400).json({ ok: false, message: 'Payment verification failed' });
    }

    const paymentId = mockMode ? (razorpay_payment_id || `mock_pay_${Date.now()}`) : razorpay_payment_id;
    const updated = await meetingModel.setBookingFeePaid(meeting_id, paymentId);
    if (!updated) return res.status(409).json({ ok: false, message: 'Payment state changed; refresh and retry' });

    // Notify contractor
    try {
      await notificationService.notify(meeting.contractor_id, {
        type: 'meeting_request',
        message: `New meeting request from ${req.user.name || 'a customer'} on ${new Date(meeting.proposed_date).toLocaleDateString()}`,
      });
    } catch (e) { console.warn('Meeting notification failed:', e.message); }

    res.json({ ok: true, meeting: updated });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ ok: false, message: 'Payment verification failed' });
  }
};

// GET /api/meetings/me — My meetings
exports.getMyMeetings = async (req, res) => {
  try {
    const { role } = req.query;
    let meetings;
    if (role === 'contractor') {
      // Need contractor_id from contractors table
      const db = require('../config/db');
      const { rows } = await db.query(`SELECT id FROM contractors WHERE user_id = $1`, [req.user.id]);
      meetings = rows[0] ? await meetingModel.findByContractor(rows[0].id) : [];
    } else {
      meetings = await meetingModel.findByCustomer(req.user.id);
    }
    res.json({ ok: true, meetings });
  } catch (err) {
    console.error('getMyMeetings error:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch meetings' });
  }
};

// PUT /api/meetings/:id/status — Update status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const meeting = await meetingModel.findById(id);
    if (!meeting) return res.status(404).json({ ok: false, message: 'Meeting not found' });

    // If contractor cancels, refund ₹30
    if (status === 'CANCELLED_BY_CONTRACTOR' && meeting.booking_fee_status === 'PAID') {
      await meetingModel.setBookingFeeRefunded(id);
      // TODO: Actual Razorpay refund API call
    }

    const updated = await meetingModel.updateStatus(id, status, note);
    res.json({ ok: true, meeting: updated });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ ok: false, message: 'Failed to update meeting' });
  }
};

// PUT /api/meetings/:id/reschedule — Reschedule
exports.reschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { proposed_date, proposed_time_slot, note } = req.body;

    const updated = await meetingModel.reschedule(id, proposed_date, proposed_time_slot, note);
    if (!updated) return res.status(404).json({ ok: false, message: 'Meeting not found' });

    res.json({ ok: true, meeting: updated });
  } catch (err) {
    console.error('reschedule error:', err);
    res.status(500).json({ ok: false, message: 'Failed to reschedule' });
  }
};
