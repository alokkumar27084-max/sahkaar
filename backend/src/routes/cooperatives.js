const express = require('express');
const router = express.Router();
const controller = require('../controllers/cooperativeController');
const { requireAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/role');

// Public / General Cooperative Directory & Forecast
router.get('/federations', controller.getFederations);
router.get('/societies', controller.getSocieties);
router.get('/society/:id', requireAuth, controller.getSocietyById);
router.get('/worker/:workerId/welfare', requireAuth, controller.getWorkerWelfareDetails);
router.get('/forecast', requireAuth, controller.getDemandForecast);

// Society Admin Endpoints
router.get('/stats/society/:societyId?', requireAuth, checkRole('society_admin', 'federation_admin', 'admin'), controller.getSocietyAdminStats);
router.post('/verify-worker', requireAuth, checkRole('society_admin', 'federation_admin', 'admin'), controller.verifyWorker);
router.post('/reject-worker', requireAuth, checkRole('society_admin', 'federation_admin', 'admin'), controller.rejectWorker);

// Federation Admin & Control Endpoints
router.get('/federation/pending-workers', requireAuth, checkRole('federation_admin', 'admin'), controller.getPendingWorkers);
router.get('/stats/federation', requireAuth, checkRole('federation_admin', 'admin'), controller.getFederationAdminStats);
router.post('/allocate-workforce', requireAuth, checkRole('federation_admin', 'admin'), controller.allocateWorkforce);
router.get('/dispatch-offers/me', requireAuth, controller.getMyDispatchOffers);
router.post('/dispatch-offers/:offerId/respond', requireAuth, controller.respondToDispatchOffer);
router.get('/disputes', requireAuth, checkRole('federation_admin', 'admin'), controller.getDisputes);
router.post('/resolve-dispute', requireAuth, checkRole('federation_admin', 'admin'), controller.resolveDispute);
router.get('/welfare-claims', requireAuth, checkRole('federation_admin', 'admin'), controller.getWelfareClaims);
router.post('/approve-claim', requireAuth, checkRole('federation_admin', 'admin'), controller.approveWelfareClaim);
router.post('/welfare-claims', requireAuth, checkRole('contractor', 'worker', 'master'), controller.fileWelfareClaim);

// Invoicing
router.get('/invoice/:bookingId', requireAuth, controller.getBookingInvoice);

module.exports = router;
