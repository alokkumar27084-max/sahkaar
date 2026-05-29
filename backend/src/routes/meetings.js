const express = require('express');
const router = express.Router();
const controller = require('../controllers/meetingController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.post('/', controller.bookMeeting);
router.post('/verify', controller.verifyPayment);
router.get('/me', controller.getMyMeetings);
router.put('/:id/status', controller.updateStatus);
router.put('/:id/reschedule', controller.reschedule);

module.exports = router;
