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
    role: null,
    phone: null,
    society_id: null,
    federation_id: null,
  };

  if (user.id) {
    const userRes = await db.query('SELECT role, phone, society_id, federation_id FROM users WHERE id = $1', [user.id]);
    if (userRes.rows[0]) Object.assign(user, userRes.rows[0]);
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
