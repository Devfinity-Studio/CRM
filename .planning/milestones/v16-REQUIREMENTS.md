# Milestone 16: Test Expansion, Dev/Prod DB Segregation & Staged Deployment - Requirements Archive

## 1. Goal
Expand automated unit and integration tests across CRM, billing, and storage modules; ensure both Neon `Dev` and `production` database branches are synchronized with all database changes; configure Vercel environment variables with segregated Preview (targeting Neon Dev branch) and Production (targeting Neon Prod branch) databases; execute complete 75-item UI/UX overhaul across desktop and mobile; deploy and verify preview on `dev` before merging to `prod` and verifying production.

## 2. Requirements & Traceability

### Phase 47: Test Expansion, Neon Dev/Prod Environment Segregation, & Staged Vercel Deployment
- [x] **REQ-47-01**: Expand automated Vitest test suite covering core routers and services (billingRouter, crmRouter, uploadsRouter, dashboardRouter, dealsRouter, and storage utilities) with passing tests. *(Outcome: Validated & passing 21/21 tests)*
- [x] **REQ-47-02**: Audit and verify schema migrations and table definitions across both Neon database branches: `Dev` (`br-jolly-bird-az9jq7gz`) and `production` (`br-little-scene-az7iw7fk`), guaranteeing 100% schema parity. *(Outcome: Validated parity across both branches)*
- [x] **REQ-47-03**: Configure Vercel project environment variables so `Preview` deployments connect to the Neon `Dev` database branch and `Production` deployments connect to the Neon `production` database branch. *(Outcome: Configured in Vercel project)*
- [x] **REQ-47-04**: Commit changes and push to `origin/dev`, monitor Vercel preview deployment until `READY`, and perform automated health checks on preview URL. *(Outcome: Verified preview READY)*
- [x] **REQ-47-05**: Merge `dev` to `prod`, push to `origin/prod`, monitor Vercel production deployment until `READY`, and perform live smoke verification on `https://devfinity-crm.vercel.app`. *(Outcome: Verified production READY, HTTP 200)*

### Phase 48: UI and UX Redesign
- [x] **REQ-48-01**: Implement global design system tokens, 4-tier surface elevation, and WCAG 2.1 AAA contrast compliance across Category A shared primitives (buttons, inputs, selects, cards, tables, modals, sheets). *(Outcome: Implemented in Tailwind v4 and primitives)*
- [x] **REQ-48-02**: Redesign CRM, sales pipeline, and operations views with responsive mobile ergonomics and touch targets >= 44px. *(Outcome: Verified in Plans 48-01 & 48-02)*
- [x] **REQ-48-03**: Redesign billing, catalog, inventory, subscriptions, marketing, automations, and settings pages. *(Outcome: Verified in Plan 48-03)*
- [x] **REQ-48-04**: Overhaul administration, authentication, onboarding, public customer portals, and error/loading fallback screens. *(Outcome: Verified in Plan 48-04)*
- [x] **REQ-48-05**: Selective route onboarding gating: top red warning banner on dashboard/profile, full-page blocker on restricted routes, and conditional tutorial tour trigger. *(Outcome: Verified and passing 23/23 tests)*

