const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/role');

router.use(requireAuth, checkRole('admin'));

router.get('/contractors/pending', controller.pendingContractors);
router.patch('/contractors/:id/verify', controller.verifyContractor);
router.get('/stats', controller.stats);
router.get('/reports', controller.reports);
router.patch('/reports/:id', controller.resolveReport);

module.exports = router;
