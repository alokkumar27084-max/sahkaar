const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

const { requireAuth } = require('../middleware/authMiddleware');

// Public: register a contractor/customer (simplified)
router.post('/register', controller.register);

// Public: login with password (or OTP flow)
router.post('/login', controller.login);

// Public: request OTP (stub)
router.post('/otp/request', controller.requestOtp);
router.post('/send-otp', controller.requestOtp);

// Public: verify OTP (stub)
router.post('/otp/verify', controller.verifyOtp);
router.post('/verify-otp', controller.verifyOtp);

// Auth helpers
router.get('/me', controller.me);
router.put('/location', requireAuth, controller.updateMyLocation);
router.post('/logout', requireAuth, controller.logout);

module.exports = router;
