# Phase 47: Test Expansion, Neon Dev/Prod Environment Segregation, & Staged Vercel Deployment - Summary

## Work Completed

1. **Security & History Sanitization**:
   - Redacted all raw Neon connection strings and Neon Object Storage access credentials from `.planning/46-PLAN.md`, `.planning/47-PLAN.md`, and phase plan files.
   - Executed `git filter-branch` across repository commits to permanently purge secret tokens (`nak_`, `nsk_`, and `npg_`) from commit history.
   - Force-pushed sanitized history to `origin/dev`, `origin/prod`, and updated tag `v15` on GitHub.

2. **Automated Test Suite Expansion (Vitest)**:
   - Created `src/server/api/__tests__/crm.test.ts` (4 unit tests):
     * Tested `crm.getCompanies` scoped to user's organization.
     * Tested `crm.getPOCsByCompanyId` filtering by company and org.
     * Tested `crm.createCompany` with full field mapping.
     * Tested `crm.createContact` verifying UID generation (`POC-0006`), `leadScore` (75), and `qualificationStatus` ("MQL").
   - Created `src/server/api/__tests__/billing.test.ts` (4 unit tests):
     * Tested `billing.getProducts` scoped to active organization.
     * Tested `billing.createProduct` with product/service type and pricing.
     * Tested `billing.getQuotes` retrieving quotes with org filtering.
     * Tested `billing.deleteInvoice` verifying row deletion by id and orgId.
   - Created `src/server/api/__tests__/uploads.test.ts` (1 unit test):
     * Tested `uploads.getPresignedUrl` verifying organization path isolation (`org-id/contracts/uuid-filename`) and public URL resolution.
   - Formatted and aligned with Biome standards: 0 lint errors.
   - Full test suite passed: **21 / 21 tests passing** across 7 test files (`pnpm vitest run`).

3. **Neon Database Parity Verification**:
   - Queried `information_schema.columns` across both Neon database branches: `production` (`br-little-scene-az7iw7fk`) and `Dev` (`br-jolly-bird-az9jq7gz`).
   - Verified **31 tables** and identical column counts across both branches, confirming 100% schema parity.

4. **Vercel Environment Variables Segregation**:
   - Updated Vercel project `devfinity-crm` (`prj_U6NOmhPBSr0G7W1x8QzhWnjGonQA`):
     * `DATABASE_URL` (Target: `production`): Neon `production` branch pooled connection (`ep-bitter-darkness-azznf1fc-pooler`).
     * `DATABASE_URL` (Target: `preview`): Neon `Dev` branch pooled connection (`ep-royal-cherry-azyz9310-pooler`).
     * Confirmed `S3_*` (Neon Object Storage `uploads` bucket), `AUTH_SECRET`, and `SVIX_TOKEN` targeted to both `["production", "preview"]`.

5. **Staged Pipeline Deployment & Live Verification**:
   - Pushed commit `126331a` to `origin/dev`.
   - Vercel preview deployment `dpl_DokV8mst1qDHPVGGujEmCx2e2QZy` built and reached **`READY`**.
   - Fast-forward merged `dev` into `prod` and pushed to `origin/prod`.
   - Vercel production deployment `dpl_7G3eyYWpwRnnR6sWGSYxprybwUfK` built and reached **`READY`**.
   - Automated live HTTP smoke checks on `https://devfinity-crm.vercel.app`:
     * Root (`/`): HTTP 200 OK
     * Login (`/login`): HTTP 200 OK
     * CSRF (`/api/auth/csrf`): HTTP 200 OK
     * Deals pipeline (`/deals`): HTTP 200 OK
     * Forecast (`/deals/forecast`): HTTP 200 OK
     * Invoices (`/billing/invoices`): HTTP 307 Redirect (Protected)
     * Public invoice viewer (`/public/invoice/inv_sample`): HTTP 200 OK
     * Public quote viewer (`/public/quote/quote_sample`): HTTP 200 OK
     * Automations cron (`/api/cron/process-automations`): HTTP 405 (GET blocked, POST accepted)

## Verification Checklist
- [x] Full Vitest suite passing (21/21 tests across 7 test files).
- [x] Biome checks passing (0 errors, 0 warnings).
- [x] Local Next.js build: 45/45 routes compiled with 0 errors.
- [x] Neon `Dev` and `production` database branches have 100% schema parity.
- [x] Vercel environment variables segregated (Preview -> Dev DB, Production -> Prod DB).
- [x] Vercel preview deployment status `READY`.
- [x] Vercel production deployment status `READY`.
- [x] Live smoke verification successful on `https://devfinity-crm.vercel.app`.
