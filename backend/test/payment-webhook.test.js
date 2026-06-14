const { test } = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const request = require('supertest');
const db = require('../src/config/db');
const app = require('../src/app');

test('Razorpay webhook verifies the exact raw request body', async () => {
  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const originalConnect = db.pool.connect;
  const secret = 'webhook-test-secret';
  const payload = JSON.stringify({ event: 'unhandled.test', payload: { value: 1 } });
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  db.pool.connect = async () => {
    throw new Error('database should not be used for an unhandled event');
  };

  try {
    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(payload);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.status, 'ok');
  } finally {
    process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    db.pool.connect = originalConnect;
  }
});

test('Razorpay webhook rejects a signature for different bytes', async () => {
  const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const secret = 'webhook-test-secret';
  const signature = crypto.createHmac('sha256', secret).update('{"different":true}').digest('hex');
  process.env.RAZORPAY_WEBHOOK_SECRET = secret;

  try {
    const response = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send('{"event":"unhandled.test","payload":{}}');

    assert.strictEqual(response.status, 400);
  } finally {
    process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
  }
});
