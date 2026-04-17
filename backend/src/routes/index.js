const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const contractorRoutes = require('./contractors');
const reviewRoutes = require('./reviews');
const adminRoutes = require('./admin');
const servicesRoutes = require('./services');

router.use('/auth', authRoutes);
router.use('/contractors', contractorRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/services', servicesRoutes);
router.use('/chat', require('./chat'));
router.use('/bookings', require('./bookings'));
router.use('/notifications', require('./notifications'));
router.use('/directory', require('./directory'));
router.use('/profiles', require('./profiles'));

module.exports = router;
