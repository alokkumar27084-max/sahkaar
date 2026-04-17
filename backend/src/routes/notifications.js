const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationsController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);
router.get('/', controller.listMine);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
