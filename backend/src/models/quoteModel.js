const db = require('../config/db');

exports.createQuote = async ({ chatId, contractorId, customerId, items, totalAmount, notes }) => {
  const res = await db.query(
    `INSERT INTO quotes (chat_id, contractor_id, customer_id, items, total_amount, notes, status)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, 'PENDING')
     RETURNING *`,
    [chatId, contractorId, customerId, JSON.stringify(items), totalAmount, notes || null]
  );
  return res.rows[0];
};

exports.getQuoteById = async (quoteId) => {
  const res = await db.query('SELECT * FROM quotes WHERE id = $1', [quoteId]);
  return res.rows[0];
};

exports.updateQuoteStatus = async (quoteId, status) => {
  const res = await db.query(
    `UPDATE quotes SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, quoteId]
  );
  return res.rows[0];
};

exports.getQuotesByChat = async (chatId) => {
  const res = await db.query(
    'SELECT * FROM quotes WHERE chat_id = $1 ORDER BY created_at DESC',
    [chatId]
  );
  return res.rows;
};
