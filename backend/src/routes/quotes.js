const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.requireAuth);

router.post('/', quoteController.createQuote);
router.get('/chat/:chatId', quoteController.getQuotes);
router.get('/:quoteId', quoteController.getQuoteById);
router.put('/:quoteId/status', quoteController.updateQuoteStatus);

module.exports = router;
