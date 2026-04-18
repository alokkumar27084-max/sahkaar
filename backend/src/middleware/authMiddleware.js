const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { getJwtSecret } = require('../config/jwt');

function readToken(req) {
  const cookieToken = req.cookies && req.cookies.token;
  const headerToken = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
    ? req.headers.authorization.replace('Bearer ', '').trim()
    : null;
  return cookieToken || headerToken || null;
}

async function attachUserFromToken(req) {
  const token = readToken(req);
  if (!token) return null;
  const payload = jwt.verify(token, getJwtSecret());
  const user = {
    id: payload.sub || payload.id,
    role: payload.role || null,
    phone: payload.phone || null,
  };

  if (user.id && !user.role) {
    const userRes = await db.query('SELECT role, phone FROM users WHERE id = $1', [user.id]);
    if (userRes.rows[0]) {
      user.role = userRes.rows[0].role;
      user.phone = userRes.rows[0].phone;
    }
  }

  return user;
}

// Protect routes by checking cookie or bearer token
exports.requireAuth = async (req, res, next) => {
  try {
    req.user = await attachUserFromToken(req);
    if (!req.user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Invalid token' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    req.user = await attachUserFromToken(req);
    return next();
  } catch (_) {
    req.user = null;
    return next();
  }
};
