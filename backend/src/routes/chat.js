const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', chatController.getUserChats);
router.post('/init', chatController.getOrCreateChat);
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/:chatId/messages', chatController.sendMessage);

module.exports = router;
