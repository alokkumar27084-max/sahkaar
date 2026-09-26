# Payments & Escrow — full product page

Purpose
-------
Payments are handled via Razorpay with support for milestone/escrow-style releases to protect both the customer and worker.

What it contains
----------------
- Razorpay integration for payments and order creation
- Webhook handling for payment events
- Escrow release logic tied to booking milestones (documented in backend services)

Backend pointers
----------------
- Razorpay keys configured via env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- Payment-related endpoints and examples are in `backend/openapi.yaml`.
- Look for payment service: `backend/src/services/paymentService.js` (or similar).

Design & images
---------------
- Screenshot of checkout with payment button and escrow messaging.

How to test
-----------
- Use Razorpay test keys in a staging environment; simulate webhook events and verify the booking's payment status updates.

