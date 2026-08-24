const Contractor = require('../models/contractorModel');
const db = require('../config/db');

exports.listByContractor = async (req, res, next) => {
  try {
    const reviews = await Contractor.getReviews(req.params.id);
    return res.json({ ok: true, reviews });
  } catch (err) {
    return next(err);
  }
};

exports.createForContractor = async (req, res, next) => {
  try {
    const contractorId = req.params.id;
    const customerId = req.user.id;
    const rating = parseInt(req.body.rating, 10);
    const comment = req.body.comment || req.body.review_text || '';

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if user has an associated booking
    const bookingRes = await db.query(
      `SELECT id FROM bookings WHERE customer_id = $1 AND contractor_id = $2
       UNION
       SELECT id FROM quick_bookings WHERE customer_id = $1 AND contractor_id = $2
       LIMIT 1`,
      [customerId, contractorId]
    );
    const bookingId = bookingRes.rows[0]?.id || null;

    // Check for existing review
    const existing = await db.query(
      `SELECT id FROM reviews WHERE contractor_id = $1 AND user_id = $2 LIMIT 1`,
      [contractorId, customerId]
    );

    let review;
    if (existing.rows[0]) {
      const updated = await db.query(
        `UPDATE reviews 
         SET rating = $1, comment = $2, review_text = $3, updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [rating, comment, comment, existing.rows[0].id]
      );
      review = updated.rows[0];
    } else {
      const inserted = await db.query(
        `INSERT INTO reviews (contractor_id, user_id, rating, comment, review_text, booking_id, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [contractorId, customerId, rating, comment, comment, bookingId, !!bookingId]
      );
      review = inserted.rows[0];
    }

    // Update contractor average rating and review count
    const agg = await db.query(
      `SELECT AVG(rating)::numeric(3,1) as avg, COUNT(*)::int as cnt FROM reviews WHERE contractor_id = $1`,
      [contractorId]
    );
    const avg = Number(agg.rows[0]?.avg) || rating;
    const cnt = Number(agg.rows[0]?.cnt) || 1;

    await db.query(
      `UPDATE contractors 
       SET rating = $1, review_count = $2, reviews_count = $2, updated_at = NOW() 
       WHERE id = $3`,
      [avg, cnt, contractorId]
    );

    return res.status(201).json({ ok: true, review, rating: avg, review_count: cnt });
  } catch (err) {
    return next(err);
  }
};
