# eMetalWorks

Digital storefront and instant price calculator for **Bhavya Fabrication Works** — a steel fabrication business in Hyderabad. Customers enter dimensions, pick a work type, and get a live price range with GST breakdown, then send the quote directly to the shop via WhatsApp or a contact form. An admin dashboard tracks leads, edits pricing, and shows site analytics.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Tests](#tests)
- [Safety & compliance](#safety--compliance)
- [Pricing guardrails](#pricing-guardrails)
- [Admin dashboard](#admin-dashboard)
- [Deployment](#deployment)
- [Pre-launch checklist](#pre-launch-checklist)

---

## Features

- **Instant price calculator** — window grills, security grills, decorative grills, balcony grills, gates, and staircases in mild steel or stainless steel 304
- **Balcony shop formula** — decoded from real fabricator notes; uses actual MS angle + 10 mm square rod weights (`src/utils/balconyCalc.js`)
- **Safety compliance** — enforces the 4-inch sphere rule (< 100 mm clear gap) and NBC 2016 minimum railing height for fall-protection work types; 4″ and 5″ gap options are blocked for balcony and staircase railings
- **Pricing integrity** — quotes shown as a ±10% range with an explicit GST line, 7-day validity date, and a margin floor guard
- **WhatsApp lead capture** — name + phone collected before opening WhatsApp; saved to MongoDB with DPDP Act 2023 consent
- **Contact form** — full enquiry with calculator data attached
- **Admin dashboard** — pipeline view, daily traffic chart, lead management (status / notes / follow-up), quote builder, pricing editor
- **PWA-ready** — web manifest, service worker, mobile-optimised layout with floating bottom CTA

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 4, Tailwind CSS 3, Framer Motion |
| Backend | Node.js, Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JWT (admin only) |
| Security | Helmet, CORS, express-rate-limit |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Containers | Docker + Docker Compose |
| Hosting | Render.com (frontend + backend as separate services) |

---

## Project structure

```
.
├── src/                          # Frontend source (React/Vite)
│   ├── config/
│   │   ├── compliance.js         # NBC 2016 / 4-inch sphere rule constants
│   │   └── pricing.js            # GST rate, margin floor, quote validity, surcharges
│   ├── utils/
│   │   ├── balconyCalc.js        # Shop formula — angle frame + square rod grid
│   │   ├── complianceCheck.js    # checkCompliance() pure function
│   │   ├── pricing.js            # fetchPricing(), DEFAULT_PRICING
│   │   └── analytics.js          # Visitor / session tracking
│   └── pages/
│       ├── index.jsx             # Home — calculator, services, portfolio, contact
│       └── admin.jsx             # Admin dashboard
│
├── server/                       # Backend (Node/Express)
│   ├── models/
│   │   ├── ContactSubmission.js
│   │   ├── PricingSettings.js
│   │   ├── AnalyticsEvent.js
│   │   └── DailyHit.js
│   ├── routes/
│   │   ├── contact.js            # Lead capture + DELETE endpoint
│   │   ├── admin.js              # JWT auth + lead management
│   │   ├── analytics.js          # Page-view beacons + summary
│   │   └── pricing.js            # Pricing CRUD
│   └── server.js
│
├── unit-tests/
│   ├── balconyCalc.test.js       # 9 tests — shop formula reference table
│   ├── complianceCheck.test.js   # 16 tests — every compliance branch
│   └── pricingGuardrails.test.js # 12 tests — margin floor, GST, range
│
├── tests/                        # Playwright E2E
│   ├── calculator.spec.js
│   ├── responsive.spec.js
│   ├── contact.spec.js
│   └── admin.spec.js
│
├── LAUNCH-RISKS.md               # Non-code pre-launch checklist
├── docker-compose.yml
└── nginx.conf
```

---

## Getting started

### Prerequisites

- Node.js ≥ 16
- MongoDB (local) **or** a MongoDB Atlas connection string

### 1. Clone and install

```bash
git clone https://github.com/harish-ip/emetalworks.git
cd emetalworks

# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
# Open server/.env and set MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
```

### 3. Start development servers

Open two terminals:

```bash
# Terminal 1 — frontend (http://localhost:3000)
npm run dev

# Terminal 2 — backend (http://localhost:5001)
cd server && npm run dev
```

The Vite dev server reads `VITE_API_URL` to proxy `/api/*` requests to the backend.

---

## Environment variables

### Frontend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5001/api` | Backend API base URL |
| `VITE_ENABLE_ANALYTICS` | `true` | Toggle page-view tracking |
| `VITE_DEBUG_MODE` | `false` | Verbose console logging |

### Backend (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/emetalworks` | MongoDB connection string |
| `PORT` | `5001` | Server port |
| `JWT_SECRET` | *(required)* | Secret for admin JWTs — use a long random string in production |
| `JWT_EXPIRES_IN` | `24h` | Admin session lifetime |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `admin123` | Admin login password — **change before deploy** |
| `FRONTEND_URL` | `http://localhost:3002` | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window per IP |

---

## Running with Docker

```bash
# Build and start MongoDB + backend + frontend
docker compose up --build

# Frontend → http://localhost:80
# Backend  → http://localhost:5001
# MongoDB  → localhost:27017
```

---

## Tests

### Unit tests (Vitest)

```bash
npm run test:unit
```

37 tests across three suites:

| Suite | Tests | Covers |
|---|---|---|
| `balconyCalc.test.js` | 9 | Shop formula against reference weight table |
| `complianceCheck.test.js` | 16 | Every compliance branch — gap, height, warn vs block |
| `pricingGuardrails.test.js` | 12 | Margin floor clamping, GST, quote range |

### E2E tests (Playwright)

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI
```

Covers: calculator flow, WhatsApp modal, contact form, responsive layout, mobile sticky bar, touch target sizes.

---

## Safety & compliance

Balcony and staircase railings are fall-protection products. The calculator enforces two hard rules:

| Rule | Limit | Reference |
|---|---|---|
| Max clear gap between bars | < 100 mm | 4-inch sphere rule |
| Minimum railing height | 1050 mm | NBC 2016 cl.5.9 |
| Recommended railing height | 1200 mm | NBC 2016 |

**4″ (102 mm) and 5″ (127 mm) gap options are disabled** for balcony and staircase types — only 3″ (76 mm) is selectable. If a non-compliant configuration is entered, the price is withheld and a blocking red error is shown instead.

Window and security grills show a non-blocking amber warning for wide gaps, since they may act as fall protection on upper floors.

All limits live in [`src/config/compliance.js`](src/config/compliance.js). **Verify with a structural engineer and local municipal bylaws before launch.**

---

## Pricing guardrails

All rates and business rules are in config files — never hard-coded in formula logic.

| What | Where |
|---|---|
| Metal rates, fabrication rates, installation rates | `src/utils/pricing.js` (server-managed, editable from admin) |
| GST rate, margin floor, quote validity, surcharges | `src/config/pricing.js` |

Every quote goes through three safeguards:

1. **Margin floor** — if the computed price falls below `cost × 1.25`, it is clamped up and flagged `belowFloor: true` for review
2. **Range display** — shows `₹low – ₹high` (±10%) rather than a single false-precision number
3. **GST line** — `+18% GST (works contract)` and the GST-inclusive total shown separately on every quote

**Verify the GST rate with a CA before launch.** Update `GST_RATE` in `src/config/pricing.js` if advised otherwise.

---

## Admin dashboard

Access at `/admin` — password-protected, JWT session.

| Section | What it does |
|---|---|
| Dashboard | Visit counts (today / all-time), calculator opens, lead pipeline bars, daily traffic chart, recent leads with source badges |
| Leads & Contacts | Full lead list — status, priority, admin notes, follow-up dates, delete, quick WhatsApp; "📋 Quote" button pre-fills the quote builder from a lead's calculator data |
| Quotes & Pricing | Quote builder using the same shop formula as the customer calculator |
| Analytics | Page-view summary, source breakdown |

---

## Deployment

Deployed on [Render.com](https://render.com) as two separate services:

- **Frontend** — static site: `npm run build`, serve `dist/`
- **Backend** — Node.js web service: `node server.js`

**Key Render notes:**
- `app.set('trust proxy', 1)` in `server.js` is required so rate limiters see real client IPs from `X-Forwarded-For` instead of the proxy's internal IP. Without this, all traffic appears as one IP and rate limits trip for everyone.
- Set all environment variables in the Render dashboard — never in committed files.
- `public/_redirects` routes all paths to `index.html` for client-side routing.

### API routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/contact/whatsapp-lead` | Capture WhatsApp lead (name + phone) |
| `POST` | `/api/contact/submit` | Submit full contact form |
| `GET` | `/api/contact/submissions` | List submissions (admin) |
| `PUT` | `/api/contact/submission/:id/status` | Update lead status |
| `DELETE` | `/api/contact/submission/:id` | Delete a lead |
| `GET` | `/api/pricing` | Fetch current pricing |
| `PUT` | `/api/pricing` | Save pricing (admin) |
| `POST` | `/api/analytics/beacon` | Record page view |
| `GET` | `/api/analytics/summary` | Analytics summary (admin) |
| `POST` | `/api/admin/login` | Admin login → JWT |
| `GET` | `/api/health` | Health check (used by UptimeRobot) |

---

## Pre-launch checklist

[`LAUNCH-RISKS.md`](LAUNCH-RISKS.md) lists the non-code items that must be addressed before accepting live orders: public-liability insurance, GST registration, domain ownership, trademark search, working-at-height procedures, and verifying the compliance parameter values with a structural engineer.
