const { test } = require('node:test');
const assert = require('assert');
const authController = require('../src/controllers/authController');

function makeRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.payload = body; return this; },
    cookie() { return this; },
  };
}

test('register rejects admin role from public endpoint', async () => {
  const req = {
    body: {
      name: 'Bad Actor',
      phone: '9000000009',
      password: 'pass12345',
      role: 'admin',
    },
  };
  const res = makeRes();
  let nextCalled = false;

  await authController.register(req, res, () => { nextCalled = true; });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 400);
  assert.match(String(res.payload?.message || ''), /invalid role/i);
});
