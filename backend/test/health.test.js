const { test } = require('node:test');
const assert = require('assert');
const request = require('supertest');

// Load app after optional env tweaks for isolated health checks
const app = require('../src/app');

test('GET /health returns 200 with status ok', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.ok(typeof res.body.time === 'string');
});
