const { test } = require('node:test');
const assert = require('assert');
const { getCorsOrigins, isCorsOriginAllowed } = require('../src/config/cors');

test('normalizes configured frontend origins for Render deployments', () => {
  const origins = getCorsOrigins(' https://sahkaar-ui.onrender.com/,https://www.sahkaar.in/ ');

  assert.deepStrictEqual(origins, [
    'https://sahkaar-ui.onrender.com',
    'https://www.sahkaar.in',
  ]);
  assert.strictEqual(isCorsOriginAllowed('https://sahkaar-ui.onrender.com', origins), true);
  assert.strictEqual(isCorsOriginAllowed('https://malicious.example', origins), false);
});