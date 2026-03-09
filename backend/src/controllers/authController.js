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
    const { name, phone, password, role } = req.body;
    if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });

    const { sanitize, sanitizeObject } = require('../utils/sanitizers');
    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const cleanName = sanitize(name || null);
    const cleanPhone = sanitize(phone || null);
    const cleanEmail = sanitize(req.body.email || null);
    const user = await User.create({ name: cleanName, phone: cleanPhone, email: cleanEmail, password_hash: hashed, role: role || 'customer' });

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

    let user = null;
    if (phone) user = await User.findByPhone(phone);
    if (!user && email) user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const match = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
    if (!match) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

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
    } catch (_) { /* no-op */ }
  }
  res.clearCookie('token');
  res.json({ ok: true });
};

// ── Phone OTP ─────────────────────────────────────────

// Request OTP: send OTP via MSG91
exports.requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ ok: false, message: 'valid 10 digit phone required' });
    }

    await db.query('DELETE FROM otps WHERE phone = $1 OR expires_at < now() OR used = true', [cleanPhone]);

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    await db.query(
      `INSERT INTO otps (phone, code, expires_at, used)
       VALUES ($1, $2, now() + interval '10 minutes', false)`,
      [cleanPhone, otpCode]
    );

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

// Verify phone OTP: only if account exists
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ ok: false, message: 'phone and otp required' });

    const { sanitize } = require('../utils/sanitizers');
    const cleanPhone = String(sanitize(phone)).replace(/\D/g, '').slice(-10);
    const cleanOtp = sanitize(otp);
    const otpResult = await db.query(
      `SELECT id, code, expires_at, used FROM otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
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

    // Account must exist — do NOT auto-create
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    if (!existing.rows.length) {
      return res.status(404).json({
        ok: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this phone number. Please register first.',
      });
    }

    const user = await User.findById(existing.rows[0].id);
    const token = signUserToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, success: true, user, token });
  } catch (err) {
    next(err);
  }
};

// ── Email OTP ─────────────────────────────────────────
const { sendOtpEmail } = require('../services/emailService');

// Request email OTP
exports.requestEmailOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'email required' });
    const cleanEmail = String(email).trim().toLowerCase();

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (!existing.rows.length) {
      return res.status(404).json({
        ok: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Please register first.',
      });
    }

    await db.query("DELETE FROM otps WHERE phone = $1 OR expires_at < now() OR used = true", [cleanEmail]);

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    await db.query(
      `INSERT INTO otps (phone, code, expires_at, used)
       VALUES ($1, $2, now() + interval '10 minutes', false)`,
      [cleanEmail, otpCode]
    );

    try { await sendOtpEmail(cleanEmail, otpCode); } catch (e) {
      console.error('Failed to send OTP email:', e.message);
    }

    const response = { ok: true, success: true, message: 'OTP sent to email' };
    if (process.env.NODE_ENV !== 'production') response.otp_for_testing = otpCode;
    return res.json(response);
  } catch (err) {
    console.error('requestEmailOtp error:', err.message);
    res.status(400).json({ ok: false, message: err.message });
  }
};

// Verify email OTP
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ ok: false, message: 'email and otp required' });

    const { sanitize } = require('../utils/sanitizers');
    const cleanEmail = String(sanitize(email)).trim().toLowerCase();
    const cleanOtp = sanitize(otp);

    const otpResult = await db.query(
      `SELECT id, code, expires_at, used FROM otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail]
    );

    const latest = otpResult.rows[0];
    if (!latest) return res.status(400).json({ ok: false, message: 'Invalid OTP' });
    if (latest.used) return res.status(400).json({ ok: false, message: 'OTP already used' });
    if (new Date(latest.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ ok: false, message: 'OTP expired' });
    }
    if (String(latest.code) !== String(cleanOtp)) {
      return res.status(400).json({ ok: false, message: 'Invalid OTP' });
    }

    await db.query('UPDATE otps SET used = true WHERE id = $1', [latest.id]);

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (!existing.rows.length) {
      return res.status(404).json({
        ok: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account found with this email. Please register first.',
      });
    }

    const user = await User.findById(existing.rows[0].id);
    const token = signUserToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, success: true, user, token });
  } catch (err) {
    next(err);
  }
};

// ── Password Reset ─────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email required' });

    const cleanEmail = String(email).trim().toLowerCase();
    const userResult = await db.query('SELECT id, name FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (!userResult.rows.length) {
      // Silently return success to prevent email enumeration
      return res.json({ ok: true, message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Invalidate existing active tokens
    await db.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [user.id]);

    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, now() + interval '1 hour')`,
      [user.id, hashedToken]
    );

    // Get the frontend origin from request headers
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`[DEV ONLY] Password Reset URL: ${resetUrl}`);

    try {
      const { sendEmail } = require('../services/emailService');
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hi ${user.name || 'User'},</p>
          <p>You recently requested to reset your password. Click the button below to set a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `;
      await sendEmail(cleanEmail, 'Password Reset Request', 'Click the link to reset your password.', htmlContent);
    } catch (e) {
      console.error("Failed to send reset email", e);
    }

    res.json({ ok: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      client.release();
      return res.status(400).json({ ok: false, message: 'Email, token, and new password are required' });
    }

    const { isValidPassword } = require('../utils/validators');
    if (!isValidPassword(newPassword)) {
      client.release();
      return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const cleanEmail = String(email).trim().toLowerCase();

    // Check token
    const tokenResult = await client.query(
      `SELECT pr.id, pr.user_id 
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE u.email = $1 AND pr.token = $2 AND pr.used = false AND pr.expires_at > now()`,
      [cleanEmail, hashedToken]
    );

    if (!tokenResult.rows.length) {
      client.release();
      return res.status(400).json({ ok: false, message: 'Invalid or expired reset token' });
    }

    const resetRecord = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token used
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, resetRecord.user_id]);
    await client.query('UPDATE password_resets SET used = true WHERE id = $1', [resetRecord.id]);
    await client.query('COMMIT');

    res.json({ ok: true, message: 'Password successfully reset' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    next(err);
  } finally {
    client.release();
  }
};
