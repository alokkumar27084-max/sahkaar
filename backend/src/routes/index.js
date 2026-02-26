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


module.exports = router;
