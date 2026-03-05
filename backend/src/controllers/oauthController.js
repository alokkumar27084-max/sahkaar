const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Using the provided Google Client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

exports.googleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ ok: false, message: 'Google credential required' });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ ok: false, message: 'Google account has no email' });
        }

        // Check if user exists
        const userResult = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);

        if (userResult.rows.length > 0) {
            // User exists, log them in
            const safeUser = await User.findById(userResult.rows[0].id);
            const token = signUserToken(safeUser);
            res.cookie('token', token, cookieOptions());
            return res.json({ ok: true, user: safeUser, token, isNewUser: false });
        } else {
            // User doesn't exist. Let frontend handle redirection to registration but provide email.
            return res.status(404).json({
                ok: false,
                code: 'ACCOUNT_NOT_FOUND',
                message: 'No account found with this Google email. Please complete registration.',
                googleData: { email, name, picture }
            });
        }
    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ ok: false, message: 'Invalid Google credential' });
    }
};
