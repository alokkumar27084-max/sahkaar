const express = require('express');
const router = express.Router();
const controller = require('../controllers/contractorController');
const { requireAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const Contractor = require('../models/contractorModel');

// Use diskStorage to preserve file extensions
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

// Public: stats, featured, list, search
router.get('/public-stats', controller.getPublicStats);
router.get('/featured', controller.featured);
router.get('/', controller.list);
router.get('/search', controller.search);

// Protected: my profile and availability. Keep these before /:id public routes.
router.get('/me', requireAuth, controller.getMyProfile);
router.get('/me/profile', requireAuth, controller.getMyProfile);
router.patch('/me/availability', requireAuth, controller.setMyAvailability);

router.get('/:id/reviews', controller.getReviews);
router.post('/:id/lead', controller.recordLead);
router.post('/:id/leads', controller.recordLead);
router.get('/:id', controller.getById);

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

// Protected: create/update contractor profile
router.post('/', requireAuth, controller.create);
router.put('/me', requireAuth, async (req, res, next) => {
  const my = await Contractor.findByUserId(req.user.id);
  if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
  return controller.update({ ...req, params: { id: my.id } }, res, next);
});
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

// Upload profile image
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

// Base64 image upload routes
router.post('/photo/base64', requireAuth, async (req, res, next) => {
  try {
    const my = await Contractor.findByUserId(req.user.id);
    if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return controller.uploadImageBase64({ ...req, params: { id: my.id } }, res, next);
  } catch (err) {
    return next(err);
  }
});
router.post('/:id/upload/base64', requireAuth, controller.uploadImageBase64);
router.post('/portfolio/base64', requireAuth, async (req, res, next) => {
  try {
    const my = await Contractor.findByUserId(req.user.id);
    if (!my) return res.status(404).json({ ok: false, message: 'Contractor profile not found' });
    return controller.uploadPortfolioBase64({ ...req, params: { id: my.id } }, res, next);
  } catch (err) {
    return next(err);
  }
});
router.post('/:id/portfolio/base64', requireAuth, controller.uploadPortfolioBase64);

// Upload portfolio photos
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

// Portfolio items and verification
router.post('/:id/portfolio-items', requireAuth, upload.single('image'), controller.addPortfolioItem);
router.delete('/:id/portfolio-items/:itemId', requireAuth, controller.removePortfolioItem);
router.post('/:id/request-verification', requireAuth, controller.requestVerification);
router.post('/:id/idproof', requireAuth, upload.single('id_proof'), controller.uploadIdProof);

// Reviews and reporting
router.post('/:id/reviews', requireAuth, controller.addReview);
router.post('/:id/report', requireAuth, controller.reportContractor);

module.exports = router;
