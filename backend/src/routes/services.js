const express = require('express');
const router = express.Router();
const controller = require('../controllers/servicesController');

// Public endpoints — no auth required
router.get('/categories', controller.listCategories);
router.get('/categories/:slug', controller.getCategoryBySlug);
router.get('/search', controller.searchServices);
router.post('/request', controller.submitRequest);
router.get('/:slug', controller.getServiceBySlug);

module.exports = router;
