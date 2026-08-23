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

// Federation Admin Endpoints
router.get('/stats/federation', optionalAuth, controller.getFederationAdminStats);

module.exports = router;
