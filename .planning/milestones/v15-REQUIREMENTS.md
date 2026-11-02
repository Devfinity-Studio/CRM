# Milestone 15: Production Sync & Neon Object Storage Migration - Requirements

## 1. Goal
Synchronize the local code and database schema across both dev and production Neon database branches, decommission Cloudflare R2 in favor of Neon Object Storage (`uploads` bucket), deploy to Vercel production, and verify end-to-end CRM workflows on the live production domain.

## 2. Requirements

### Phase 45: Database Branch Sync & Neon Object Storage Migration
- [x] **REQ-45-01**: Commit and push all current working tree changes to `dev` and synchronize `prod` branch on git.
- [x] **REQ-45-02**: Execute Drizzle schema migrations against both `dev` and `production` Neon database branches, ensuring tables and relations are completely up to date.
- [x] **REQ-45-03**: Initialize and link the Neon CLI (`npm install -g neon@latest` / `npx neon@latest`) with `neon init -y --project-id royal-field-53532962 --branch production --services postgres,object-storage`.
- [x] **REQ-45-04**: Create and configure the Neon Object Storage bucket: run `neon config add bucket uploads` and `neon deploy`, syncing credentials into `.env`.
- [x] **REQ-45-05**: Decommission Cloudflare R2 dependencies, integrate Neon Object Storage via the Files SDK into the app's upload pipeline, and execute verification test (upload small text file, list bucket, read back content without printing secrets).

### Phase 46: Production Deployment & Live Verification
- [x] **REQ-46-01**: Verify Vercel project configuration, environment variables, and build checks for production.
- [x] **REQ-46-02**: Trigger production deployment on Vercel from the `prod` branch.
- [x] **REQ-46-03**: Verify live health: root page, user authentication, multi-tenant dashboard, and API status on production URL.
- [x] **REQ-46-04**: Execute live smoke tests on core workflows: deals pipeline, billing/invoices, and Neon Object Storage file uploads.

