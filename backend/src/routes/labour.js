const express = require('express');
const router = express.Router();
const controller = require('../controllers/labourController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/search', controller.searchLabour);
router.get('/:id', controller.getLabourDetails);

module.exports = router;
