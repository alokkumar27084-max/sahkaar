# Booking & Scheduling — full product page

Purpose
-------
Booking and scheduling is the conversion flow — it lets a customer select a verified worker, choose a date/time or quick-book option, and proceed to payment.

What it contains (for reviewers)
--------------------------------
- Service selection → contractor → checkout
- Quick booking for same-day/urgent requests
- Booking lifecycle: requested → accepted/declined → in-progress → completed → reviewed

Frontend pointers
-----------------
- Booking checkout: `src/pages/customer/BookingCheckoutPage.jsx`
- Quick booking: `src/pages/customer/QuickBookingPage.jsx`
- Booking UI components: `src/components/booking/*`

Backend pointers
----------------
- API endpoints (see `backend/openapi.yaml`):
  - `POST /api/bookings` — create booking
  - `GET /api/bookings/:id` — booking details
  - Webhook endpoints for payment updates

Integrations & notes
--------------------
- Socket.io is used to notify workers of new booking requests (see backend Socket init in `backend/src/config/socket.js`).
- Booking timestamps and worker availability are stored in the database; check `backend/migrations` for table schema.

Design & images
---------------
- Include a screenshot of the booking checkout page showing price breakdown and scheduling controls.

How to test
-----------
1. Create a customer account and a verified contractor.
2. From the contractor listing, click Book → confirm a time and submit payment (use test mode or mock webhook events).
3. Verify booking appears for the contractor (Socket notification) and status changes work.

