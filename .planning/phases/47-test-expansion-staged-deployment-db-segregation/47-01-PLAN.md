# Phase 47: Test Expansion, Neon Dev/Prod Environment Segregation, & Staged Vercel Deployment - Plan 01

## Goal
Expand automated Vitest test coverage across CRM, billing, and storage routers; verify and synchronize database schema parity between Neon `Dev` and `production` branches; configure Vercel environment variables with segregated Preview (Neon Dev DB) and Production (Neon Prod DB) databases; push to `dev` for Vercel preview deployment verification; and upon passing, merge to `prod` for production deployment and live verification.

## Requirements
- **REQ-47-01**: Expand automated Vitest test suite covering core routers and services (`billingRouter`, `crmRouter`, `uploadsRouter`, and storage utilities) with all passing tests.
- **REQ-47-02**: Audit and verify schema migrations and table definitions across both Neon database branches: `Dev` (`br-jolly-bird-az9jq7gz`) and `production` (`br-little-scene-az7iw7fk`), guaranteeing 100% schema parity.
- **REQ-47-03**: Configure Vercel project environment variables with environment segregation:
  * `DATABASE_URL` (target: `production`): Neon `production` branch pooled connection string (`ep-bitter-darkness-azznf1fc-pooler`).
  * `DATABASE_URL` (target: `preview`): Neon `Dev` branch pooled connection string (`ep-royal-cherry-azyz9310-pooler`).
  * Ensure `S3_*` (Neon Object Storage `uploads` bucket) and `AUTH_SECRET` are properly configured across both environments.
- **REQ-47-04**: Commit changes and push to `origin/dev`, monitor Vercel preview deployment until `READY`, and perform automated health checks on preview URL.
- **REQ-47-05**: Merge `dev` to `prod`, push to `origin/prod`, monitor Vercel production deployment until `READY`, and perform live smoke verification on `https://devfinity-crm.vercel.app`.

## Tasks

### Task 1: Expand Vitest Test Suite
- Create `src/server/api/__tests__/crm.test.ts`:
  * `crm.getCompanies`: verifies retrieving companies scoped to active organization.
  * `crm.createCompany`: verifies creating a company with orgId scoping.
  * `crm.getPOCsByCompanyId`: verifies retrieving POC contacts for a company.
  * `crm.addPOC`: verifies creating a contact associated with a company.
- Create `src/server/api/__tests__/billing.test.ts`:
  * `billing.getInvoices`: verifies retrieving invoices scoped to organization.
  * `billing.createInvoice`: verifies creating invoice with line items and organizationId.
  * `billing.getQuotes`: verifies retrieving quotes.
  * `billing.getStatements`: verifies ledger statement calculation.
- Create `src/server/api/__tests__/uploads.test.ts`:
  * `uploads.getPresignedUrl`: verifies generating presigned upload parameters using `storage.ts` with Neon Object Storage bucket.
- Verify entire test suite passes: `pnpm vitest run`.
- Verify Biome formatting and linting: `pnpm biome check`.

### Task 2: Database Branches Parity Verification
- Inspect schema, tables, and columns across project `royal-field-53532962` for branches `production` (`br-little-scene-az7iw7fk`) and `Dev` (`br-jolly-bird-az9jq7gz`).
- Verify tables (`devcrm_company`, `devcrm_contact`, `devcrm_deal`, `devcrm_invoice`, `devcrm_quote`, etc.) and all recent columns (`leadScore`, `qualificationStatus`, `hasSeenWelcome`, `dealId`, `contactId`) match across both branches.
- If any discrepancies are found, apply idempotent Drizzle migrations to ensure 100% parity.

### Task 3: Vercel Environment Variables Segregation
- Check existing `DATABASE_URL` on Vercel project `devfinity-crm` (`prj_U6NOmhPBSr0G7W1x8QzhWnjGonQA`).
- Update `DATABASE_URL` environment variables via Vercel MCP:
  * For target `["production"]`: `postgresql://neondb_owner:***@ep-bitter-darkness-azznf1fc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
  * For target `["preview"]`: `postgresql://neondb_owner:***@ep-royal-cherry-azyz9310-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- Verify `S3_*` (Neon Object Storage bucket `uploads`) and `AUTH_SECRET` are targeted to both `["production", "preview"]`.

### Task 4: Staged Pipeline — Dev Push & Preview Verification
- Commit all test files and documentation to `dev`.
- Push `dev` to `origin/dev`.
- Query Vercel deployment status for `dev` branch using `get_deployment` / `list_deployments`.
- Wait until preview deployment is `READY`.
- Execute automated HTTP smoke checks against preview domain:
  * Landing page (`/`) -> 200
  * Login page (`/login`) -> 200
  * Public viewer paths (`/public/quote/...`, `/public/invoice/...`) -> 200
  * CSRF endpoint (`/api/auth/csrf`) -> 200

### Task 5: Staged Pipeline — Prod Merge & Production Verification
- Switch to `prod` branch, fast-forward merge `dev`, and push to `origin/prod`.
- Return to `dev` branch.
- Monitor Vercel production deployment until state reaches `READY`.
- Perform live smoke verification on `https://devfinity-crm.vercel.app`:
  * Root landing page (`/`) -> 200
  * Login page (`/login`) -> 200
  * Public invoice & quote viewers -> 200
  * Verify live deals pipeline and dashboard routes.

## Verification Checklist
- [ ] `pnpm vitest run`: all tests passing (minimum 20+ tests across deals, dashboard, trpc, webhooks, crm, billing, uploads).
- [ ] `pnpm biome check`: 0 errors, 0 warnings.
- [ ] `pnpm build`: Next.js compiles 45/45 routes with 0 errors.
- [ ] Neon `Dev` and `production` database branches have 100% schema parity.
- [ ] Vercel preview deployment reaches `READY` connected to Neon `Dev` database.
- [ ] Vercel production deployment reaches `READY` connected to Neon `production` database.
- [ ] Live preview and production domains return HTTP 200 on health checks.

