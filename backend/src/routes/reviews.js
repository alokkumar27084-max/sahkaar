const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/contractor/:id', controller.listByContractor);
router.post('/contractor/:id', requireAuth, controller.createForContractor);

module.exports = router;
