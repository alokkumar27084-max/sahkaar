const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// PUBLIC ENDPOINT: This is called by Razorpay servers
// Signature verification is handled inside the controller
router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
