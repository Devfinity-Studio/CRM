# Milestone 16: Test Expansion, Dev/Prod DB Segregation & Staged Deployment - Requirements

## 1. Goal
Expand automated unit and integration tests across CRM, billing, and storage modules; ensure both Neon `Dev` and `production` database branches are synchronized with all database changes; configure Vercel environment variables with segregated Preview (targeting Neon Dev branch) and Production (targeting Neon Prod branch) databases; deploy and verify preview on `dev` before merging to `prod` and verifying production.

## 2. Requirements

### Phase 47: Test Expansion, Neon Dev/Prod Environment Segregation, & Staged Vercel Deployment
- [x] **REQ-47-01**: Expand automated Vitest test suite covering core routers and services (e.g., billingRouter, crmRouter, uploadsRouter, and storage utilities) with passing tests.
- [x] **REQ-47-02**: Audit and verify schema migrations and table definitions across both Neon database branches: `Dev` (`br-jolly-bird-az9jq7gz`) and `production` (`br-little-scene-az7iw7fk`), guaranteeing 100% schema parity.
- [x] **REQ-47-03**: Configure Vercel project environment variables so `Preview` deployments connect to the Neon `Dev` database branch and `Production` deployments connect to the Neon `production` database branch.
- [x] **REQ-47-04**: Commit changes and push to `origin/dev`, monitor Vercel preview deployment until `READY`, and perform automated health checks on preview URL.
- [x] **REQ-47-05**: Merge `dev` to `prod`, push to `origin/prod`, monitor Vercel production deployment until `READY`, and perform live smoke verification on `https://devfinity-crm.vercel.app`.
