const Contractor = require('../models/contractorModel');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Public stats for home page "Trust Strip"
exports.getPublicStats = async (req, res, next) => {
  try {
    const [contractors, bookings, cities, reviews] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM contractors WHERE is_verified = true`),
      db.query(`SELECT COUNT(*)::int AS count FROM bookings WHERE status = 'completed'`),
      db.query(`SELECT COUNT(DISTINCT location_text)::int AS count FROM contractors`),
      db.query(`SELECT AVG(rating)::numeric(3,1) AS avg FROM reviews WHERE rating IS NOT NULL`),
    ]);

    return res.json({
      ok: true,
      stats: {
        contractors: contractors.rows[0].count || 0,
        projects: bookings.rows[0].count || 0,
        cities: cities.rows[0].count || 0,
        satisfaction: reviews.rows[0].avg ? Math.round((Number(reviews.rows[0].avg) / 5) * 100) : null,
      }
    });
  } catch (err) {
    return next(err);
  }
};

// Get featured contractors (Strictly admin-selected)
exports.featured = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone,
              COALESCE(c.business_name, u.name) AS name,
              COALESCE(c.category, c.categories[1], NULL) AS category,
              COALESCE(c.review_count, c.reviews_count, 0) AS review_count,
              COALESCE(c.portfolio_photos, c.portfolio_urls, '{}') AS portfolio_photos
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE COALESCE(array_length(c.categories, 1), 0) > 0
         AND c.is_featured = true
       ORDER BY c.rating DESC, c.created_at DESC
       LIMIT 8`
    );

    return res.json({ ok: true, contractors: result.rows });
  } catch (err) {
    return next(err);
  }
};

// List contractors (paginated)
exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const result = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone,
              COALESCE(c.business_name, u.name) AS name,
              COALESCE(c.category, c.categories[1], NULL) AS category,
              COALESCE(c.review_count, c.reviews_count, 0) AS review_count,
              COALESCE(c.portfolio_photos, c.portfolio_urls, '{}') AS portfolio_photos
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE COALESCE(array_length(c.categories, 1), 0) > 0
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ ok: true, contractors: result.rows });
  } catch (err) {
    return next(err);
  }
};

// Search contractors by q/category/geo filters
exports.search = async (req, res, next) => {
  try {
    const { q, category, verified, featured, labour_group, lat, lng, radius_km, min_radius_km, sort, page, limit } = req.query;
    const contractors = await Contractor.search({ q, category, verified, featured, labour_group, lat, lng, radius_km, min_radius_km, sort, page, limit });
    return res.json({ ok: true, contractors });
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) return res.status(404).json({ ok: false, message: 'Not found' });
    await Contractor.incrementViews(req.params.id);
    return res.json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const contractor = await Contractor.findByUserId(req.user.id);
    if (!contractor) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return res.json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};

exports.setMyAvailability = async (req, res, next) => {
  try {
    const { available } = req.body || {};
    const current = await Contractor.findByUserId(req.user.id);
    if (!current) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    const nextValue = typeof available === 'boolean' ? available : !current.is_available;
    const updated = await Contractor.setAvailabilityByUserId(req.user.id, nextValue);
    return res.json({ ok: true, contractor: updated, is_available: !!nextValue });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { sanitizeObject } = require('../utils/sanitizers');
    const clean = sanitizeObject(Object.assign({}, req.body, { user_id: req.user.id }));
    const result = await Contractor.create(clean);
    return res.status(201).json({ ok: true, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { sanitizeObject } = require('../utils/sanitizers');
    const clean = sanitizeObject(req.body || {});
    const result = await Contractor.update(req.params.id, clean);
    if (!result) return res.status(404).json({ ok: false, message: 'Contractor not found' });
    return res.json({ ok: true, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await Contractor.remove(req.params.id);
    if (!result) return res.status(404).json({ ok: false, message: 'Contractor not found' });
    return res.json({ ok: true, message: 'Contractor profile removed' });
  } catch (err) {
    return next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const photo_url = `/uploads/${req.file.filename}`;
    const result = await Contractor.update(req.params.id, { photo_url });
    return res.json({ ok: true, photo_url, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.uploadImageBase64 = async (req, res, next) => {
  try {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ ok: false, message: 'No base64 data' });
    
    // Convert base64 to file
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `base64-${Date.now()}.jpg`;
    const filepath = path.join(__dirname, '../../uploads/', filename);
    fs.writeFileSync(filepath, buffer);

    const photo_url = `/uploads/${filename}`;
    const result = await Contractor.update(req.params.id, { photo_url });
    return res.json({ ok: true, photo_url, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.uploadPortfolio = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ ok: false, message: 'No files uploaded' });
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    const result = await Contractor.addPortfolioUrls(req.params.id, urls);
    return res.json({ ok: true, urls, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.uploadPortfolioBase64 = async (req, res, next) => {
  try {
    const { images } = req.body || {};
    if (!images || !Array.isArray(images)) return res.status(400).json({ ok: false, message: 'No base64 array' });

    const urls = [];
    for (const base64 of images) {
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `portfolio-${Date.now()}-${Math.random().toString(36).slice(7)}.jpg`;
      const filepath = path.join(__dirname, '../../uploads/', filename);
      fs.writeFileSync(filepath, buffer);
      urls.push(`/uploads/${filename}`);
    }

    const result = await Contractor.addPortfolioUrls(req.params.id, urls);
    return res.json({ ok: true, urls, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.setPortfolio = async (req, res, next) => {
  try {
    const { photos } = req.body || {};
    const result = await Contractor.update(req.params.id, { portfolio_photos: photos || [] });
    return res.json({ ok: true, contractor: result });
  } catch (err) {
    return next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body || {};
    const result = await db.query(
      `INSERT INTO reviews (contractor_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, req.user.id, rating, comment]
    );
    // update contractor rating cache
    await db.query(
      `UPDATE contractors
       SET rating = (SELECT AVG(rating) FROM reviews WHERE contractor_id = $1),
           review_count = (SELECT COUNT(*) FROM reviews WHERE contractor_id = $1)
       WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ ok: true, review: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.contractor_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    return res.json({ ok: true, reviews: result.rows });
  } catch (err) {
    return next(err);
  }
};

exports.recordLead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE contractors SET leads_count = COALESCE(leads_count, 0) + 1 WHERE id = $1`,
      [req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.reportContractor = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    await db.query(
      `INSERT INTO reports (contractor_id, reporter_id, reason)
       VALUES ($1, $2, $3)`,
      [req.params.id, req.user.id, reason]
    );
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.addPortfolioItem = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    const { title, description } = req.body || {};
    const image_url = `/uploads/${req.file.filename}`;
    const result = await db.query(
      `INSERT INTO portfolio_items (contractor_id, image_url, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, image_url, title, description]
    );
    return res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    return next(err);
  }
};

exports.removePortfolioItem = async (req, res, next) => {
  try {
    await db.query(`DELETE FROM portfolio_items WHERE id = $1 AND contractor_id = $2`, [req.params.itemId, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.requestVerification = async (req, res, next) => {
  try {
    await db.query(`UPDATE contractors SET verification_status = 'pending' WHERE id = $1`, [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.uploadIdProof = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No ID proof uploaded' });
    const id_proof_url = `/uploads/${req.file.filename}`;
    await db.query(`UPDATE contractors SET id_proof_url = $2 WHERE id = $1`, [req.params.id, id_proof_url]);
    return res.json({ ok: true, id_proof_url });
  } catch (err) {
    return next(err);
  }
};
