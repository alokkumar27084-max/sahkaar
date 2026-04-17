const db = require('../config/db');

exports.listMine = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return res.json({ ok: true, notifications: rows });
  } catch (err) {
    return next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, message: 'Notification not found' });
    return res.json({ ok: true, notification: rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
