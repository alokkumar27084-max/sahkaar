const { test } = require('node:test');
const assert = require('assert');
const db = require('../src/config/db');
const { assertUserIsChatParticipant } = require('../src/utils/chatAccess');

test('chat access allows customer participant', async () => {
  const originalQuery = db.query;
  db.query = async () => ({ rows: [{ id: 1, customer_id: 42, contractor_user_id: 55 }] });
  try {
    const ok = await assertUserIsChatParticipant(1, 42);
    assert.strictEqual(ok, true);
  } finally {
    db.query = originalQuery;
  }
});

test('chat access denies unrelated user', async () => {
  const originalQuery = db.query;
  db.query = async () => ({ rows: [{ id: 1, customer_id: 42, contractor_user_id: 55 }] });
  try {
    const ok = await assertUserIsChatParticipant(1, 999);
    assert.strictEqual(ok, false);
  } finally {
    db.query = originalQuery;
  }
});
