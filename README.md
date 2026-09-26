<div align="center">

# 🤝 SahKaar

### Cooperative Service Marketplace

**Verified Local Professionals • Smarter Service Discovery • Cooperative Trust**

<img width="1548" height="853" alt="WhatsApp Image 2026-09-26 at 20 21 58" src="https://github.com/user-attachments/assets/a36acbb0-119f-40ee-aa2d-dff2152b12d3" />


[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey.svg)](#)

**[Product Overview](#project-overview)** · **[Feature Documentation](#core-modules)** · **[Full-Stack Application](#getting-started)**

</div>

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Core Modules](#core-modules)
- [User Roles and Access](#user-roles-and-access)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Product Strengths](#product-strengths)
- [Security and Privacy](#security-and-privacy)
- [Documentation](#documentation)
- [Acknowledgments](#acknowledgments)

---

## Project Overview

**SahKaar** is a full-stack service marketplace that connects households and institutions with verified local professionals — electricians, plumbers, carpenters, painters, cleaners, appliance technicians, caregivers, and other skilled service providers.

The platform combines service discovery, location-aware matching, worker profiles, booking workflows, real-time communication, reviews, secure transaction flows, and cooperative administration into one product experience.

SahKaar is designed for a marketplace where customers need reliable local help, workers need professional digital visibility, and cooperative or platform administrators need tools to manage trust and service quality.

---

## Key Features

| Feature | Description |
|---|---|
| 🛠️ **Verified Worker Profiles** | Worker registration, profile management, portfolio information, availability, and verification status |
| 🔍 **Service Discovery** | Browse service categories and find professionals by skill, locality, rating, and distance |
| 📍 **Location-Aware Matching** | Select a locality or use location-based discovery to find relevant nearby workers |
| 🗺️ **Map and List Views** | Review results in list, split-map, or map-oriented experiences |
| 📅 **Booking and Scheduling** | Standard, quick-booking, meeting, and project-oriented booking flows |
| 💳 **Secure Transaction Flows** | Digital payment and transaction processing within the booking experience |
| ⭐ **Ratings and Reviews** | Customers build worker reputation through completed-service feedback |
| 💬 **Real-Time Communication** | Socket-based updates and chat-oriented coordination between users |
| 🛡️ **Admin Operations** | Worker review, verification queues, reports, statistics, and platform oversight |
| 🏛️ **Society and Federation Views** | Dedicated role-based dashboards for cooperative-level operations |
| 🤲 **Worker Welfare Support** | Product structures for welfare, insurance, and contribution visibility |
| 🌐 **Multilingual Experience** | Language context with English/Hindi-ready product flows |
| 📊 **Demand Planning Hooks** | Product direction for demand forecasting and workforce allocation |
| 📱 **Responsive Product UI** | Premium interface for clear service discovery and accessible workflows |

---
<img width="1600" height="761" alt="image" src="https://github.com/user-attachments/assets/41279e6e-10be-421a-a22c-8eba19b70414" />


## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        SAHKAAR ECOSYSTEM                      │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│   │   Customer   │   │    Worker    │   │  Cooperative │      │
│   │  Experience  │   │  Workspace   │   │ Admin Views  │      │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘      │
│          │                  │                  │              │
├──────────┴──────────────────┴──────────────────┴──────────────┤
│                        REACT FRONTEND                          │
│  • Service discovery        • Worker profiles                  │
│  • Booking and checkout     • Location and map views            │
│  • Dashboards and chat      • Auth, language, theme, alerts     │
├──────────────────────────────────────────────────────────────┤
│                       EXPRESS BACKEND                          │
│  • Authentication and RBAC  • Worker and booking workflows      │
│  • Reviews and reports      • Payment processing                │
│  • Admin operations         • Socket.io real-time events        │
├──────────────────────────────────────────────────────────────┤
│                    DATA & INTEGRATIONS                         │
│  • PostgreSQL                • Map and location services        │
│  • File uploads              • Payment provider integration      │
│  • API contract              • Notification and real-time services│
└──────────────────────────────────────────────────────────────┘
```

<img width="1536" height="1024" alt="89835fc5-3e02-45f0-a44a-94f2cc4f3fc3" src="https://github.com/user-attachments/assets/121a8779-7672-4126-969d-010b0d19685b" />

---

## Core Modules

### 1. Service Discovery and Marketplace Search

SahKaar gives customers a direct way to find professionals for common household and community services.

**Discovery flow**
```
Choose service → Select locality → Apply filters → Compare workers
→ Open profile → Start booking
```
<img width="1600" height="869" alt="image" src="https://github.com/user-attachments/assets/73ff64f8-3751-49dd-808c-a22b208cbca6" />

**What customers can see**
- Service category and skill
- Worker name and profile information
- Cooperative affiliation or verification information
- Distance and locality
- Ratings and experience
- Visit fee or service pricing cues
- Availability and booking actions

**Product benefits**
- Reduces time spent searching for reliable workers
- Makes local professionals easier to discover
- Gives customers meaningful comparison signals
- Creates a consistent entry point for every service category

**Main implementation areas**
- `src/pages/customer/HomePage.jsx`
- `src/pages/customer/SearchPage.jsx`
- `src/pages/customer/AllCategoriesPage.jsx`
- `src/pages/customer/ContractorProfilePage.jsx`
- `backend/src/`

---
<img width="1162" height="898" alt="image" src="https://github.com/user-attachments/assets/13da9e6f-cac9-406b-b5ca-c72adee9e2ae" />

### 2. Worker Registration and Verification

Worker verification creates the trust layer of the marketplace. Workers can create professional profiles, provide service information, and become eligible for discovery after review.

**Verification flow**
```
Worker registration → Profile completion → Admin review
→ Verification decision → Public worker profile → Booking eligibility
```

**Worker profile capabilities**
- Trade and service categories
- Experience and service description
- Profile image and portfolio
- Availability status
- Service location
- Cooperative affiliation information
- Ratings and customer feedback

**Administrative controls**
- View pending worker profiles
- Review profile information
- Approve or reject verification requests
- Monitor worker status and marketplace participation

**Main implementation areas**
- `src/pages/contractor/ContractorRegisterPage.jsx`
- `src/pages/contractor/ContractorEditPage.jsx`
- `src/pages/contractor/ContractorDashboard.jsx`
- `src/pages/admin/AdminDashboardPage.jsx`
- `backend/src/controllers/`

---

### 3. Location-Aware Matching and Maps

Location is central to local services. Customers can select an area, use location-based discovery, and find professionals who serve the selected locality.

**Location flow**
```
Search locality or detect location → Select service area
→ Find nearby professionals → Compare distance and availability
```

**Supported product experiences**
- Locality search
- Current-location selection
- Popular area selection
- Search radius and distance context
- Worker list view
- Split-map experience
- Interactive map markers

**Main implementation areas**
- `src/components/common/LocationSelectorModal.jsx`
- `src/context/LocationContext.jsx`
- `src/pages/customer/SearchPage.jsx`
- `src/pages/customer/AllCategoriesPage.jsx`
- `@react-google-maps/api` integration

---

### 4. Booking and Scheduling

The booking module converts service discovery into an actionable request. Customers can choose a worker, provide service details, select a booking mode, and coordinate the next steps.

**Booking flow**
```
Select worker → Choose booking type → Add service details
→ Select schedule → Confirm request → Track status → Complete service
```

**Booking experiences**
- Standard service booking
- Quick booking for urgent requirements
- Meeting or consultation booking
- Project-oriented service workflows
- Customer dashboard for request visibility
- Worker dashboard for incoming requests and status management

**Booking lifecycle**
```
Requested → Accepted → In progress → Completed → Reviewed
```

**Main implementation areas**
- `src/pages/customer/BookingCheckoutPage.jsx`
- `src/pages/customer/QuickBookingPage.jsx`
- `src/pages/customer/MeetingBookingPage.jsx`
- `src/pages/project/ProjectDashboard.jsx`
- `src/pages/customer/CustomerDashboard.jsx`

---

### 5. Payments and Transaction Trust

SahKaar includes secure transaction workflows for service bookings. The payment layer is designed to make pricing, payment status, and service completion easier to manage.

**Transaction flow**
```
Booking confirmation → Payment initiation → Service progress
→ Completion confirmation → Transaction status update
```

**Product goals**
- Clear pricing and booking information
- Reliable payment status tracking
- Better confidence for customers and workers
- Support for milestone-oriented project work
- A foundation for cooperative and worker settlement workflows

**Main implementation areas**
- `backend/src/`
- `backend/openapi.yaml`
- `src/pages/customer/BookingCheckoutPage.jsx`
- Razorpay integration package in `backend/package.json`

---

### 6. Ratings, Reviews, and Reputation

Reviews help customers choose professionals and give workers a way to build a trusted reputation over time.

**Review flow**
```
Service completed → Customer submits rating and review
→ Review associated with worker → Reputation shown on profile
```

**Trust signals**
- Average rating
- Number of reviews
- Service-specific feedback
- Verification status
- Experience and cooperative association

**Main implementation areas**
- Contractor profile and booking completion flows
- `GET /api/reviews/contractor/:id`
- `POST /api/reviews/contractor/:id`
- Backend review controllers and persistence layer

---

### 7. Real-Time Chat and Notifications

Real-time communication helps customers and workers coordinate service details, booking updates, and completion information.

**Communication flow**
```
Booking or conversation event → Real-time notification
→ User opens chat → Details confirmed → Status updated
```

**Product use cases**
- New booking notifications
- Booking acceptance or decline updates
- Customer-worker coordination
- Service status communication
- Conversation history within the product experience

**Main implementation areas**
- `src/pages/chat/ChatLayout.jsx`
- Socket client services under `src/services/`
- Backend Socket.io initialization under `backend/src/config/`

---

### 8. Admin, Society, and Federation Operations

SahKaar supports role-based operational views so platform and cooperative administrators can manage the marketplace responsibly.

**Admin responsibilities**
- Review worker onboarding
- Manage verification status
- Monitor service activity
- Review reports and issues
- Track marketplace statistics
- Support cooperative governance workflows

**Role structure**
```
Platform Admin
    ├─ Society Admin
    │    └─ Local worker and service operations
    └─ Federation Admin
         └─ Higher-level reporting and coordination
```

**Main implementation areas**
- `src/pages/admin/AdminDashboardPage.jsx`
- `src/pages/admin/SocietyAdminDashboard.jsx`
- `src/pages/admin/FederationAdminDashboard.jsx`
- `src/pages/admin/ProtectedRoute.jsx`
- Admin APIs under `backend/src/`

---

### 9. Worker Welfare and Insurance Support

The product includes structures for worker welfare, insurance visibility, and cooperative contribution tracking. These capabilities support a marketplace model that values worker protection alongside customer convenience.

**Welfare product flow**
```
Service booking → Contribution or welfare record
→ Worker coverage visibility → Cooperative reporting
```

**Product goals**
- Make welfare participation visible
- Support worker safety and protection programs
- Provide cooperative administrators with contribution context
- Connect service activity with longer-term worker support

**Main implementation areas**
- Welfare accounting integrated with booking post-processing
- Reports and export endpoints for admin users
- Worker profile support for welfare/benefit information

---

### 10. Demand Forecasting and Workforce Planning

SahKaar is structured to support demand planning by service category and location. Historical booking data can help cooperatives understand demand patterns and prepare worker capacity.

**Planning flow**
```
Booking history → Category and locality aggregation
→ Demand trend analysis → Capacity planning → Worker allocation
```

**Potential uses**
- Identify seasonal service demand
- Discover underserved localities
- Plan worker availability
- Improve training and resource allocation
- Support federation-level operational decisions

**Main implementation areas**
- Booking and search history aggregation
- Locality-based demand dashboards
- AI-ready analytics architecture

---

## User Roles and Access

<table>
<tr><th>Role</th><th>Capabilities</th></tr>
<tr>
<td><strong>Customer</strong></td>
<td>Browse services and categories · Select a location · Search and compare workers · Book services · Coordinate with providers · Track service activity · Submit ratings and reviews</td>
</tr>
<tr>
<td><strong>Worker / Contractor</strong></td>
<td>Register and manage profile · Add service skills and portfolio information · Set availability · Receive and manage booking requests · Coordinate with customers · Build a service reputation</td>
</tr>
<tr>
<td><strong>Society Administrator</strong></td>
<td>Review local worker onboarding · Manage verification decisions · Monitor service operations · Support worker welfare workflows</td>
</tr>
<tr>
<td><strong>Federation Administrator</strong></td>
<td>Review higher-level operations · Monitor cooperative performance · Support capacity planning and coordination</td>
</tr>
<tr>
<td><strong>Platform Administrator</strong></td>
<td>Manage platform-level operations · Review reports and statistics · Support marketplace trust and governance</td>
</tr>
</table>

---
<img width="1312" height="1199" alt="55ffe962-b483-4057-bb76-f589745bac9f" src="https://github.com/user-attachments/assets/b0d68b38-6648-4db6-aceb-de3de53562b3" />

## Technology Stack

**Frontend**
- React 18
- Create React App / react-scripts
- React Router
- Tailwind CSS
- Framer Motion and GSAP
- React Hot Toast
- Google Maps React integration
- Socket.io client
- React Helmet Async

**Backend**
- Node.js
- Express
- PostgreSQL client and migrations
- Socket.io
- JWT authentication
- Cookie and bearer-token support
- Helmet and rate limiting
- Multer for local upload handling
- OpenAPI documentation

**Integrations**
- Maps and location services
- Digital payment provider integration
- Real-time WebSocket communication
- Email and notification services
- Optional OAuth and Firebase services

**Testing**
- Node.js test runner and Supertest for backend tests
- Playwright for end-to-end browser testing
- Release and smoke-check scripts

---

## Repository Structure

```
sahkaar/
├── backend/
│   ├── src/                    # Express application, routes, controllers, services
│   ├── migrations/             # Database schema migrations
│   ├── test/                   # Backend tests
│   ├── openapi.yaml            # API contract
│   └── package.json            # Backend scripts and dependencies
├── src/
│   ├── components/             # Shared interface components
│   ├── pages/                  # Customer, worker, project, chat, and admin screens
│   ├── context/                # Auth, language, theme, location, notifications
│   ├── services/                # Frontend API and integration services
│   ├── hooks/                   # Reusable React hooks
│   ├── i18n/                    # Localization resources
│   └── App.jsx                  # Application routes and providers
├── docs/
│   ├── features/                # Product feature documentation
│   └── assets/                  # Hero and documentation visuals
├── public/                       # Static frontend assets
├── e2e/                           # Browser-level test flows
├── scripts/                       # Local checks and utility scripts
├── package.json                   # Frontend scripts and dependencies
└── playwright.config.js           # End-to-end test configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A local PostgreSQL installation for backend development
- A local environment configuration for backend connectivity
- Optional integration credentials for maps, payments, email, or OAuth features

### Frontend setup

```bash
npm install
npm start
```

### Backend setup

```bash
cd backend
npm install
npm run dev
```

> Use local environment configuration for any database or integration values. Never commit real credentials, tokens, private keys, or production environment files.

---

## Testing

```bash
# backend tests
cd backend
npm test

# from the repository root: install Playwright browsers once
npm run test:e2e:install

# run browser tests
npm run test:e2e
```

---

## Product Strengths

**Customer experience**
- Fast path from service need to trusted professional
- Locality-aware discovery
- Clear worker profiles and trust indicators
- Multiple booking modes for different service needs
- Transparent communication throughout the service journey

**Worker experience**
- Professional digital profile
- Better visibility in local markets
- Better structure for booking and availability
- Reputation building through customer feedback
- Support for cooperative and welfare-oriented operations

**Platform operations**
- Role-based access and protected workflows
- Verification and reporting tools
- Modular frontend and backend architecture
- Real-time event support
- Clear separation between product documentation and private operations

---

## Security and Privacy

- Never commit `.env` files or real credentials.
- Keep production secrets in private environment management systems.
- Do not publish private infrastructure addresses, webhook secrets, database credentials, or administrative passwords.
- Use test credentials and sandbox integrations during local development.
- Review uploaded files and logs before publishing repository changes.

This public README intentionally explains the product without exposing private deployment or operational information.

---

## Documentation

- Feature documentation index
- Backend service overview
- Critical paths
- User acceptance checklist
- API contract

---

## Acknowledgments

SahKaar is built with the open-source communities behind React, Node.js, Express, PostgreSQL, Socket.io, Playwright, Tailwind CSS, mapping tools, and the wider JavaScript ecosystem.

<div align="center">

**Made with 🤝 for stronger, more trusted local service ecosystems**

</div>
