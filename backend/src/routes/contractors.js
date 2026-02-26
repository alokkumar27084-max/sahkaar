const express = require('express');
const router = express.Router();
const controller = require('../controllers/contractorController');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const Contractor = require('../models/contractorModel');

// store uploads in backend/uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public: get featured, list contractors and search
router.get('/featured', controller.featured);
router.get('/', controller.list);
router.get('/search', controller.search);
router.get('/me', requireAuth, controller.getMyProfile);
router.get('/me/profile', requireAuth, controller.getMyProfile);
router.patch('/me/availability', requireAuth, controller.setMyAvailability);
router.patch('/:id/availability', requireAuth, async (req, res, next) => {
  try {
    const target = await Contractor.findById(req.params.id);
    if (!target) return res.status(404).json({ ok: false, message: 'Not found' });
    if (target.user_id !== req.user.id) return res.status(403).json({ ok: false, message: 'Forbidden' });
    return controller.setMyAvailability(req, res, next);
  } catch (err) {
    return next(err);
  }
});
router.get('/:id/reviews', controller.getReviews);
router.post('/:id/lead', controller.recordLead);
router.post('/:id/leads', controller.recordLead);
router.get('/:id', controller.getById);

// Protected: create/update contractor profile
router.post('/', requireAuth, controller.create);
router.put('/me', requireAuth, async (req, res, next) => {
  const my = await Contractor.findByUserId(req.user.id);
  if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
  return controller.update({ ...req, params: { id: my.id } }, res, next);
});
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

// Upload profile image (multipart form-data, field name `image`)
router.post('/photo', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    const my = await Contractor.findByUserId(req.user.id);
    if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return controller.uploadImage({ ...req, params: { id: my.id } }, res, next);
  } catch (err) {
    return next(err);
  }
});
router.post('/:id/upload', requireAuth, upload.single('image'), controller.uploadImage);

// Upload portfolio photos (photos[])
router.post('/portfolio', requireAuth, upload.array('photos', 5), async (req, res, next) => {
  try {
    const profile = await Contractor.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return controller.uploadPortfolio({ ...req, params: { id: profile.id } }, res, next);
  } catch (err) {
    return next(err);
  }
});
router.put('/portfolio', requireAuth, async (req, res, next) => {
  try {
    const profile = await Contractor.findByUserId(req.user.id);
    if (!profile) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return controller.setPortfolio({ ...req, params: { id: profile.id } }, res, next);
  } catch (err) {
    return next(err);
  }
});
router.post('/:id/portfolio', requireAuth, upload.array('photos', 5), controller.uploadPortfolio);
router.put('/:id/portfolio', requireAuth, controller.setPortfolio);

// Upload ID proof (id_proof)
router.post('/:id/idproof', requireAuth, upload.single('id_proof'), controller.uploadIdProof);

// Reviews
router.post('/:id/reviews', requireAuth, controller.addReview);

module.exports = router;
