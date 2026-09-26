const { test } = require('node:test');
const assert = require('assert');
const db = require('../src/config/db');
const cooperativeController = require('../src/controllers/cooperativeController');

function makeRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
  };
}

test('society admin cannot verify worker outside assigned society', async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('SELECT c.*, s.federation_id')) {
      return { rows: [] };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'admin-1', role: 'society_admin', society_id: 'society-a' },
      body: { workerId: 'worker-b' },
    };
    const res = makeRes();

    await cooperativeController.verifyWorker(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.match(String(res.payload?.message || ''), /jurisdiction/i);
    assert.strictEqual(queries.some((q) => q.sql.startsWith('UPDATE contractors')), false);
  } finally {
    db.query = originalQuery;
  }
});

test('federation admin cannot assign worker to another federation society', async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('SELECT c.*, s.federation_id')) {
      return {
        rows: [{
          id: 'worker-1',
          society_id: 'society-a',
          federation_id: 'federation-a',
        }],
      };
    }
    if (String(sql).includes('SELECT federation_id FROM cooperative_societies')) {
      return { rows: [{ federation_id: 'federation-b' }] };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'admin-1', role: 'federation_admin', federation_id: 'federation-a' },
      body: { workerId: 'worker-1', societyId: 'society-b' },
    };
    const res = makeRes();

    await cooperativeController.verifyWorker(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.match(String(res.payload?.message || ''), /outside your federation/i);
    assert.strictEqual(queries.some((q) => q.sql.startsWith('UPDATE contractors')), false);
  } finally {
    db.query = originalQuery;
  }
});

test('cooperative invoice denies federation admin outside worker jurisdiction', async () => {
  const originalQuery = db.query;
  const queries = [];

  db.query = async (sql, params) => {
    queries.push({ sql: String(sql), params });
    if (String(sql).includes('FROM bookings b')) {
      return {
        rows: [{
          id: 'booking-1',
          customer_id: 'customer-1',
          contractor_id: 'worker-1',
          worker_user_id: 'worker-user-1',
          amount: 1000,
        }],
      };
    }
    if (String(sql).includes('SELECT c.*, s.federation_id')) {
      return { rows: [] };
    }
    return { rows: [] };
  };

  try {
    const req = {
      user: { id: 'fed-admin-2', role: 'federation_admin', federation_id: 'federation-b' },
      params: { bookingId: 'booking-1' },
    };
    const res = makeRes();

    await cooperativeController.getBookingInvoice(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert.match(String(res.payload?.message || ''), /access denied/i);
    assert.strictEqual(queries.some((q) => q.sql.includes('booking_financial_allocations')), false);
  } finally {
    db.query = originalQuery;
  }
});
