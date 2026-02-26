const Contractor = require('../models/contractorModel');
const db = require('../config/db');

// Get featured contractors (or fallback to top rated recent listings)
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

    if (result.rows.length) return res.json({ ok: true, contractors: result.rows });

    const fallback = await db.query(
      `SELECT c.*, u.name AS user_name, u.phone,
              COALESCE(c.business_name, u.name) AS name,
              COALESCE(c.category, c.categories[1], NULL) AS category,
              COALESCE(c.review_count, c.reviews_count, 0) AS review_count,
              COALESCE(c.portfolio_photos, c.portfolio_urls, '{}') AS portfolio_photos
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE COALESCE(array_length(c.categories, 1), 0) > 0
       ORDER BY COALESCE(c.review_count, c.reviews_count, 0) DESC, c.rating DESC, c.created_at DESC
       LIMIT 8`
    );
    return res.json({ ok: true, contractors: fallback.rows });
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
    const { q, category, verified, featured, labour_group, lat, lng, sort, page, limit } = req.query;
    const contractors = await Contractor.search({
      q,
      category,
      verified,
      featured,
      labour_group,
      lat,
      lng,
      sort,
      page,
      limit,
    });
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
    const contractor = await Contractor.create(clean);
    return res.status(201).json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Contractor.findById(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    const { sanitizeObject } = require('../utils/sanitizers');
    const clean = sanitizeObject(req.body || {});
    const updated = await Contractor.update(req.params.id, clean);
    return res.json({ ok: true, contractor: updated });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const existing = await Contractor.findById(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    await Contractor.remove(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ ok: false, message: 'rating must be between 1 and 5' });
    }
    const review = await Contractor.addReview(id, req.user.id, parsedRating, comment || null);
    return res.status(201).json({ ok: true, review });
  } catch (err) {
    return next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reviews = await Contractor.getReviews(id);
    return res.json({ ok: true, reviews });
  } catch (err) {
    return next(err);
  }
};

exports.recordLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contractor = await Contractor.findById(id);
    if (!contractor) return res.status(404).json({ ok: false, message: 'Not found' });
    const row = await Contractor.incrementLeads(id);
    return res.status(201).json({ ok: true, lead: row });
  } catch (err) {
    return next(err);
  }
};

function isValidImage(file) {
  if (!file) return false;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  return allowed.has(file.mimetype);
}

exports.uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Contractor.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    if (!isValidImage(req.file)) return res.status(400).json({ ok: false, message: 'Invalid image type' });

    const imagePath = `/uploads/${req.file.filename}`;
    const updated = await Contractor.setImage(id, imagePath);
    return res.json({ ok: true, contractor: updated, imageUrl: imagePath });
  } catch (err) {
    return next(err);
  }
};

exports.uploadPortfolio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Contractor.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ ok: false, message: 'No files uploaded' });
    if (req.files.some((f) => !isValidImage(f))) {
      return res.status(400).json({ ok: false, message: 'Only JPG/PNG/WEBP files are allowed' });
    }

    const imagePaths = req.files.map((f) => `/uploads/${f.filename}`);
    const updated = await Contractor.appendPortfolio(id, imagePaths);
    return res.json({ ok: true, contractor: updated, uploaded: imagePaths });
  } catch (err) {
    return next(err);
  }
};

exports.setPortfolio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Contractor.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });

    const photos = Array.isArray(req.body?.photos) ? req.body.photos : null;
    if (!photos) return res.status(400).json({ ok: false, message: 'photos array required' });

    const clean = photos.filter((x) => typeof x === 'string' && x.startsWith('/uploads/')).slice(0, 20);
    const updated = await Contractor.setPortfolio(id, clean);
    return res.json({ ok: true, contractor: updated, portfolio_photos: clean });
  } catch (err) {
    return next(err);
  }
};

exports.uploadIdProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Contractor.findById(id);
    if (!existing) return res.status(404).json({ ok: false, message: 'Not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });
    if (!isValidImage(req.file)) return res.status(400).json({ ok: false, message: 'Invalid image type' });

    const imagePath = `/uploads/${req.file.filename}`;
    const updated = await Contractor.setIdProof(id, imagePath);
    return res.json({ ok: true, contractor: updated, idProof: imagePath });
  } catch (err) {
    return next(err);
  }
};
