const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/profiles/me — get own profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.user.id]);
    res.json({ profile: rows[0] || null });
  } catch (err) {
    console.error('Profile get error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT /api/profiles/me — create or update own profile (upsert)
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { display_name, bio, address, city, state, pincode, date_of_birth, gender, preferences } = req.body;

    const { rows } = await db.query(
      `INSERT INTO user_profiles (user_id, display_name, bio, address, city, state, pincode, date_of_birth, gender, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
         bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
         address = COALESCE(EXCLUDED.address, user_profiles.address),
         city = COALESCE(EXCLUDED.city, user_profiles.city),
         state = COALESCE(EXCLUDED.state, user_profiles.state),
         pincode = COALESCE(EXCLUDED.pincode, user_profiles.pincode),
         date_of_birth = COALESCE(EXCLUDED.date_of_birth, user_profiles.date_of_birth),
         gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
         preferences = COALESCE(EXCLUDED.preferences, user_profiles.preferences),
         updated_at = now()
       RETURNING *`,
      [
        req.user.id,
        display_name || null,
        bio || null,
        address || null,
        city || null,
        state || null,
        pincode || null,
        date_of_birth || null,
        gender || null,
        preferences ? JSON.stringify(preferences) : '{}',
      ]
    );

    res.json({ profile: rows[0] });
  } catch (err) {
    console.error('Profile upsert error:', err);
    res.status(500).json({ message: 'Failed to save profile' });
  }
});

// POST /api/profiles/me/avatar — upload avatar
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Upsert profile with avatar
    await db.query(
      `INSERT INTO user_profiles (user_id, avatar_url)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET avatar_url = $2, updated_at = now()`,
      [req.user.id, avatarUrl]
    );

    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

module.exports = router;
