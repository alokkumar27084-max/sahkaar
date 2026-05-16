const { test } = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const db = require('../src/config/db');
const bookingController = require('../src/controllers/bookingController');

function makeRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

function razorpaySignature(secret, orderId, paymentId) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

test('payment verification rejects a Razorpay order for a different booking', async () => {
  const originalQuery = db.query;
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const queries = [];

  process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    if (String(sql).includes('FROM payments p')) {
      return {
        rows: [{
          booking_id: 'booking-a',
          customer_id: 'customer-1',
          contractor_id: 'contractor-1',
          service_category: 'Painting',
        }],
      };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'customer-1', role: 'customer' },
      body: {
        booking_id: 'booking-b',
        razorpay_order_id: 'order-1',
        razorpay_payment_id: 'pay-1',
        razorpay_signature: razorpaySignature('test-secret', 'order-1', 'pay-1'),
      },
    };
    const res = makeRes();

    await bookingController.verifyEscrow(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.match(String(res.payload?.message || ''), /does not match booking/i);
    assert.strictEqual(queries.some((q) => String(q.sql).startsWith('UPDATE payments')), false);
    assert.strictEqual(queries.some((q) => String(q.sql).startsWith('UPDATE bookings')), false);
  } finally {
    db.query = originalQuery;
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  }
});

test('payment verification rejects a customer who does not own the linked booking', async () => {
  const originalQuery = db.query;
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const queries = [];

  process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  db.query = async (sql, params) => {
    queries.push({ sql, params });
    if (String(sql).includes('FROM payments p')) {
      return {
        rows: [{
          booking_id: 'booking-a',
          customer_id: 'customer-owner',
          contractor_id: 'contractor-1',
          service_category: 'Painting',
        }],
      };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'customer-attacker', role: 'customer' },
      body: {
        booking_id: 'booking-a',
        razorpay_order_id: 'order-1',
        razorpay_payment_id: 'pay-1',
        razorpay_signature: razorpaySignature('test-secret', 'order-1', 'pay-1'),
      },
    };
    const res = makeRes();

    await bookingController.verifyEscrow(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.match(String(res.payload?.message || ''), /access denied/i);
    assert.strictEqual(queries.some((q) => String(q.sql).startsWith('UPDATE payments')), false);
    assert.strictEqual(queries.some((q) => String(q.sql).startsWith('UPDATE bookings')), false);
  } finally {
    db.query = originalQuery;
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  }
});

test('contractors cannot release escrow by marking a booking complete', async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql, params });
    if (String(sql).startsWith('SELECT * FROM bookings')) {
      return {
        rows: [{
          id: 'booking-a',
          customer_id: 'customer-1',
          contractor_id: 'contractor-1',
          service_category: 'Painting',
        }],
      };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'contractor-owner-user', role: 'contractor' },
      params: { bookingId: 'booking-a' },
    };
    const res = makeRes();

    await bookingController.releaseAndComplete(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.match(String(res.payload?.message || ''), /access denied/i);
    assert.strictEqual(queries.some((q) => String(q.sql).startsWith('UPDATE bookings')), false);
  } finally {
    db.query = originalQuery;
  }
});
