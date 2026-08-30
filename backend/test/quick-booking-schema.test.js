const { test } = require('node:test');
const assert = require('assert');
const quickBookingModel = require('../src/models/quickBookingModel');
const db = require('../src/config/db');

test('quick booking creation bootstraps missing schema automatically', async () => {
  const originalQuery = db.query;
  const calls = [];

  db.query = async (sql, params) => {
    calls.push({ sql: String(sql), params });

    if (String(sql).includes('CREATE TABLE IF NOT EXISTS quick_bookings')) {
      return { rows: [] };
    }

    if (String(sql).includes('ALTER TABLE quick_bookings')) {
      return { rows: [] };
    }

    if (String(sql).includes('CREATE INDEX IF NOT EXISTS idx_quick_bookings_customer')) {
      return { rows: [] };
    }

    if (String(sql).includes('CREATE INDEX IF NOT EXISTS idx_quick_bookings_contractor')) {
      return { rows: [] };
    }

    if (String(sql).includes('CREATE INDEX IF NOT EXISTS idx_quick_bookings_status')) {
      return { rows: [] };
    }

    if (String(sql).includes('INSERT INTO quick_bookings')) {
      return {
        rows: [{
          id: 'qb-1',
          customer_id: 'cust-1',
          contractor_id: 'contractor-1',
          service_name: 'Plumbing',
          service_details: { notes: 'Fix leak' },
          scheduled_date: '2026-08-30',
          scheduled_time_slot: 'Evening',
          service_price: 1200,
          customer_address: 'Bhopal',
          booking_fee_order_id: 'order-1',
        }],
      };
    }

    return { rows: [] };
  };

  try {
    const row = await quickBookingModel.create({
      customer_id: 'cust-1',
      contractor_id: 'contractor-1',
      service_name: 'Plumbing',
      service_details: { notes: 'Fix leak' },
      scheduled_date: '2026-08-30',
      scheduled_time_slot: 'Evening',
      service_price: 1200,
      customer_address: 'Bhopal',
      booking_fee_order_id: 'order-1',
    });

    assert.strictEqual(row.id, 'qb-1');
    assert.ok(calls.some((c) => c.sql.includes('CREATE TABLE IF NOT EXISTS quick_bookings')));
  } finally {
    db.query = originalQuery;
  }
});
