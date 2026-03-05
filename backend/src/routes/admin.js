const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/role');

router.use(requireAuth, checkRole('admin'));

router.get('/stats', controller.stats);
router.get('/activity', controller.activity);
router.get('/analytics', controller.analytics);

router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUser);
router.post('/users', controller.createUser);
router.patch('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

router.get('/contractors', controller.listContractors);
router.get('/contractors/pending', controller.pendingContractors);
router.post('/contractors', controller.createContractor);
router.patch('/contractors/:id', controller.updateContractor);
router.patch('/contractors/:id/verify', controller.verifyContractor);
router.delete('/contractors/:id', controller.deleteContractor);

router.get('/reports', controller.reports);
router.patch('/reports/:id', controller.resolveReport);

router.get('/reviews', controller.listReviews);
router.delete('/reviews/:id', controller.deleteReview);

router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

// Service management
router.get('/service-categories', controller.listServiceCategories);
router.post('/service-categories', controller.createServiceCategory);
router.patch('/service-categories/:id', controller.updateServiceCategory);
router.delete('/service-categories/:id', controller.deleteServiceCategory);

router.get('/services', controller.listAdminServices);
router.post('/services', controller.createAdminService);
router.patch('/services/:id', controller.updateAdminService);
router.delete('/services/:id', controller.deleteAdminService);

router.get('/service-requests', controller.listServiceRequests);
router.patch('/service-requests/:id', controller.updateServiceRequest);

module.exports = router;
