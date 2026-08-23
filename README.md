# SahKaari (सहकारी)
**Bharat's Cooperative-Owned Digital Marketplace for Verified Labour Cooperative Societies & Skilled Tradesmen**

---

## 🏛️ Vision & Mission

**SahKaari** bridges India's informal skilled trade economy with structured cooperative governance. By linking **State Labour Cooperative Federations**, **Primary Cooperative Societies**, and verified artisans, SahKaari eliminates exploitative middlemen, guarantees social security (PM Suraksha Bima + Welfare Fund Pool), and provides households and institutions with 100% verified, reliable services.

---

## 🏗️ 3-Tier Cooperative Architecture

```
┌─────────────────────────────────────────────────────────┐
│     State Labour Cooperative Federation (Apex Body)     │
│   • Macro Demand Forecasting & Skilling Resource Pool   │
│   • State-level Social Security & Welfare Corpus        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│          Primary Cooperative Society (District)         │
│   • Onboarding & Physical Identity / Skill Verification │
│   • Local Worker Allocation & Dispute Arbitration       │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Verified Cooperative Worker                │
│   • 100% Fair Payouts + Welfare Allocation              │
│   • Pradhan Mantri Suraksha Bima Accident Cover         │
│   • Real-Time Geo Dispatch & Digital Escrow             │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

1. **Cooperative Governance & Verification**:
   - Primary Society verification stamp on worker profiles.
   - NCCT-certified skills accreditation.
   - Dual-tier administrative portals (`Federation Admin` & `Society Admin`).

2. **Worker Welfare & Social Security**:
   - Automated ₹25 contribution per booking into the District Society Welfare Corpus.
   - Integrated ₹5,00,000 Group Accident / PM Suraksha Bima policy tracking on every worker profile.

3. **AI-Driven Demand Forecasting Engine**:
   - Statistical moving-average demand forecasting by trade category and locality.
   - Predictive capacity planning for societies to mobilize artisans ahead of seasonal peaks.

4. **Emergency / Urgent On-Demand Dispatch**:
   - Instant 45-minute priority dispatch toggle for emergency plumbing, electrical breakdown, and civil repairs.

5. **Milestone Escrow Payment Protection**:
   - Razorpay multi-stage escrow releasing funds only upon verified milestone completion.

6. **Bilingual Accessibility**:
   - First-class English and Hindi (हिंदी) localization designed for ground-level artisans and citizens.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide & Feather Icons, Google Maps SDK
- **Backend**: Node.js, Express REST API, Socket.io Real-Time Layer
- **Database**: PostgreSQL with Geospatial indexing & Foreign Key hierarchy
- **Payments**: Razorpay Escrow Integration
- **Auth**: Multi-factor OTP authentication & Role-Based Access Control (`customer`, `contractor`, `society_admin`, `federation_admin`, `admin`)

---

## 💻 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your PostgreSQL database in backend/.env
npm run migrate
npm run dev
```

### 2. Frontend Setup
```bash
# In the root project directory
npm install
npm start
```

---

*© SahKaari Cooperative Marketplace. Built for Bharat.*
