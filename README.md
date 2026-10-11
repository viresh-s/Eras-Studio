# Eras Studio

> **Enterprise Fine Art Discovery, Artist Representation & Provenance Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_0_Errors-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Security-OWASP_ASVS_Hardened-green?style=flat&logo=shield)](CORPORATE_ENGINEERING_REPORT.md)

---

## 1. Overview

**Eras Studio** is an enterprise-grade digital art marketplace and artist ecosystem designed to connect contemporary fine artists, collectors, and galleries. Built on a serverless Backend-as-a-Service (BaaS) architecture with Next.js 15 and Supabase PostgreSQL, Eras provides end-to-end tooling for artwork cataloging, direct buyer-creator inquiries, certificate provenance verification, and professional artist career development via the **Circle of Realism (COR)** framework.

The platform is designed to adhere to strict corporate engineering standards, prioritizing data privacy, low-latency rendering, accessibility, and robust defense against web application threats.

---

## 2. Key Features by User Persona

### 🎨 For Creators & Artists
- **Portfolio Management:** High-resolution artwork uploads with multi-image gallery support, dimensions, medium classifications, and year metadata.
- **Privacy & Flexible Pricing:** Native Indian Rupee (`₹`) denomination with optional *"Hide Price"* toggle for confidential gallery commissions.
- **Provenance & Verification:** Automated Certificate of Authenticity generation and verification pipelines.
- **Inquiry & Direct Messaging:** Real-time communication channel with prospective collectors with acceptance/decline controls.
- **Circle of Realism (COR):** Integrated application tracker for international exhibition opportunities, mentor consultations, and career tier badges.

### 🏛️ For Collectors & Art Enthusiasts
- **Curated Discovery:** Responsive masonry catalogs with search filters for style, medium, and artist profile.
- **Direct Acquisition Requests:** Authenticated, rate-limited inquiry flows protecting collectors and artists from spam.
- **Account Dashboard:** Real-time notifications, ongoing conversations, purchase history, and saved collections.
- **Content Reporting & Safety:** Direct moderation reporting mechanisms for policy violations and IP infringement.

### 🛡️ For Administrators & Curators
- **Centralized Admin Console (`/admin`):** Real-time metrics tracking registered creators, active inventory, transaction volume, and open conversations.
- **Content Moderation:** Comprehensive management of reported artworks and user safety flags.
- **Tier & Account Governance:** Management of membership tiers (*Free, Pro, Elite*) and verification badges.

---

## 3. Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│     React 19 Server & Client Components · Tailwind CSS v4   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / TLS 1.3
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js 15 Edge / SSR                    │
│   • HTTP Security Headers (HSTS, CSP, SAMEORIGIN, nosniff)  │
│   • Middleware Session Authentication                       │
│   • Next.js Server Actions (Stateless Controllers)          │
│   • Sliding-Window Rate Limiting & Input Sanitization       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Parameterized PostgREST
┌──────────────────────────────▼──────────────────────────────┐
│                  Supabase Cloud Platform                    │
│   • PostgreSQL Database with Strict Row Level Security (RLS)│
│   • Supabase Auth (Cryptographic JWT Tokens)                │
│   • Supabase Storage (Encrypted Cloud CDN for Artworks)     │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Framework** | Next.js 15.3 (App Router) | Hybrid Server Components (RSC) and Client Islands |
| **Language** | TypeScript (Strict Mode) | 100% type coverage, 0 compilation warnings |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Minimalist monochrome design system, WCAG AA compliance |
| **Database** | PostgreSQL via Supabase | Normalized schema, foreign key cascades, RLS policies |
| **Auth** | Supabase Auth (JWT) | HTTP-only session cookies, OTP email reset flow |
| **Security** | Custom Security Subsystem | Rate limiting, IDOR prevention, XSS/HTML sanitization |
| **CI/CD** | GitHub Actions | Automated linting, typecheck, vulnerability scan, build tests |

---

## 4. Security & Compliance Architecture

Eras Studio implements defense-in-depth principles aligned with OWASP Top 10 recommendations:

