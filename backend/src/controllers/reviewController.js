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

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if the user has a completed booking with this contractor
    const bookingRes = await db.query(
      "SELECT id FROM bookings WHERE customer_id = $1 AND contractor_id = $2 AND status = 'COMPLETED' LIMIT 1",
      [customerId, contractorId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Only verified customers who have completed a project with this contractor can leave a review.' 
      });
    }

    const bookingId = bookingRes.rows[0].id;

    const review = await Contractor.addReview(contractorId, customerId, rating, req.body.comment || null, { bookingId });
    return res.status(201).json({ ok: true, review });
  } catch (err) {
    return next(err);
  }
};
