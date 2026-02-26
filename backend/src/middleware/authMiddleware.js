const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function readToken(req) {
  const cookieToken = req.cookies && req.cookies.token;
  const headerToken = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    ? req.headers.authorization.replace('Bearer ', '').trim()
    : null;
  return cookieToken || headerToken || null;
}

// Protect routes by checking cookie or bearer token
exports.requireAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub || payload.id,
      role: payload.role || null,
      phone: payload.phone || null,
    };

    // Backfill role for legacy tokens that only had `sub`
    if (req.user.id && !req.user.role) {
      const userRes = await db.query('SELECT role, phone FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows[0]) {
        req.user.role = userRes.rows[0].role;
        req.user.phone = userRes.rows[0].phone;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};
