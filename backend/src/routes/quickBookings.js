const express = require('express');
const router = express.Router();
const controller = require('../controllers/quickBookingController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', controller.createBooking);
router.post('/verify', controller.verifyBookingFee);
router.get('/me', controller.getMyBookings);
router.get('/contractor/me', controller.getContractorBookings);
router.put('/:id/status', controller.updateStatus);
router.post('/:id/review', controller.addReview);

module.exports = router;
