const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

// All booking routes require authentication
router.use(authMiddleware.requireAuth);

// Generate Escrow Order
router.post("/quote", bookingController.getPricingQuote);
router.post("/", bookingController.createBooking);

// Verify Signature
router.post("/verify", bookingController.verifyEscrow);

// Customer fetching previous history
router.get("/me", bookingController.getMyBookings);

// Mark Complete -> Release
router.put("/:bookingId/complete", bookingController.releaseAndComplete);

module.exports = router;
