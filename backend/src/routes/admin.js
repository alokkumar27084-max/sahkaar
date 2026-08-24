const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { requireAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/role');

router.use(requireAuth, checkRole('admin'));

// System stats & logs
router.get('/stats', controller.stats);
router.get('/activity', controller.activity);
router.get('/analytics', controller.analytics);

// Federations Management
router.get('/federations', controller.listFederations);
router.post('/federations', controller.createFederation);
router.patch('/federations/:id', controller.updateFederation);
router.delete('/federations/:id', controller.deleteFederation);

// Cooperative Societies Management
router.get('/societies', controller.listSocieties);
router.post('/societies', controller.createSociety);
router.patch('/societies/:id', controller.updateSociety);
router.delete('/societies/:id', controller.deleteSociety);

// Users Management & Role Control
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUser);
router.post('/users', controller.createUser);
router.patch('/users/:id', controller.updateUser);
router.patch('/users/:id/role', controller.updateUserRole);
router.patch('/users/:id/authority', controller.assignUserAuthority);
router.delete('/users/:id', controller.deleteUser);

// Master Artisans Management & Audit
router.get('/contractors', controller.listContractors);
router.get('/contractors/pending', controller.pendingContractors);
router.post('/contractors', controller.createContractor);
router.patch('/contractors/:id', controller.updateContractor);
router.patch('/contractors/:id/verify', controller.verifyContractor);
router.patch('/contractors/:id/reassign-society', controller.reassignContractorSociety);
router.delete('/contractors/:id', controller.deleteContractor);
router.post('/contractors/:id/subscription', controller.createManualSubscription);
router.delete('/contractors/:id/subscription', controller.cancelSubscription);

// Bookings & Escrow Command Center
router.get('/bookings', controller.listAllBookings);
router.patch('/bookings/:id/status', controller.updateBookingStatus);

// Emergency Platform Broadcast
router.post('/broadcast', controller.emergencyBroadcast);

// Reports & Reviews
router.get('/reports', controller.reports);
router.patch('/reports/:id', controller.resolveReport);
router.get('/reviews', controller.listReviews);
router.delete('/reviews/:id', controller.deleteReview);

// Platform Settings
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

module.exports = router;
