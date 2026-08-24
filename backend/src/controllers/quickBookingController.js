// ─────────────────────────────────────────────
// quickBookingController.js — Quick service booking flow
// ─────────────────────────────────────────────
const quickBookingModel = require('../models/quickBookingModel');
const subscriptionModel = require('../models/subscriptionModel');
const notificationService = require('../services/notificationService');
const db = require('../config/db');
const { isMockPaymentMode, verifyPaymentSignature } = require('../utils/razorpay');

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
    const contractor_id = req.body.contractor_id || req.body.contractorId;
    const service_name = req.body.service_name || req.body.serviceName;
    const service_details = req.body.service_details || req.body.serviceDetails;
    const scheduled_date = req.body.scheduled_date || req.body.scheduledDate || req.body.preferredDate;
    const scheduled_time_slot = req.body.scheduled_time_slot || req.body.scheduledTimeSlot || req.body.timeSlot;
    const service_price = req.body.service_price || req.body.servicePrice || 0;
    const customer_address = req.body.customer_address || req.body.customerAddress || req.body.address;
    const customer_lat = req.body.customer_lat || req.body.customerLat;
    const customer_lng = req.body.customer_lng || req.body.customerLng;

    if (!contractor_id || !service_name || !scheduled_date) {
      return res.status(400).json({ ok: false, message: 'contractor_id, service_name, and scheduled_date are required' });
    }

    // Check lead limit (optional warning, non-blocking for verified masters)
    try {
      const leadCheck = await subscriptionModel.canReceiveLead(contractor_id);
      if (!leadCheck.allowed) {
        console.warn('Contractor reached free lead limit, but allowing verified booking');
      }
    } catch (e) {
      console.warn('leadCheck error:', e.message);
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

    try {
      await subscriptionModel.recordLead(contractor_id, req.user.id, 'booking');
    } catch (e) {
      console.warn('recordLead failed:', e.message);
    }

    // Dispatch instant real-time notification to Master's device & dashboard
    try {
      const custRes = await db.query('SELECT name, phone FROM users WHERE id = $1', [req.user.id]);
      const customerName = custRes.rows[0]?.name || 'Customer';
      const customerPhone = custRes.rows[0]?.phone || '';

      await notificationService.notify(contractor_id, {
        type: 'booking:new',
        message: `🔔 New Booking: ${customerName} requested ${service_name} for ${scheduled_date} (${scheduled_time_slot || 'Immediate'}).`,
        data: {
          booking_id: booking.id,
          service_name,
          customer_name: customerName,
          customer_phone: customerPhone,
          scheduled_date,
          scheduled_time_slot,
          address: customer_address,
          price: service_price,
        },
      });
    } catch (notifErr) {
      console.warn('Instant booking notification failed:', notifErr.message);
    }

    return res.json({
      ok: true,
      booking,
      razorpay_order: {
        id: order.id,
        amount: BOOKING_FEE,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'mock_key',
      },
      data: {
        booking,
        razorpayOrderId: order.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID || 'mock_key',
        amount: BOOKING_FEE,
      }
    });
  } catch (err) {
    console.error('createQuickBooking error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to create booking' });
  }
};

// POST /api/quick-bookings/verify
exports.verifyBookingFee = async (req, res) => {
  try {
    const booking_id = req.body.booking_id || req.body.bookingId;
    const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
    const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
    const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;

    if (!booking_id) return res.status(400).json({ ok: false, message: 'booking_id required' });

    const booking = await quickBookingModel.findById(booking_id);
    if (!booking) return res.status(404).json({ ok: false, message: 'Booking not found' });
    if (String(booking.customer_id) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }
    if (booking.booking_fee_status === 'PAID') {
      return res.json({ ok: true, booking });
    }

    const mockMode = isMockPaymentMode() || (razorpay_order_id && razorpay_order_id.startsWith('mock_order_'));
    if (!mockMode && !verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })) {
      return res.status(400).json({ ok: false, message: 'Payment verification failed' });
    }

    const paymentId = mockMode ? (razorpay_payment_id || `mock_pay_${Date.now()}`) : razorpay_payment_id;
    const updated = await quickBookingModel.setBookingFeePaid(booking_id, paymentId);
    if (!updated) return res.status(409).json({ ok: false, message: 'Payment state changed; refresh and retry' });

    // Send real-time payment confirmed push to Master
    try {
      await notificationService.notify(booking.contractor_id, {
        type: 'booking:confirmed',
        message: `💰 Booking Confirmed & Paid: ${booking.service_name} on ${new Date(booking.scheduled_date).toLocaleDateString()} (Customer: ${booking.customer_name}).`,
        data: {
          booking_id: booking.id,
          status: 'CONFIRMED',
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          service_name: booking.service_name,
          address: booking.customer_address,
        },
      });

      // Also notify customer
      await notificationService.notify(booking.customer_id, {
        type: 'booking:confirmed',
        message: `✅ Your booking for ${booking.service_name} with ${booking.contractor_name} has been confirmed!`,
        data: { booking_id: booking.id, status: 'CONFIRMED' },
      });
    } catch (e) {
      console.warn('QS notification failed:', e.message);
    }

    return res.json({ ok: true, booking: updated });
  } catch (err) {
    console.error('verifyBookingFee error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Verification failed' });
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

    // Notify the customer in real-time about their job status update
    try {
      const fullBooking = await quickBookingModel.findById(id);
      if (fullBooking) {
        await notificationService.notify(fullBooking.customer_id, {
          type: 'booking:status_update',
          message: `🛠️ Booking Status: Master ${fullBooking.contractor_name} has marked your ${fullBooking.service_name} job as ${status}.`,
          data: { booking_id: id, status },
        });
      }
    } catch (e) {
      console.warn('Status notification error:', e.message);
    }

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
