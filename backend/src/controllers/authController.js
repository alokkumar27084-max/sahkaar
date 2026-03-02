// Simple auth controller with comments for beginners.
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const msg91 = require('../services/msg91');
const crypto = require('crypto');
const User = require('../models/userModel');
const Contractor = require('../models/contractorModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ALLOWED_LOCATION_SOURCES = new Set(['browser_gps', 'manual_pin', 'ip_approx']);

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, id: user.id, role: user.role, phone: user.phone || null },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function cookieOptions() {
  const secureFlag = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  const sameSiteEnv = (process.env.COOKIE_SAMESITE || '').toLowerCase();
  const sameSite = sameSiteEnv || (secureFlag ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: secureFlag,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

// Register: create a user record (very minimal)
exports.register = async (req, res, next) => {
  try {
    // Accept role to allow `contractor` or `customer` signup
    const { name, phone, password, role } = req.body;
    if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });

    // Hash password if provided (passwordless allowed for OTP flows)
    const { sanitize, sanitizeObject } = require('../utils/sanitizers');
    const hashed = password ? await bcrypt.hash(password, 10) : null;

    // Create user via model helper
    const cleanName = sanitize(name || null);
    const cleanPhone = sanitize(phone || null);
    const cleanEmail = sanitize(req.body.email || null);
    const user = await User.create({ name: cleanName, phone: cleanPhone, email: cleanEmail, password_hash: hashed, role: role || 'customer' });

    // If registering as contractor and profile fields are provided, create profile in one step.
    // Otherwise, frontend can create profile later via /contractors after auth cookie is set below.
    if ((role || 'customer') === 'contractor') {
      const { business_name, description, categories, services, latitude, longitude } = req.body;
      const hasProfilePayload =
        business_name !== undefined ||
        description !== undefined ||
        categories !== undefined ||
        services !== undefined ||
        latitude !== undefined ||
        longitude !== undefined;

      if (hasProfilePayload) {
        const cleanProfile = sanitizeObject({ business_name, description, categories, services, latitude, longitude });
        await Contractor.create({
          user_id: user.id,
          business_name: cleanProfile.business_name || null,
          description: cleanProfile.description || null,
          categories: cleanProfile.categories || [],
          services: cleanProfile.services || [],
          latitude: cleanProfile.latitude || null,
          longitude: cleanProfile.longitude || null,
        });
      }
    }

    // Auto-login after registration so protected endpoints (e.g. /contractors) work immediately.
    const safeUser = await User.findById(user.id);
    const token = signUserToken(safeUser);
    res.cookie('token', token, cookieOptions());

    res.status(201).json({ ok: true, user: safeUser, token });
  } catch (err) {
    next(err);
  }
};

// Login: verify password and return a JWT
exports.login = async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;
    if ((!phone && !email) || !password) return res.status(400).json({ ok: false, message: 'identifier and password required' });

    // Find user by phone or email
    let user = null;
    if (phone) user = await User.findByPhone(phone);
    if (!user && email) user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const { sanitize } = require('../utils/sanitizers');
    const cleanPhone = sanitize(phone || null);
    const cleanEmail = sanitize(email || null);
    const match = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
    if (!match) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    // Return safe user fields
    const safeUser = await User.findById(user.id);
    const token = signUserToken(safeUser);
    const refreshToken = crypto.randomBytes(48).toString('hex');
    await db.query(
      `INSERT INTO sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, now() + interval '30 days')
       ON CONFLICT (refresh_token) DO NOTHING`,
      [safeUser.id, refreshToken]
    );

    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, user: safeUser, token });
  } catch (err) {
    next(err);
  }
};

// Return current user (from JWT cookie)
exports.me = async (req, res, next) => {
  try {
    const token = (req.cookies && req.cookies.token) ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.replace('Bearer ', '').trim()
        : null);
    if (!token) return res.json({ ok: true, user: null });
    const payload = require('jsonwebtoken').verify(token, JWT_SECRET);
    const result = await db.query(
      `SELECT id, name, phone, email, role,
              location_lat, location_lng, location_accuracy_m, location_source, location_captured_at
       FROM users
       WHERE id = $1`,
      [payload.sub || payload.id]
    );
    const user = result.rows[0] || null;
    res.json({ ok: true, user });
  } catch (err) {
    // If token invalid, return null user rather than error
    res.json({ ok: true, user: null });
  }
};

