// Simple auth controller with comments for beginners.
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyIdToken } = require('../config/firebaseAdmin');
const crypto = require('crypto');
const User = require('../models/userModel');
const Contractor = require('../models/contractorModel');

const { getJwtSecret } = require('../config/jwt');
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
    getJwtSecret(),
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
  let client;
  try {
    const { name, phone, password, role } = req.body;
    if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });

    const ALLOWED_REGISTER_ROLES = new Set(['customer', 'contractor']);
    const requestedRole = String(role || 'customer').toLowerCase();
    if (!ALLOWED_REGISTER_ROLES.has(requestedRole)) {
      return res.status(400).json({ ok: false, message: 'Invalid role. Allowed: customer, contractor' });
    }

    const { sanitize, sanitizeObject } = require('../utils/sanitizers');
    const hashed = password ? await bcrypt.hash(password, 10) : null;

    const cleanName = sanitize(name || null);
    const cleanPhone = sanitize(phone || null);
    const cleanEmail = sanitize(req.body.email || null);
    client = await db.pool.connect();
    await client.query('BEGIN');

    const duplicateChecks = [];
    if (cleanPhone) duplicateChecks.push(client.query('SELECT id FROM users WHERE phone = $1 LIMIT 1', [cleanPhone]));
    if (cleanEmail) duplicateChecks.push(client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail]));
    const duplicates = await Promise.all(duplicateChecks);
    if (duplicates.some((result) => result.rows.length > 0)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, message: 'An account with this phone or email already exists. Please log in.' });
    }

    const userRes = await client.query(
      `INSERT INTO users (name, phone, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, email, role`,
      [cleanName, cleanPhone, cleanEmail, hashed, requestedRole]
    );
    const user = userRes.rows[0];
    let contractor = null;

    if (requestedRole === 'contractor') {
      const {
        business_name,
        category,
        categories,
        description,
        services,
        daily_rate,
        experience_years,
        team_size,
        is_labour_group,
        is_responsibility_model,
        location_text,
        latitude,
        longitude,
        lat,
        lng,
        onboarding_data,
        labour_crew,
        service_type,
        quick_services,
        tier,
      } = req.body;
      const hasProfilePayload =
        business_name !== undefined ||
        category !== undefined ||
        description !== undefined ||
        categories !== undefined ||
        services !== undefined ||
        daily_rate !== undefined ||
        location_text !== undefined ||
        latitude !== undefined ||
        longitude !== undefined ||
        lat !== undefined ||
        lng !== undefined;

      if (hasProfilePayload) {
        const cleanProfile = sanitizeObject({
          business_name,
          category,
          categories,
          description,
          services,
          daily_rate,
          experience_years,
          team_size,
          is_labour_group,
          is_responsibility_model,
          location_text,
          latitude,
          longitude,
          lat,
          lng,
          onboarding_data,
          labour_crew,
          service_type,
          quick_services,
          tier,
        });
        const profileCategories = Array.isArray(cleanProfile.categories)
          ? cleanProfile.categories
          : cleanProfile.category
            ? [cleanProfile.category]
            : [];
        const profileCategory = cleanProfile.category || profileCategories[0] || null;
        const profileLat = toFiniteNumber(cleanProfile.lat ?? cleanProfile.latitude);
        const profileLng = toFiniteNumber(cleanProfile.lng ?? cleanProfile.longitude);

        const contractorRes = await client.query(
          `INSERT INTO contractors (
            user_id, business_name, category, categories, description, services,
            daily_rate, experience_years, team_size, is_labour_group,
            is_responsibility_model, location_text, lat, lng, latitude, longitude,
            onboarding_data, labour_crew, service_type, quick_services, tier
          )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           RETURNING *`,
          [
            user.id,
            cleanProfile.business_name || cleanName,
            profileCategory,
            profileCategories,
            cleanProfile.description || null,
            Array.isArray(cleanProfile.services) ? cleanProfile.services : [],
            cleanProfile.daily_rate || null,
            cleanProfile.experience_years || 0,
            cleanProfile.team_size || 1,
            !!cleanProfile.is_labour_group,
            !!cleanProfile.is_responsibility_model,
            cleanProfile.location_text || null,
            profileLat,
            profileLng,
            profileLat,
            profileLng,
            cleanProfile.onboarding_data ? JSON.stringify(cleanProfile.onboarding_data) : '{}',
            cleanProfile.labour_crew ? JSON.stringify(cleanProfile.labour_crew) : '[]',
            cleanProfile.service_type || 'project',
            cleanProfile.quick_services ? JSON.stringify(cleanProfile.quick_services) : '[]',
            cleanProfile.tier || 'standard',
          ]
        );
        contractor = contractorRes.rows[0];
      }
    }

    await client.query('COMMIT');

    const safeUser = await User.findById(user.id);
    const token = signUserToken(safeUser);
    res.cookie('token', token, cookieOptions());

    res.status(201).json({ ok: true, user: safeUser, contractor, token });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    if (client) client.release();
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
    const payload = require('jsonwebtoken').verify(token, getJwtSecret());
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
      const payload = jwt.verify(token, getJwtSecret());
      await db.query('DELETE FROM sessions WHERE user_id = $1', [payload.sub || payload.id]);
    } catch (_) { /* no-op */ }
  }
  res.clearCookie('token');
  res.json({ ok: true });
};

