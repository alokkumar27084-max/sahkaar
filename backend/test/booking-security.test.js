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

function makeClient(queryHandler) {
  return {
    query: queryHandler,
    releaseCalled: false,
    release() { this.releaseCalled = true; },
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

test('booking workflow rejects invalid lifecycle jumps before financial allocation', async () => {
  const originalConnect = db.pool.connect;
  const queries = [];
  const client = makeClient(async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('FROM bookings b')) {
      return {
        rows: [{
          id: 'booking-a',
          customer_id: 'customer-1',
          contractor_id: 'contractor-1',
          worker_user_id: 'worker-owner',
          workflow_status: 'created',
          status: 'PENDING_PAYMENT',
          amount: 1000,
        }],
      };
    }
    return { rows: [] };
  });

  db.pool.connect = async () => client;

  try {
    const req = {
      user: { id: 'customer-1', role: 'customer' },
      params: { bookingId: 'booking-a' },
      body: { status: 'completed' },
    };
    const res = makeRes();

    await bookingController.updateWorkflowStatus(req, res);

    assert.strictEqual(res.statusCode, 409);
    assert.match(String(res.payload?.message || ''), /created to completed/i);
    assert.strictEqual(queries.some((q) => q.sql.startsWith('INSERT INTO booking_financial_allocations')), false);
    assert.strictEqual(queries.some((q) => q.sql.startsWith('INSERT INTO cooperative_ledger_entries')), false);
    assert.strictEqual(queries.some((q) => q.sql === 'ROLLBACK'), true);
    assert.strictEqual(client.releaseCalled, true);
  } finally {
    db.pool.connect = originalConnect;
  }
});

test('booking workflow allows assigned worker to accept a created booking', async () => {
  const originalConnect = db.pool.connect;
  const queries = [];
  const client = makeClient(async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('FROM bookings b')) {
      return {
        rows: [{
          id: 'booking-a',
          customer_id: 'customer-1',
          contractor_id: 'contractor-1',
          worker_user_id: 'worker-owner',
          workflow_status: 'created',
          status: 'PENDING_PAYMENT',
          amount: 1000,
        }],
      };
    }
    if (String(sql).startsWith('UPDATE bookings')) {
      return { rows: [{ id: 'booking-a', workflow_status: 'accepted', status: 'IN_PROGRESS' }] };
    }
    return { rows: [] };
  });

  db.pool.connect = async () => client;

  try {
    const req = {
      user: { id: 'worker-owner', role: 'worker' },
      params: { bookingId: 'booking-a' },
      body: { status: 'accepted' },
    };
    const res = makeRes();

    await bookingController.updateWorkflowStatus(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload?.data?.workflowStatus, 'accepted');
    assert.strictEqual(queries.some((q) => q.sql.startsWith('INSERT INTO booking_financial_allocations')), false);
    assert.strictEqual(queries.some((q) => q.sql === 'COMMIT'), true);
    assert.strictEqual(client.releaseCalled, true);
  } finally {
    db.pool.connect = originalConnect;
  }
});

test('customer completion creates one cooperative allocation and ledger batch in a transaction', async () => {
  const originalConnect = db.pool.connect;
  const queries = [];
  const client = makeClient(async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('FROM bookings b')) {
      return {
        rows: [{
          id: 'booking-a',
          customer_id: 'customer-1',
          contractor_id: 'contractor-1',
          worker_user_id: 'worker-owner',
          society_id: 'society-1',
          federation_id: 'federation-1',
          workflow_status: 'in_progress',
          status: 'IN_PROGRESS',
          amount: 1000,
          welfare_fee: 25,
        }],
      };
    }
    if (String(sql).startsWith('UPDATE bookings')) {
      return { rows: [{ id: 'booking-a', workflow_status: 'completed', status: 'COMPLETED' }] };
    }
    if (String(sql).includes('INSERT INTO booking_financial_allocations')) {
      return { rows: [{ id: 'allocation-1' }] };
    }
    return { rows: [] };
  });

  db.pool.connect = async () => client;

  try {
    const req = {
      user: { id: 'customer-1', role: 'customer' },
      params: { bookingId: 'booking-a' },
      body: { status: 'completed' },
    };
    const res = makeRes();

    await bookingController.updateWorkflowStatus(req, res);

    const ledgerWrites = queries.filter((q) => q.sql.includes('INSERT INTO cooperative_ledger_entries'));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(queries[0].sql, 'BEGIN');
    assert.strictEqual(queries.some((q) => q.sql.includes('FOR UPDATE OF b')), true);
    assert.strictEqual(queries.filter((q) => q.sql.includes('INSERT INTO booking_financial_allocations')).length, 1);
    assert.strictEqual(ledgerWrites.length, 4);
    assert.strictEqual(queries.some((q) => q.sql.startsWith('UPDATE cooperative_societies')), true);
    assert.strictEqual(queries.some((q) => q.sql === 'COMMIT'), true);
    assert.strictEqual(client.releaseCalled, true);
  } finally {
    db.pool.connect = originalConnect;
  }
});

test('matching workers query ranks verified cooperative workers by service distance', async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql: String(sql), params });
    return { rows: [{ id: 'worker-1', distance_km: 2.5 }] };
  };

  try {
    const req = {
      params: { bookingId: 'booking-a' },
      query: { radius_km: '20' },
    };
    const res = makeRes();

    await bookingController.getMatchingWorkers(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload?.data?.workers?.[0]?.id, 'worker-1');
    assert.match(queries[0].sql, /earth_distance/);
    assert.match(queries[0].sql, /verification_status = 'verified'/);
    assert.strictEqual(queries[0].params[0], 'booking-a');
    assert.strictEqual(queries[0].params[1], 20000);
  } finally {
    db.query = originalQuery;
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
