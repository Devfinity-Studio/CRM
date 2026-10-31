---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# External Integrations

**Analysis Date:** 2026-10-31

## APIs & External Services

**Webhook Infrastructure (Svix):**
- **Service:** Svix (`svix` npm package v2.5.0)
- **Purpose:** Outbound webhook dispatching and management for multi-tenant organizations
- **Auth:** Initialized with `SVIX_TOKEN` environment variable via `src/lib/svix.ts`
- **Implementation:**
  - `src/server/webhooks/dispatch.ts`: Core dispatch utility `dispatchWebhook(orgId, eventType, payload)`. Looks up the organization's `svixAppId`. If found, triggers `svix.message.create()`.
  - `src/server/api/routers/webhooks.ts`: tRPC endpoints for tenant webhook management, endpoint registration, secret key retrieval, and delivery log inspection.

**Inbound Marketing & Lead Webhooks:**
- **Endpoints:**
  - `src/app/api/webhooks/ads/route.ts`: Ingestion webhook for ad platforms (Google Ads, Facebook Ads, LinkedIn Ads, Twitter Ads). Parses lead payload, inserts a contact linked to `adCampaignId`, and increments campaign conversion counts.
  - `src/app/api/leads/route.ts`: Public REST endpoint for external lead generation forms to push prospective client/company records directly into the CRM.

**Programmatic Developer API:**
- **Endpoints:**
  - `src/app/api/v1/me/route.ts`: REST endpoint verifying API key credentials and returning organization and user identity.
- **Authentication:** Supported via `x-api-key` header or `Authorization: Bearer <token>`, validated via SHA-256 hash against the `devcrm_api_key` table in PostgreSQL.

## Data Storage

**Relational Database:**
- **Provider/Type:** PostgreSQL 15+ (Neon / Supabase / Local Docker)
- **Connection:** Managed via `DATABASE_URL` environment variable in `src/server/db/index.ts`
- **Client & ORM:** `postgres` driver (v3.4.4) paired with `drizzle-orm` (v0.41.0)
- **Schema & Migrations:**
  - Schema defined centrally in `src/server/db/schema.ts`
  - Automated migrations generated and applied via `drizzle-kit` (`drizzle/` directory with 14 migration files)
  - Programmatic migration runner `migrate.cjs` and TypeScript scripts in `scripts/`

**Object & File Storage:**
- **Provider/Type:** Cloudflare R2 / AWS S3 S3-compatible storage
- **SDK/Client:** `@aws-sdk/client-s3` (v3.1095.0) and `@aws-sdk/s3-request-presigner` (v3.1095.0)
- **Auth:** AWS credentials supplied via `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, and custom `S3_ENDPOINT_URL`
- **Usage:**
  - `src/server/api/routers/uploads.ts`: Server-side presigned URL generator for uploads (`getPresignedUploadUrl`) and download URLs
  - `src/hooks/use-s3-upload.ts`: Client hook handling direct multipart file uploads to S3/R2
  - Assets stored: Organization logos, company avatars, invoice/quote signature images, PDF attachments

## Authentication & Identity

**NextAuth.js (v5 Beta):**
- **Library:** `next-auth` (v5.0.0-beta.32) with `@auth/drizzle-adapter` (v1.11.3)
- **Configuration:** `src/server/auth.ts`
- **Session Strategy:** JSON Web Token (`jwt`) strategy with `AUTH_SECRET`
- **Providers:**
  - `CredentialsProvider`: Email or Phone lookup with `bcryptjs` password verification against `devcrm_user`
  - `GitHubProvider`: OAuth sign-in via `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (optional)
  - `GoogleProvider`: OAuth sign-in via `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional)
- **Edge Middleware:** `src/middleware.ts` guards dashboard, admin, and billing routes while redirecting authenticated sessions from login/register pages.

## Background Jobs & Automations

**Cron Scheduler (Vercel Cron / External HTTP Runner):**
- **Endpoint:** `src/app/api/cron/process-automations/route.ts`
- **Auth:** Authorization Bearer token comparison against `CRON_SECRET`
- **Execution:** Queries active `automation_rule` records, scans for expiring subscriptions, upcoming invoice due dates, stalled deals, or sent quotes, and dispatches automated tasks, internal notifications, or email alerts while writing to `automation_log`.