// ── Phone OTP (Firebase) ─────────────────────────────────────────

// Verify phone via Firebase ID token
// Frontend sends the Firebase ID token after OTP verification on client side
exports.verifyOtp = async (req, res, next) => {
  try {
    const { idToken, phone } = req.body;
    if (!idToken) return res.status(400).json({ ok: false, message: 'Firebase ID token required' });

    // Verify the Firebase ID token
    const decoded = await verifyIdToken(idToken);

    // Extract phone from Firebase token (format: +91XXXXXXXXXX)
    const firebasePhone = decoded.phone_number;
    if (!firebasePhone) {
      return res.status(400).json({ ok: false, message: 'No phone number in Firebase token' });
    }

    // Normalize to 10-digit Indian number
    const cleanPhone = firebasePhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ ok: false, message: 'Invalid phone number in token' });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
    if (!existing.rows.length) {
      // New user — return flag so frontend shows register step
      return res.json({
        ok: true,
        success: true,
        isNewUser: true,
        phone: cleanPhone,
        message: 'Phone verified. Please register to continue.',
      });
    }

    // Existing user — log them in
    const user = await User.findById(existing.rows[0].id);
    const token = signUserToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, success: true, user, token });
  } catch (err) {
    console.error('verifyOtp (Firebase) error:', err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ ok: false, message: 'Token expired. Please try again.' });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-revoked') {
      return res.status(400).json({ ok: false, message: 'Invalid token. Please try again.' });
    }
    next(err);
  }
};

// Legacy requestOtp — no longer sends SMS (Firebase handles it on client)
// Kept for backward compatibility; returns success immediately
exports.requestOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ ok: false, message: 'phone required' });
  // Firebase handles OTP sending on the client side
  res.json({ ok: true, success: true, message: 'Use Firebase Phone Auth on client' });
};

// ── Email Auth (Firebase Email Link) ─────────────────────────────────────────

// Verify email via Firebase ID token (after user clicks email sign-in link)
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ ok: false, message: 'Firebase ID token required' });

    // Verify the Firebase ID token
    const decoded = await verifyIdToken(idToken);

    const firebaseEmail = decoded.email;
    if (!firebaseEmail) {
      return res.status(400).json({ ok: false, message: 'No email in Firebase token' });
    }

    const cleanEmail = firebaseEmail.trim().toLowerCase();

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (!existing.rows.length) {
      return res.json({
        ok: true,
        success: true,
        isNewUser: true,
        email: cleanEmail,
        message: 'Email verified. Please register to continue.',
      });
    }

    // Existing user — log them in
    const user = await User.findById(existing.rows[0].id);
    const token = signUserToken(user);
    res.cookie('token', token, cookieOptions());
    res.json({ ok: true, success: true, user, token });
  } catch (err) {
    console.error('verifyEmailOtp (Firebase) error:', err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ ok: false, message: 'Token expired. Please try again.' });
    }
    next(err);
  }
};

// Request email link — handled on frontend via Firebase SDK
exports.requestEmailOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: 'email required' });
  res.json({ ok: true, success: true, message: 'Use Firebase Email Link Auth on client' });
};

// ── Password Reset (Firebase handles email sending) ─────────────────────────
// Firebase sendPasswordResetEmail() is called from the frontend.
// This endpoint is kept for backward compatibility.
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email required' });
    // Firebase handles password reset emails from the client side.
    // Return success to avoid email enumeration.
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
      return res.status(400).json({ ok: false, message: 'Email, token, and new password are required' });
    }

    const { isValidPassword } = require('../utils/validators');
    if (!isValidPassword(newPassword)) {
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
