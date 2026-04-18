# Critical path flows (production readiness baseline)

This document defines the flows that must work for launch and regression testing. Scope is frozen for hardening; new features ship only after these pass quality gates.

## Roles

| Role | Primary goals |
|------|----------------|
| **Customer** | Register/login, discover contractors, book & pay, chat, notifications |
| **Contractor** | Register/login, profile visibility, receive bookings, chat, notifications |
| **Admin** | Login, moderate users/contractors, resolve reports, dashboard stats |

## Flows (end-to-end)

### Auth
1. Register as customer → login → `/auth/me` returns user
2. Register as contractor (with profile payload) → contractor row exists
3. Login with phone+password / email+password
4. OTP flows (if enabled) for existing accounts only
5. Logout clears session

### Contractor discovery
1. Search/list contractors (filters, location if applicable)
2. Open contractor profile / service detail
3. Lead or contact actions behave as designed

### Booking & payments
1. Create booking → Razorpay order (or explicit dev mock only when allowed)
2. Verify escrow signature path rejects invalid signatures
3. Customer/contractor see bookings in dashboards
4. Complete/release flow where applicable

### Chat
1. Create or open chat thread
2. Send/receive messages; only participants can read/write
3. Socket joins only authenticated user’s room and chats they belong to

### Admin
1. Admin-only routes reject non-admins
2. Key moderation actions (verify contractor, reports) succeed for admin

### Notifications
1. Booking/chat events create notifications
2. Mark read / mark all read

## Smoke references

- Repo smoke: `scripts/smoke-test.sh`
- Backend manual flow: `backend/test/run_flow.sh`

## Baseline capture

Run smoke scripts against a configured dev/staging environment after DB migrations (`backend`: `npm run migrate:all`) and document any known gaps in issue tracker—not in this file.
