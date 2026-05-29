const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const contractorRoutes = require('./contractors');
const reviewRoutes = require('./reviews');
const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/contractors', contractorRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', require('./chat'));
router.use('/quotes', require('./quotes'));
router.use('/bookings', require('./bookings'));
router.use('/notifications', require('./notifications'));
router.use('/profiles', require('./profiles'));
router.use('/payments', require('./payments'));
router.use('/meetings', require('./meetings'));
router.use('/projects', require('./projects'));
router.use('/quick-bookings', require('./quickBookings'));
router.use('/labour', require('./labour'));
router.use('/subscriptions', require('./subscriptions'));

module.exports = router;