exports.updateMyLocation = async (req, res, next) => {
  try {
    const lat = toFiniteNumber(req.body?.lat ?? req.body?.latitude);
    const lng = toFiniteNumber(req.body?.lng ?? req.body?.longitude);
    const accuracy = toFiniteNumber(req.body?.accuracy_m ?? req.body?.accuracy);
    const sourceRaw = String(req.body?.source || 'browser_gps').trim().toLowerCase();
    const source = ALLOWED_LOCATION_SOURCES.has(sourceRaw) ? sourceRaw : 'browser_gps';

    if (lat === null || lng === null) {
      return res.status(400).json({ ok: false, message: 'lat and lng are required' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ ok: false, message: 'invalid coordinates' });
    }
    if (accuracy !== null && (accuracy < 0 || accuracy > 50000)) {
      return res.status(400).json({ ok: false, message: 'invalid accuracy' });
    }

    await db.query(
      `UPDATE users
       SET location_lat = $2,
           location_lng = $3,
           location_accuracy_m = $4,
           location_source = $5,
           location_captured_at = now(),
           updated_at = now()
       WHERE id = $1`,
      [req.user.id, lat, lng, accuracy, source]
    );

    const user = await User.findById(req.user.id);
    return res.json({ ok: true, user });
  } catch (err) {
    return next(err);
  }
};

// Logout: clear cookie
exports.logout = async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      await db.query('DELETE FROM sessions WHERE user_id = $1', [payload.sub || payload.id]);
    } catch (err) {
      // no-op
    }
  }
  res.clearCookie('token');
  res.json({ ok: true });
};

// Request OTP: send OTP via MSG91
exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ ok: false, message: 'valid 10 digit phone required' });
    }

    // Keep one active OTP per phone
    await db.query('DELETE FROM otps WHERE phone = $1 OR expires_at < now() OR used = true', [cleanPhone]);

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    await db.query(
      `INSERT INTO otps (phone, code, expires_at, used)
       VALUES ($1, $2, now() + interval '10 minutes', false)`,
      [cleanPhone, otpCode]
    );

    // Try SMS provider, but keep developer fallback if credentials are absent in non-production.
    try {
      const result = await msg91.sendOtp(cleanPhone);
      const response = { ok: true, success: true, message: result.message || 'OTP sent' };
      if (process.env.NODE_ENV !== 'production' && result.otp_for_testing) {
        response.otp_for_testing = result.otp_for_testing;
      }
      return res.json(response);
    } catch (providerErr) {
      if (process.env.NODE_ENV === 'production') throw providerErr;
    }

    res.json({
      ok: true,
      success: true,
      message: 'OTP generated (development fallback)',
      otp_for_testing: process.env.NODE_ENV === 'production' ? undefined : otpCode,
    });
  } catch (err) {
    console.error('requestOtp error:', err.message);
    res.status(400).json({ ok: false, message: err.message });
  }
};

// Verify OTP: verify with MSG91 (stub)
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ ok: false, message: 'phone and otp required' });

    const { sanitize } = require('../utils/sanitizers');
    const cleanPhone = String(sanitize(phone)).replace(/\D/g, '').slice(-10);
    const cleanOtp = sanitize(otp);
    const otpResult = await db.query(
      `SELECT id, code, expires_at, used
       FROM otps
       WHERE phone = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [cleanPhone]
    );

    const latest = otpResult.rows[0];
    if (!latest) return res.status(400).json({ ok: false, message: 'Invalid OTP' });
    if (latest.used) return res.status(400).json({ ok: false, message: 'OTP already used' });
    if (new Date(latest.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ ok: false, message: 'OTP expired' });
    }

    const providerVerified = await msg91.verifyOtp(cleanPhone, cleanOtp).catch(() => false);
    const localVerified = String(latest.code) === String(cleanOtp);
    if (!providerVerified && !localVerified) {
      return res.status(400).json({ ok: false, message: 'Invalid OTP' });
    }

    await db.query('UPDATE otps SET used = true WHERE id = $1', [latest.id]);

    // On success, upsert user and return token (simplified)
    // Use model helper to return full user
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    let user;
    if (existing.rows.length) {
      const id = existing.rows[0].id;
      user = await User.findById(id);
    } else {
      const created = await User.create({ name: null, phone: cleanPhone, password_hash: null, role: 'customer' });
      user = created;
    }

    const token = signUserToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, success: true, user, token });
  } catch (err) {
    next(err);
  }
};
