# SahKaar — Cooperative Service Marketplace

Verified local professionals. Cooperative-first service delivery.

LIVE DEMO  •  PRODUCT OVERVIEW  •  FEATURE DOCS  •  SECURE BY DESIGN

---

Project overview
----------------
SahKaar is a production-grade marketplace that connects households, institutions, and small businesses with verified local service professionals (electricians, plumbers, carpenters, painters, cleaners, appliance technicians, caregivers and more). Built around cooperative societies and federations, SahKaar emphasizes trust, fairness, and operational transparency — helping local artisans gain digital visibility while giving customers a reliable way to book services.

This project combines a modern React frontend with a Node.js backend, location-aware discovery, real-time communications, identity verification workflows, secure payments, and admin tools for cooperative governance.

Key features
------------
- Verified worker onboarding and cooperative affiliation
- Multi-category service discovery and visual service catalogue
- Geo-aware search with split-map & list views
- Booking types: quick booking, scheduled bookings, and project bookings
- Milestone-based payments and secure transaction handling
- Ratings, reviews, and reputation systems
- Real-time chat and notifications (Socket.io)
- Admin dashboards for societies & federation-level governance
- Worker welfare ledger and contribution tracking
- AI & analytics hooks for demand forecasting and capacity planning
- Multilingual UI and accessibility-first content

System architecture (high level)
--------------------------------
┌──────────────────────────────────────────────────────────────┐
│                          SAHKAR ECOSYSTEM                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Customer UI   ↔   Frontend SPA (React + Tailwind)           │
│     ↑                Routing, Contexts, Maps, Auth           │
│     │                                                       │
│  Worker UI     ↔   Frontend (contractor pages, portfolio)    │
│     ↑                Booking widgets, availability settings  │
│     │                                                       │
│  Admin UI      ↔   Frontend (dashboards, reports)           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                    Backend API & Services (Node.js)         │
│  • Auth, RBAC, validation                                    │
│  • Contractors, Bookings, Reviews, Payments                  │
│  • Geo-dispatch & matching                                   │
│  • Welfare accounting & reporting                            │
│  • Socket.io real-time layer                                  │
├──────────────────────────────────────────────────────────────┤
│                       Data & Integrations                    │
│  • PostgreSQL (profiles, bookings, reviews)                  │
│  • Object storage (uploads)                                  │
│  • Payment gateway (Razorpay or chosen provider)             │
│  • Maps (Google Maps SDK / alternatives)                     │
└──────────────────────────────────────────────────────────────┘

Core modules (deep dive)
------------------------
Below are the core functional modules and how they behave at the product level.

1) Worker onboarding & verification
----------------------------------
Purpose: Establish a trust boundary by verifying worker identity, cooperative membership, and trade skill certificates.

How it works (product flow):
- Worker registers with phone/email and uploads identity and cooperative membership proof
- Worker fills a trade profile (categories, skills, rates, portfolio images)
- Submission goes into a pending verification queue for society / federation review
- Admin approves or requests additional evidence; approved workers get “Verified” badges

Customer value: Clear trust signals, cooperative affiliation, higher conversion rates.

Implementation pointers:
- Frontend: contractor registration & edit pages
- Backend: verification queue APIs, admin approve endpoints, uploads handling

2) Service discovery & geo-matching
-----------------------------------
Purpose: Help customers find the nearest and most relevant verified professionals quickly.

Product behavior:
- Location selector as a first step (manual search, autocomplete, or GPS)
- Search by category, filters (ratings, price, distance), and urgency
- List, Split‑map, and Map-only views with interactive markers and result cards

Search & ranking:
- Proximity + verification + rating + availability = score
- Emergency or urgent flags can boost ranking for immediate dispatch

Implementation pointers:
- Frontend: SearchPage, AllCategoriesPage, Map components
- Backend: contractor search API, DB indexes for geospatial queries

3) Booking, scheduling & lifecycle
---------------------------------
Purpose: Convert discovery into scheduled work with transparent milestones.

Product flow:
- Customer selects a worker and booking type (Quick / Scheduled / Project)
- Booking contains service details, expected duration, and milestone break-down (if applicable)
- Booking notifications sent to worker via Socket.io; worker accepts/declines
- Status transitions: requested → accepted → in-progress → completed → reviewed

Payments:
- Customer pays via digital gateway; platform supports staged escrow and milestone release (product-level support)

Implementation pointers:
- Frontend: BookingCheckoutPage, QuickBooking flow
- Backend: bookings controller, payment integration, webhook handlers

