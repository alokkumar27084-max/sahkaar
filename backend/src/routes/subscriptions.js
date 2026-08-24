const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscriptionController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public catalog of subscription plans
router.get('/plans', controller.getPlans);

router.use(requireAuth);

router.post('/purchase', controller.purchaseSubscription);
router.post('/verify', controller.verifyPurchase);
router.get('/status', controller.getStatus);
router.get('/history', controller.getHistory);

// Disputes (file and get filed disputes)
router.post('/disputes', controller.fileDispute);
router.get('/disputes/me', controller.getMyDisputes);

module.exports = router;
