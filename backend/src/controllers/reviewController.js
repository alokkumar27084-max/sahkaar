const Contractor = require('../models/contractorModel');

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
    const rating = parseInt(req.body.rating, 10);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, message: 'rating must be between 1 and 5' });
    }
    const review = await Contractor.addReview(req.params.id, req.user.id, rating, req.body.comment || null);
    return res.status(201).json({ ok: true, review });
  } catch (err) {
    return next(err);
  }
};
