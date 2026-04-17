const express = require('express');
const router = express.Router();
const controller = require('../controllers/servicesController');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');

// Public endpoints — no auth required
router.get('/categories', controller.listCategories);
router.get('/categories/:slug', controller.getCategoryBySlug);
router.get('/search', controller.searchServices);
router.post('/request', optionalAuth, controller.submitRequest);
router.get('/requests/me', requireAuth, controller.getMyRequests);
router.get('/:slug', controller.getServiceBySlug);

module.exports = router;
