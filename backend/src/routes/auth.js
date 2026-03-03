const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

const { requireAuth } = require('../middleware/authMiddleware');

// Public: register a contractor/customer
router.post('/register', controller.register);

// Public: login with password
router.post('/login', controller.login);

// Public: phone OTP
router.post('/otp/request', controller.requestOtp);
router.post('/send-otp', controller.requestOtp);
router.post('/otp/verify', controller.verifyOtp);
router.post('/verify-otp', controller.verifyOtp);

// Public: email OTP
router.post('/otp/email/request', controller.requestEmailOtp);
router.post('/otp/email/verify', controller.verifyEmailOtp);

// Auth helpers
router.get('/me', controller.me);
router.put('/location', requireAuth, controller.updateMyLocation);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
