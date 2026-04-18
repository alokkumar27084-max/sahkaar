const { test } = require('node:test');
const assert = require('assert');

test('getJwtSecret requires strong secret in production', () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JWT_SECRET;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete require.cache[require.resolve('../src/config/jwt')];
    const { getJwtSecret } = require('../src/config/jwt');
    assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  } finally {
    process.env.NODE_ENV = prevEnv;
    process.env.JWT_SECRET = prevSecret;
    delete require.cache[require.resolve('../src/config/jwt')];
  }
});
