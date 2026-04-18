const db = require('../config/db');

/**
 * Returns true if userId is the customer or the contractor owner for this chat.
 */
async function assertUserIsChatParticipant(chatId, userId) {
  const { rows } = await db.query(
    `SELECT c.id, c.customer_id, ct.user_id AS contractor_user_id
     FROM chats c
     JOIN contractors ct ON ct.id = c.contractor_id
     WHERE c.id = $1`,
    [chatId]
  );
  if (!rows.length) return false;
  const r = rows[0];
  return r.customer_id === userId || r.contractor_user_id === userId;
}

module.exports = { assertUserIsChatParticipant };
