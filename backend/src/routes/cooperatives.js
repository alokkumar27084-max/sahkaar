const express = require('express');
const router = express.Router();
const controller = require('../controllers/cooperativeController');
const { optionalAuth, requireAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/role');

// Public / General Cooperative Directory & Forecast
router.get('/federations', controller.getFederations);
router.get('/societies', controller.getSocieties);
router.get('/society/:id', controller.getSocietyById);
router.get('/worker/:workerId/welfare', controller.getWorkerWelfareDetails);
router.get('/forecast', controller.getDemandForecast);

// Society Admin Endpoints
router.get('/stats/society/:societyId?', optionalAuth, controller.getSocietyAdminStats);
router.post('/verify-worker', optionalAuth, controller.verifyWorker);
router.post('/reject-worker', optionalAuth, controller.rejectWorker);

// Federation Admin & Control Endpoints
router.get('/stats/federation', optionalAuth, controller.getFederationAdminStats);
router.post('/allocate-workforce', optionalAuth, controller.allocateWorkforce);
router.get('/disputes', optionalAuth, controller.getDisputes);
router.post('/resolve-dispute', optionalAuth, controller.resolveDispute);
router.get('/welfare-claims', optionalAuth, controller.getWelfareClaims);
router.post('/approve-claim', optionalAuth, controller.approveWelfareClaim);

// Invoicing
router.get('/invoice/:bookingId', optionalAuth, controller.getBookingInvoice);

module.exports = router;