- **IDOR Defense:** Server Actions resolve identity strictly from verified server-side JWT session cookies via `requireAuth()`. Client-supplied user/creator identifiers are disregarded for authorization.
- **SQL Injection Immunization:** 100% of database queries use Supabase's strongly typed query builder, compiling down to parameterized PostgreSQL prepared statements.
- **Stored & DOM XSS Neutralization:** Inputs pass through `sanitizeText()` before persistence, and React's JSX engine prevents script execution in rendered strings.
- **Rate Limiting:** Sliding-window throttle limits artwork uploads (30/hour), inquiries (10/15 min), and chat messages (60/min) to prevent brute-force attacks.
- **HTTP Response Hardening:** Configured in `next.config.ts` with HSTS (2 years), anti-clickjacking frame restrictions (`SAMEORIGIN`), MIME sniffing guards (`nosniff`), and server fingerprint suppression (`poweredByHeader: false`).

> For full technical audits, see [CORPORATE_ENGINEERING_REPORT.md](./CORPORATE_ENGINEERING_REPORT.md).

---

## 5. Directory Structure

```
eras-app/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline (Audit, Lint, Typecheck, Build)
├── .editorconfig                # Universal indentation, line ending, and charset rules
├── next.config.ts               # Hardened security headers & image domain restrictions
├── package.json                 # Project dependencies & build scripts
├── tsconfig.json                # Strict TypeScript configuration
├── supabase/                    # Single source of truth for database schemas
│   ├── schema.sql               # Core schema (artworks, profiles, chats, certificates)
│   ├── cor_schema.sql           # Circle of Realism opportunity & consultation schema
│   └── reports_migration.sql    # Moderation & reporting schema
└── src/
    ├── actions/                 # Next.js Server Actions (IDOR protected, rate limited)
    │   ├── artworkActions.ts    # Artwork creation, updates, and visibility
    │   ├── authActions.ts       # Secure registration, login, and profile sync
    │   ├── chatActions.ts       # Inquiry sessions and real-time messaging
    │   ├── corActions.ts        # Artist application submission and pipeline actions
    │   ├── notificationActions.ts
    │   ├── profileActions.ts
    │   └── reportActions.ts
    ├── app/                     # Next.js App Router
    │   ├── (auth)/              # Login, Sign up, Forgot Password (OTP)
    │   ├── (dashboard)/         # Protected workspaces (Portfolio, COR, Admin, Chat)
    │   ├── (public)/            # Discovery gallery, Artist portfolio, Services
    │   └── api/                 # Secure edge API endpoints
    ├── components/
    │   ├── features/            # Domain-specific components (Artwork, Creator, COR, User)
    │   └── ui/                  # Reusable atomic design system (Button, Modal, Input, Badge)
    ├── lib/
    │   ├── security/            # Security subsystem (authGuard, rateLimiter, validators, logger)
    │   ├── services/            # Business logic and external integrations
    │   └── supabase/            # Client and Server Supabase SDK bindings
    └── types/                   # Centralized database contracts and TypeScript interfaces
```

---

## 6. Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher (LTS recommended)
- **Package Manager**: `npm` (v10+), `pnpm`, or `yarn`
- **Database**: An active [Supabase](https://supabase.com) project

### 1. Clone the Repository
```bash
git clone https://github.com/viresh-s/Eras-Studio.git
cd Eras-Studio/eras-app
```

### 2. Configure Environment Variables
Create a `.env.local` file in `eras-app/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-optional-service-role-key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database
Execute the SQL migrations located in `supabase/` within your Supabase SQL Editor in the following sequence:
1. `supabase/schema.sql`
2. `supabase/cor_schema.sql`
3. `supabase/reports_migration.sql`

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Quality Gates & Validation Scripts

The repository includes enterprise quality verification scripts:

```bash
# Run strict TypeScript compiler verification (Target: 0 errors)
npm run typecheck

# Run static code analysis & linting
npm run lint

# Verify production bundle optimization & SSR compilation
npm run build

# Start production server
npm run start
```

---

## 8. Continuous Integration & Deployment (CI/CD)

Every push or pull request to `main`, `master`, or `develop` triggers the automated GitHub Actions pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):
1. **Dependency Audit:** Scans packages for CVE vulnerabilities (`npm audit`).
2. **Static Analysis:** Executes ESLint checks.
3. **Type Safety:** Validates type signatures via `tsc --noEmit`.
4. **Build Verification:** Compiles production assets and server bundles.

---

## 9. License & Confidentiality

Copyright © 2026 Eras Studio. All rights reserved.  
This software and associated documentation files are proprietary and confidential. Unauthorized copying, distribution, or deployment of this repository without explicit permission is strictly prohibited.
