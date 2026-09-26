# SahKaar — Cooperative Service Marketplace (Product README)

<p align="center">
  <img src="docs/assets/sahkaar-hero.svg" alt="SahKaar hero" width="1100" />
</p>

Overview
--------
SahKaar is a production‑ready web product that connects households and institutions with verified local service professionals (electricians, plumbers, carpenters, painters, cleaners, technicians) managed through cooperative societies and federations.

This repository contains a full-stack implementation: a React frontend (Create React App) and a Node.js + Express backend, together with API documentation, deployment runbooks, tests, and product-level feature documentation.

Purpose of this README
----------------------
This README is written for engineers, product reviewers, evaluators, and maintainers who open the repo and want a fast but complete view of:
- What the product does (features and user flows)
- Where each feature is implemented in the codebase (file and route pointers)
- How to run, test, and deploy the application locally and in production
- Assets and screenshots that demonstrate the product UI

Top-level quick links
---------------------
- Backend OpenAPI: backend/openapi.yaml
- Backend README & runbook: backend/README.md
- Production deploy runbook: DEPLOYMENT_GUIDE.md
- Feature pages: docs/features/
- Frontend entry: src/App.jsx (routes & lazy pages)

How this repo is organized (concise)
-----------------------------------
```
README.md
DEPLOYMENT_GUIDE.md
backend/                # Express API: src/, migrations/, openapi.yaml, uploads/
docs/                   # product feature pages + assets
public/                 # frontend static files
src/                    # React frontend app (App.jsx, pages, components)
package.json            # frontend scripts & dependencies
```

Run this product locally (fast path)
-----------------------------------
Prereqs: Node 18+, PostgreSQL 15+, psql CLI

1) Backend
```bash
cd backend
npm ci
cp .env.example .env            # set DATABASE_URL, FRONTEND_URL, RAZORPAY_*, JWT_SECRET
npm run migrate:all             # create schema and seed (if available)
npm run dev                     # starts server (default http://localhost:5000)
```
2) Frontend
```bash
# from repo root
npm ci
npm start                        # runs CRA dev server (http://localhost:3000)
```
Open the frontend and ensure REACT_APP_API_URL (or proxy) points at backend.

Production build (short)
```bash
# frontend
npm run build
# backend
cd backend && NODE_ENV=production npm start
```
Follow DEPLOYMENT_GUIDE.md for reverse proxy, TLS, backups, and webhook setup.

Security & environment
----------------------
- Never commit .env files. Use `.env.example` and `.env.production.example` as templates.
- Critical backend env vars (see backend/src/config/validateEnv.js):
  - DATABASE_URL, JWT_SECRET, FRONTEND_URL
  - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
  - ADMIN_EMAIL, ADMIN_PASSWORD (optional auto‑create admin)

Feature catalog (what the product contains — full detail)
---------------------------------------------------------
Each feature below explains the user-facing behaviour, the key UI or API locations where it is implemented in this repo, and notes for reviewers.

1) Service discovery & search (Customer)
- User value: discover verified cooperative workers by service type and locality, with list / split‑map view and detailed contractor profiles.
- Frontend pages:
  - src/pages/customer/SearchPage (search & split-map listing)
  - src/pages/customer/AllCategoriesPage (service catalog)
  - src/pages/customer/ContractorProfilePage (profile & contact)
- Backend endpoints:
  - GET /api/contractors/search
  - GET /api/contractors/featured
  - GET /api/contractors/:id
- Notes for reviewers: UI uses Google Maps SDK (@react-google-maps/api) and a split-map layout. See src/App.jsx for routing.

2) Booking & scheduling (Customer → Worker)
- User value: request a service, pick a time slot or quick booking, and confirm with payment / escrow steps.
- Frontend pages:
  - src/pages/customer/BookingCheckoutPage
  - src/pages/customer/QuickBookingPage
  - src/pages/project/ProjectDashboard (for multi-stage work)
- Backend endpoints: (review openapi.yaml for full spec)
  - POST /api/bookings (create booking) — check in openapi.yaml
  - Webhooks for payment status are handled via backend payment webhook endpoints (see backend/openapi.yaml)
- Notes: Booking UI connects to contractor profiles and sends notifications via Socket.io.

3) Worker registration & verification
- User value: workers register, attach cooperative membership proofs and skill certifications; admins verify.
- Frontend pages:
  - src/pages/contractor/ContractorRegisterPage
  - src/pages/contractor/ContractorEditPage
- Backend endpoints:
  - POST /api/auth/register
  - GET /api/admin/contractors/pending (admin)
  - PATCH /api/admin/contractors/:id/verify (admin)
- Key backend files to inspect: backend/src/controllers/contractorController.js (module name referenced in checks), backend/migrations for user and contractor tables.

