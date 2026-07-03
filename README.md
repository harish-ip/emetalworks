# eMetalWorks

Digital storefront and instant price calculator for **Bhavya Fabrication Works**, a steel fabrication business in Hyderabad. Customers select a work type, enter dimensions, and get a live price range with GST breakdown — then send it to the shop via WhatsApp or a contact form. An admin dashboard tracks leads, manages pricing, and shows site analytics.

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

---

## Features

- **Instant price calculator** — covers window grills, security grills, decorative grills, balcony grills, gates, and staircases in mild steel or stainless steel 304
- **Balcony shop formula** — decoded from fabricator notes; uses real MS angle + 10 mm square rod weights (see `src/utils/balconyCalc.js`)
- **Safety compliance** — enforces the 4-inch sphere rule (< 100 mm clear gap) and NBC 2016 minimum railing height for fall-protection types; 4″ and 5″ gap options are blocked for balcony and staircase railings
- **Pricing integrity** — quotes shown as a ±10% range with an explicit GST line, 7-day validity, and a margin floor guard
- **WhatsApp lead capture** — name + phone captured before opening WhatsApp; saved to MongoDB with DPDP Act 2023 consent checkbox
- **Contact form** — sends full enquiry with calculator data attached
- **Admin dashboard** — pipeline view, daily traffic chart, lead management with status/notes/follow-up, quote builder, pricing editor
- **PWA-ready** — web manifest, service worker, mobile-optimised layout with floating CTA

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
| Container | Docker + Docker Compose |
| Hosting | Render.com (frontend + backend as separate services) |

---

## Project structure

```
emetalworks-00530/
├── src/                        # Frontend (React/Vite)
│   ├── config/
│   │   ├── compliance.js       # NBC 2016 / 4-inch sphere constants
│   │   └── pricing.js          # GST rate, margin floor, quote validity, surcharges
│   ├── utils/
│   │   ├── balconyCalc.js      # Shop formula — angle frame + square rod grid
│   │   ├── complianceCheck.js  # checkCompliance() pure function
│   │   ├── pricing.js          # fetchPricing(), savePricing(), DEFAULT_PRICING
│   │   └── analytics.js        # Visitor/session tracking
│   └── pages/
│       ├── index.jsx           # Home page — calculator, services, portfolio, contact
│       └── admin.jsx           # Admin dashboard
│
├── server/                     # Backend (Node/Express)
│   ├── models/
│   │   ├── ContactSubmission.js
│   │   ├── PricingSettings.js
│   │   ├── AnalyticsEvent.js
│   │   └── DailyHit.js
│   ├── routes/
│   │   ├── contact.js          # Lead capture + WhatsApp endpoint
│   │   ├── admin.js            # Auth + lead management
│   │   ├── analytics.js        # Page-view beacons + summary
│   │   └── pricing.js          # Pricing CRUD
│   └── server.js
│
├── unit-tests/
│   ├── balconyCalc.test.js
│   ├── complianceCheck.test.js
│   └── pricingGuardrails.test.js
│
├── tests/                      # Playwright E2E
│   ├── calculator.spec.js
│   ├── responsive.spec.js
│   ├── contact.spec.js
│   └── admin.spec.js
│
├── LAUNCH-RISKS.md             # Pre-launch business checklist
├── docker-compose.yml
└── nginx.conf
```

---

## Getting started

### Prerequisites

- Node.js ≥ 16
- MongoDB (local) **or** a MongoDB Atlas connection string

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server && npm install
```

### 3. Configure environment variables

```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
# Edit server/.env — set MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
```

### 4. Start development servers

Open two terminals:

```bash
# Terminal 1 — frontend (http://localhost:3000)
npm run dev

# Terminal 2 — backend (http://localhost:5001)
cd server && npm run dev
```

The Vite dev server proxies `/api/*` requests to the backend automatically via `VITE_API_URL`.

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
| `JWT_SECRET` | *(required)* | Secret for signing admin JWTs — use a long random string in production |
| `JWT_EXPIRES_IN` | `24h` | Admin session lifetime |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `admin123` | Admin login password — **change before deploy** |
| `FRONTEND_URL` | `http://localhost:3002` | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

---

## Running with Docker

```bash
# Build and start all three services (MongoDB + backend + frontend)
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

Covers:
- `balconyCalc.test.js` — 9 tests, shop formula reference table
- `complianceCheck.test.js` — 16 tests, every compliance branch (gap, height, warn types)
- `pricingGuardrails.test.js` — 12 tests, margin floor, GST, quote range

### E2E tests (Playwright)

```bash
# Run headless
npm run test:e2e

# Open interactive UI
npm run test:e2e:ui
```

Covers: calculator flow, WhatsApp modal, contact form, responsive layout, mobile sticky bar.

---

## Safety & compliance

Balcony and staircase railings are fall-protection products. The calculator enforces:

| Rule | Limit | Source |
|---|---|---|
| Max clear gap between bars | < 100 mm | 4-inch sphere rule |
| Minimum railing height | 1050 mm | NBC 2016 cl.5.9 |
| Recommended railing height | 1200 mm | NBC 2016 |

**4″ (102 mm) and 5″ (127 mm) gap options are disabled** for balcony and staircase types. Only 3″ (76 mm) is selectable. If a non-compliant configuration is detected, the price is withheld and a blocking error is shown instead.

Window and security grills show a non-blocking warning for wide gaps (used on upper floors they may act as fall protection).

All limits live in [`src/config/compliance.js`](src/config/compliance.js) — **verify with a structural engineer and local municipal bylaws before launch.**

---

## Pricing guardrails

All rates and business rules live in config — never hard-coded in formula files.

| Config | File |
|---|---|
| Metal rates, fabrication rates, installation rates | `src/utils/pricing.js` (server-managed, editable from admin) |
| GST rate, margin floor, quote validity, surcharges | `src/config/pricing.js` |

The quote engine:
1. Computes an estimated cost from weight + area
2. Applies a margin floor guard — price is never shown below `cost × 1.25`
3. Displays a **±10% range** (not a single false-precision number)
4. Shows `+18% GST (works contract)` and the GST-inclusive total separately
5. Stamps a 7-day validity date on every quote

**Verify the GST rate with a CA before launch.** Update `GST_RATE` in `src/config/pricing.js` if the CA advises a different treatment.

---

## Admin dashboard

Access at `/admin` (password-protected via JWT).

- **Dashboard** — visit counts (today / total), calculator opens, lead pipeline bars, daily traffic chart, recent leads with source badges
- **Leads & Contacts** — full lead list with status, priority, notes, follow-up dates; delete; quick WhatsApp link; "📋 Quote" button pre-fills the quote builder
- **Quotes & Pricing** — quote builder using the same shop formula as the customer calculator; customer banner when opened from a lead
- **Analytics** — page-view summary, source breakdown

---

## Deployment

The project is deployed on [Render.com](https://render.com) as two separate services:

- **Frontend** — static site build (`npm run build`, serve `dist/`)
- **Backend** — Node.js web service (`node server.js`)

**Render-specific notes:**
- `app.set('trust proxy', 1)` is required in `server.js` so rate limiters see real client IPs from `X-Forwarded-For` (not the proxy's internal IP).
- Set all environment variables in the Render dashboard, not in committed files.
- The `_redirects` file in `public/` routes all paths to `index.html` for client-side routing.

---

## Pre-launch checklist

See [`LAUNCH-RISKS.md`](LAUNCH-RISKS.md) for non-code items: insurance, GST registration, domain ownership, trademark, working-at-height procedures, and key-person documentation.
