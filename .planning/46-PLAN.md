# Phase 46: Production Deployment & Live Verification - Plan

## Goal
Deploy the updated DevCRM Next.js codebase to Vercel production from the synchronized `prod` branch, configure the production environment variables (Neon Postgres database, Neon Object Storage, NextAuth, Svix), and verify live end-to-end functionality across core CRM workflows and file uploads on the live domain.

## Requirements
- **REQ-46-01**: Verify and update Vercel project configuration and production environment variables to match Neon Postgres and Neon Object Storage (`uploads` bucket).
- **REQ-46-02**: Commit and push all build stability fixes (safe session access and .env handling) to `dev` and `prod`, triggering a clean Vercel production deployment.
- **REQ-46-03**: Verify live health on production URL: root landing page, tenant login, dashboard KPI queries, and API route responses.
- **REQ-46-04**: Execute live smoke tests on core workflows: deals pipeline, billing/invoices, and Neon Object Storage file uploads.

## Tasks

### Task 1: Environment Variables Synchronization on Vercel
- Update Vercel project `devfinity-crm` environment variables via Vercel MCP / CLI:
  * `DATABASE_URL`: Production Neon database connection string (`postgresql://neondb_owner:...@ep-bitter-darkness-azznf1fc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`)
  * `S3_BUCKET_NAME`: `uploads`
  * `S3_REGION`: `ap-southeast-1`
  * `S3_ACCESS_KEY_ID`: `[REDACTED]`
  * `S3_SECRET_ACCESS_KEY`: `[REDACTED]`
  * `S3_ENDPOINT_URL`: `https://br-little-scene-az7iw7fk.storage.c-3.ap-southeast-1.aws.neon.tech`
  * `S3_PUBLIC_URL`: `https://br-little-scene-az7iw7fk.storage.c-3.ap-southeast-1.aws.neon.tech/uploads`
  * Remove obsolete `S3_API_TOKEN` (Cloudflare R2).

### Task 2: Git Push to `dev` and `prod`
- Stage and commit the Next.js static prerender fixes:
  * `src/app/deals/forecast/page.tsx`
  * `src/app/deals/page.tsx`
  * `src/components/deals/kanban-board.tsx`
  * `src/components/deals/deal-dialog.tsx`
  * `src/app/marketing/ads/page.tsx`
- Push to `origin/dev`.
- Switch to `prod`, merge `dev`, and push to `origin/prod` to trigger Vercel production build.

### Task 3: Vercel Production Build & Deployment Verification
- Monitor Vercel deployment progress using the `vercel` MCP tools (`get_deployment`, `list_deployments`).
- Confirm build succeeds (`readyState === 'READY'`).
- Extract the live production URL.

### Task 4: Live Smoke Testing & Verification
- Perform automated HTTP checks on the live production URL:
  * Root landing page (`/`) returns HTTP 200.
  * Login page (`/login`) returns HTTP 200.
  * API health / endpoints (`/api/trpc/health` or `/api/v1/me`).
- Test document viewer routes (`/public/quote/...`, `/public/invoice/...`).
- Verify Neon Object Storage file access on production.

## Verification
- Local build passes (`pnpm build`).
- Vitest suite passes (`pnpm vitest run` - 12/12 passing).
- Vercel production deployment status is `READY`.
- Live domain accessible and functional.