4) Real-time coordination & chat
--------------------------------
Purpose: Ensure customer and worker can communicate clearly and update service status in real-time.

Product behavior:
- In-app chat and notifications for booking updates
- Push-like events via WebSockets for new requests, cancellations, and confirmations

Implementation pointers:
- Socket.io server init on backend; client socket hook on frontend

5) Admin dashboards & governance
--------------------------------
Purpose: Provide societies and federations with tools to manage verification, welfare, reporting, and dispute resolution.

Product behavior:
- Pending verification queues
- Operational KPIs (bookings, revenue, worker signups)
- Welfare ledger and contribution reports
- Report handling: disputes, refunds, and escalations

Implementation pointers:
- Frontend admin pages and protected routes
- Backend admin APIs and role-based access control

6) Worker welfare & insurance ledger
------------------------------------
Purpose: Track and surface welfare corpus contributions and insurance cover on worker profiles.

Product behavior:
- A small configurable contribution per booking is tracked for the local welfare fund
- Worker profile shows insurance/coverage badges if supplied
- Admins can export welfare contribution reports for audits

Implementation pointers:
- Welfare accounting integrated with booking post-processing
- Reports and export endpoints for admin users

7) Ratings & trust
------------------
Purpose: Create a feedback loop that rewards quality and highlights consistently good performers.

Product behavior:
- Ratings and short reviews after booking completion
- Aggregated rating per category and worker profile
- Admin moderation pipeline for abusive or fake reviews

Implementation pointers:
- Reviews endpoints and frontend UI components

8) AI & product analytics (demand forecasting)
----------------------------------------------
Purpose: Provide federations and societies with forecasting that helps staffing and training decisions.

Product hooks:
- Aggregate historical bookings by category & location
- Provide simple moving-average or seasonal forecasts in dashboards
- ML/Batch pipelines are planned as extensions (product includes hooks & data exports)

Implementation pointers:
- Use booking and search logs as primary data source
- Provide example scripts / notebooks in docs/analytics when required

User roles
----------
- Customer: discover services, book, pay, track, review
- Worker/Contractor: register, manage profile, receive bookings, update availability
- Society Admin: verify workers, manage welfare funds, review reports
- Federation Admin: higher-level operational reporting and policy parameters
- Platform Admin: system-level configuration, monitors, and audits

Technology stack (suggested)
----------------------------
- Frontend: React 18 (Create React App), Tailwind CSS, @react-google-maps/api
- Backend: Node.js + Express, Socket.io
- Database: PostgreSQL (with geospatial indexes) or PostGIS where required
- Storage: Object storage for uploads (S3 compatible)
- Payments: Razorpay / chosen payment provider (use sandbox/test keys for dev)
- Testing: Playwright e2e, Jest/mocha for unit tests

Getting started (local dev)
---------------------------
> Note: This project intentionally omits production deployment secrets. Use local environment files and secure vaults for any sensitive configuration.

1) Frontend
```bash
# from repo root
npm install
npm start
```

2) Backend
```bash
cd backend
npm install
cp .env.example .env    # edit local values (DATABASE_URL, REACT_APP_API_URL, etc.)
npm run migrate:all
npm run dev
```

3) Test (smoke / e2e)
```bash
# e2e (requires playwright installed)
npm run test:e2e:install
npm run test:e2e

# backend tests
cd backend && npm test
```

Operational strengths
---------------------
- Trust-first marketplace model optimized for cooperative networks
- Local-first discovery reduces travel time and improves conversions
- Modular service flows so cooperatives can adopt features progressively
- Real-time coordination for improved service reliability

Security & privacy
------------------
- Never commit private `.env` files. Use `.env.example` templates only.
- Production secrets and infrastructure configuration must be kept in secure stores (Vault, cloud KMS) and not in the public repo.
- Audit trails for bookings, payments, and admin actions should be retained for compliance purposes.

Contributing & release process
-------------------------------
- Fork -> Feature branch (feature/xyz) -> Open a PR against `main` or `develop`
- Include unit tests or e2e tests for critical flows
- Update docs/features/* when changing product behaviour

Acknowledgements
----------------
This project is built on many open-source building blocks. Special thanks to the communities around React, Node.js, OpenStreetMap/Google Maps, and the open computer-vision tooling used for related problems.

---

If you want, I can now:
1) Replace the root README on the `docs/sahkaar-brand-refresh` branch with this full product README.
2) Expand any single feature page into a step-by-step product + implementation guide with screenshots and code pointers.
3) Create a draft PR for you to review before merging to `main`.

Reply with which actions you'd like me to take next.