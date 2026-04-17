const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

// GET /api/directory — list/search directory listings
router.get('/', async (req, res) => {
  try {
    const { q, category, lat, lng, radius_km = 10, page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let where = ['1=1'];
    let params = [];
    let idx = 1;

    if (q) {
      where.push(`(business_name ILIKE $${idx} OR description ILIKE $${idx} OR address ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    if (category) {
      where.push(`category = $${idx}`);
      params.push(category);
      idx++;
    }

    let orderBy = 'created_at DESC';
    if (lat && lng) {
      const latVal = Number(lat);
      const lngVal = Number(lng);
      const radiusVal = Number(radius_km);
      // Simple bounding box filter
      const latDelta = radiusVal / 111;
      const lngDelta = radiusVal / (111 * Math.cos(latVal * Math.PI / 180));
      where.push(`lat BETWEEN $${idx} AND $${idx + 1}`);
      params.push(latVal - latDelta, latVal + latDelta);
      idx += 2;
      where.push(`lng BETWEEN $${idx} AND $${idx + 1}`);
      params.push(lngVal - lngDelta, lngVal + lngDelta);
      idx += 2;
    }

    const sql = `
      SELECT * FROM directory_listings
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    params.push(Number(limit), offset);

    const { rows } = await db.query(sql, params);
    res.json({ listings: rows });
  } catch (err) {
    console.error('Directory list error:', err);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

// GET /api/directory/:id — single listing
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM directory_listings WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: rows[0] });
  } catch (err) {
    console.error('Directory get error:', err);
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
});

// POST /api/directory — create listing (auth required)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { business_name, category, description, phone, address, lat, lng } = req.body;
    if (!business_name || !phone) {
      return res.status(400).json({ message: 'Business name and phone are required' });
    }
    const { rows } = await db.query(
      `INSERT INTO directory_listings (user_id, business_name, category, description, phone, address, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, business_name, category || 'other', description, phone, address, lat || null, lng || null]
    );
    res.status(201).json({ listing: rows[0] });
  } catch (err) {
    console.error('Directory create error:', err);
    res.status(500).json({ message: 'Failed to create listing' });
  }
});

// PUT /api/directory/:id — update listing (owner or admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { rows: existing } = await db.query('SELECT * FROM directory_listings WHERE id = $1', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Listing not found' });
    if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { business_name, category, description, phone, address, lat, lng } = req.body;
    const { rows } = await db.query(
      `UPDATE directory_listings
       SET business_name = COALESCE($1, business_name),
           category = COALESCE($2, category),
           description = COALESCE($3, description),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           lat = COALESCE($6, lat),
           lng = COALESCE($7, lng),
           updated_at = now()
       WHERE id = $8
       RETURNING *`,
      [business_name, category, description, phone, address, lat, lng, req.params.id]
    );
    res.json({ listing: rows[0] });
  } catch (err) {
    console.error('Directory update error:', err);
    res.status(500).json({ message: 'Failed to update listing' });
  }
});

// DELETE /api/directory/:id — delete listing (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    await db.query('DELETE FROM directory_listings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Directory delete error:', err);
    res.status(500).json({ message: 'Failed to delete listing' });
  }
});

module.exports = router;