4) Payments & milestone escrow
- User value: digital payments with Razorpay, milestone-based escrow releases to protect both customers and workers.
- Backend integration: razorpay package used in backend (see backend/package.json).
  - Ensure RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET are set in production env.
  - The payment endpoints and webhook handling are specified in backend/openapi.yaml.
- Notes for reviewers: DEPLOYMENT_GUIDE.md includes webhook URL recommendations.

5) Ratings, reviews & trust signals
- User value: customers rate completed services, building worker reputation and cooperative trust.
- Frontend: review submission components on contractor profile and booking flow.
- Backend endpoints:
  - GET /api/reviews/contractor/:id
  - POST /api/reviews/contractor/:id

6) Geo-dispatch & maps
- User value: match customers to local workers using geolocation, distance-based ranking, and split-map UI.
- Frontend modules: src/components map-related components and src/pages/customer/SearchPage.
- Backend: contractor profiles contain geolocation fields; DB uses indexes for geospatial queries (see migrations).
- Libraries: @react-google-maps/api on frontend; Postgres with appropriate indexes on backend.

7) Admin dashboards (Society & Federation)
- User value: cooperative and federation admins approve workers, run reports, and manage welfare contributions.
- Frontend pages:
  - src/pages/admin/AdminDashboardPage
  - src/pages/admin/FederationAdminDashboard
  - src/pages/admin/SocietyAdminDashboard
- Backend endpoints:
  - GET /api/admin/stats
  - GET /api/admin/reports
  - PATCH /api/admin/reports/:id
- Notes: Admin routes are protected and require admin roles. See backend/src/config/validateEnv.js for production checks.

8) Worker welfare, insurance & ledger
- User value: show welfare contributions per booking and track insurance coverage (e.g., group accident scheme) on worker profiles.
- Repo: worker welfare is referenced in product docs and worker profile fields; the governance/payroll flow integrates with bookings and payments.
- Implementation hooks: backend services (e.g., services/welfareService.js) — search backend/src/services for welfare/dispatch naming.

9) Real-time chat & notifications
- User value: customers and workers can coordinate via Socket.io-powered channels for booking confirmations and updates.
- Frontend: src/pages/chat/ChatLayout and socket client in src/services/socket or similar.
- Backend: Socket.io server initialized in backend/src/config/socket and start in backend/src/index.js.

10) AI / demand forecasting (Product plan)
- User value: forecast demand by trade and location so federations can plan training and mobilize workers.
- Repo status: product-level hooks and docs exist; a production forecasting pipeline is in roadmap and can use historical bookings data from Postgres (tables: bookings, contractors, services).

Where to find API documentation
------------------------------
The canonical API spec is `backend/openapi.yaml`. Use it to inspect request/response schemas and examples. It covers auth, contractor endpoints, bookings, reviews, admin routes, and payments.

Testing & QA
------------
- Frontend e2e: Playwright (playwright.config.js). Run with `npm run test:e2e` after `npm run test:e2e:install`.
- Backend unit / integration: `cd backend && npm test` (node test runner).
- Smoke checks: `npm run smoke` runs a smoke script that calls critical paths.

CI / CD (recommended)
----------------------
- Add a simple GitHub Actions workflow to run frontend lint, backend tests, and Playwright smoke on PRs.
- Suggested branches: `main` (protected), `develop`, feature/* for work.

Contributing & release notes
----------------------------
- Use small, focused PRs. Update relevant docs under docs/features when adding or changing behaviour.
- CHANGELOG.md and RELEASE_NOTES.md should be updated for every release.

Assets & screenshots
--------------------
- Primary hero banner: docs/assets/sahkaar-hero.svg (included)
- Additional screenshots: place web-optimized PNGs under docs/assets/screenshots/ and reference them in docs/features pages. (You provided several UI screenshots — I will add them when you upload them.)

Branch & PR strategy for this update
------------------------------------
I created the branch `docs/sahkaar-brand-refresh` and staged documentation additions. I will continue with a fully expanded product README and detailed feature pages (docs/features/*) if you confirm.

If you want the repo to present like a startup product, I will:
1. Expand each docs/features page to include a small screenshot (you can upload more images) and a compact implementation guide:
   - UI flow (screens / components)
   - API endpoints (OpenAPI paths)
   - DB tables / migrations to inspect
2. Add CONTRIBUTING.md, PR_TEMPLATE.md, and a LICENSE (MIT by default unless you prefer otherwise).

Next steps — what I will do now if you confirm
------------------------------------------------
- Commit the comprehensive README and per-feature documents to branch `docs/sahkaar-brand-refresh` (I already started this branch and added the hero SVG).
- Create concise product-oriented docs for each feature including images (I will insert the screenshots you upload into docs/assets/screenshots/).
- Open a draft PR so you can review the documentation before we merge to main.

Please confirm:
- Use branch `docs/sahkaar-brand-refresh` (yes/no)
- Preferred license (MIT unless you say otherwise)
- Upload any additional screenshots you want included (I will add them to docs/assets/screenshots/)

