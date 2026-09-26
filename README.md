# SahKaar — Cooperative Service Marketplace

<p align="center">
  <img src="docs/assets/sahkaar-hero.svg" alt="SahKaar hero" width="1100" />
</p>

SahKaar is a digital marketplace for discovering, booking, and managing trusted local home and community services. The platform brings together customers, verified workers, and cooperative administrators in a single workflow designed to improve trust, speed, and service quality.

This repository contains the product frontend, backend services, tests, and project documentation for the platform.

## What this product includes

- Verified worker profiles and service discovery
- Search by locality and service category
- Booking and scheduling flows
- Ratings and trust signals
- Admin oversight for worker and service operations
- Real-time communication and local coordination
- Secure payment integration and transaction workflows

## Product architecture

```text
Frontend web app
  ├─ Search and service discovery
  ├─ Worker profiles and booking flows
  ├─ Admin and governance dashboards
  └─ Real-time interactions and notifications

Backend services
  ├─ Authentication and role-based access
  ├─ Worker, booking, and review workflows
  ├─ Admin operational APIs
  └─ Secure payment and processing layers

Data layer
  ├─ User and profile records
  ├─ Service bookings and reviews
  └─ Operational reporting and coordination data
```

## Why this repo is organized this way

This repository is structured to communicate the product clearly to reviewers and engineers without exposing sensitive operational details. The public-facing documentation focuses on product value, user experience, and implementation structure rather than deployment secrets or private infrastructure configuration.

## Quick start

### Frontend

```bash
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Local development notes

- Use your own local environment configuration for database and API connectivity.
- Keep secrets and private configuration out of the public repository.
- Production deployment details are intentionally not included in this public repo for security reasons.

## Feature areas

- Worker onboarding and verification
- Local service discovery
- Booking and scheduling
- Messaging and coordination
- Reviews and trust
- Admin reporting and oversight
- Service quality and operations

## Documentation

- [docs/features/README.md](docs/features/README.md)
- [backend/README.md](backend/README.md)
- [docs/CRITICAL_PATH.md](docs/CRITICAL_PATH.md)
- [docs/UAT_CHECKLIST.md](docs/UAT_CHECKLIST.md)

## Security note

This project contains product and implementation details, but it intentionally omits production system secrets, private infrastructure configuration, and deployment information from the public repository.

## Design direction

The product is designed with a premium, trustworthy, service-marketplace aesthetic: clean white surfaces, deep navy navigation, high-contrast trust states, and warm accent colors used to highlight verified professionals and service categories.

---

Built for a modern cooperative service marketplace experience.
