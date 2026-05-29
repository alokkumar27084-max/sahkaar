const Contractor = require('../models/contractorModel');
const db = require('../config/db');

// GET /api/labour/search — Search for nearby labour group thekedaars
exports.searchLabour = async (req, res, next) => {
  try {
    const { q, lat, lng, radius_km, sort, page, limit } = req.query;
    // Force search to filter only labour groups (is_labour_group = true)
    const contractors = await Contractor.search({
      q,
      labour_group: true,
      lat,
      lng,
      radius_km,
      sort,
      page,
      limit
    });
    return res.json({ ok: true, contractors });
  } catch (err) {
    return next(err);
  }
};

// GET /api/labour/:id — Fetch a specific labour group's profile
exports.getLabourDetails = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor || !contractor.is_labour_group) {
      return res.status(404).json({ ok: false, message: 'Labour group profile not found' });
    }
    await Contractor.incrementViews(req.params.id);
    return res.json({ ok: true, contractor });
  } catch (err) {
    return next(err);
  }
};
