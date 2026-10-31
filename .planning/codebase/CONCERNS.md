---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Codebase Concerns

**Analysis Date:** 2026-10-31

## Tech Debt

**Insecure Fallback Token in Automations Cron:**
- **Issue:** In `src/app/api/cron/process-automations/route.ts` line 10:
  ```typescript
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret'}`) {
  ```
  If `CRON_SECRET` is not set in production environments, the endpoint defaults to the insecure string `'secret'`, allowing unauthorized parties to trigger background automation runs.
- **Why:** Added as a quick developer fallback during prototyping.
- **Impact:** Anyone sending `Authorization: Bearer secret` could trigger database updates and automation executions.
- **Fix approach:** Require `CRON_SECRET` to be defined in `src/env.js` and fail closed (return 401/500) if undefined.

**Dual Import Path Aliases (`~/` vs `@/`):**
- **Issue:** Both `~/` and `@/` are configured in `tsconfig.json` and used interchangeably across the codebase (e.g., `src/server/` predominantly uses `~/`, whereas `src/app/api/cron/` uses `@/`).
- **Why:** Code was generated across multiple phases and templates.
- **Impact:** Inconsistent imports complicate refactoring and static analysis.
- **Fix approach:** Standardize on `~/` across all files using Biome automated import rewrites.

**Ad-Hoc Manual Migration Scripts vs Drizzle Kit:**
- **Issue:** The repository contains both Drizzle Kit migrations (`drizzle/*.sql`) and multiple manual migration scripts in `scripts/` (e.g., `scripts/migrate-manual.ts`, `scripts/migrate-phase16.ts`, `alter-orgs.ts`, `fix-enums.ts`).
- **Why:** Rapid prototyping required executing direct SQL statements when iterating on schema changes.
- **Impact:** New developers or production deployment pipelines might execute inconsistent migration paths.
- **Fix approach:** Consolidate all schema modifications into clean `drizzle-kit generate` migrations and deprecate one-off migration scripts.

## Known Bugs & Fragile Areas

**Public Lead Ingestion Endpoint Lacks Rate Limiting & CAPTCHA:**
- **Symptoms:** `src/app/api/leads/route.ts` directly creates company/lead records from POST bodies without authentication or rate limiting.
- **Trigger:** Any external script can spam `POST /api/leads`.
- **Workaround:** None currently in place.
- **Fix approach:** Implement IP-based rate limiting (via Upstash Redis or Cloudflare Turnstile/CAPTCHA) and validate domain origins.

**In-Memory Unpaginated Processing in Cron Worker:**
- **Symptoms:** `process-automations` fetches all active rules and all active invoices/quotes in memory without pagination (`findMany({ where: eq(...) })`).
- **Trigger:** High volume of tenant invoices/quotes.
- **Workaround:** Manageable with small tenant datasets.
- **Fix approach:** Batch queries in chunks (e.g., limit 100 with cursor pagination) or delegate to background job queues.

**Webhook Dispatcher Silent Failure:**
- **Symptoms:** `src/server/webhooks/dispatch.ts` catches all Svix dispatch errors and logs to console without retry scheduling or alerting.
- **Trigger:** Temporary network glitches or Svix outages.
- **Impact:** Tenants might miss critical webhook events (e.g. `invoice.paid`) without notification.
- **Fix approach:** Add an `outbound_webhook_event` table with a retry queue and exponential backoff.

## Security Considerations

**API Key Storage & Permissions:**
- **Risk:** API keys are hashed using SHA-256 (`devcrm_api_key`), which is secure against plaintext leaks, but there is no granular scoping of API key capabilities (e.g., read-only vs write).
- **Current mitigation:** API keys are tied to the creating user's permissions and revoked if `revokedAt` is set.
- **Recommendations:** Implement key scopes (e.g., `leads:write`, `contacts:read`) and enforce prefix formatting (e.g., `devcrm_live_...`).

**Multi-Tenancy Isolation Enforcement:**
- **Risk:** Cross-tenant data leakage if an endpoint forgets to filter queries by `ctx.session.user.organizationId`.
- **Current mitigation:** Manual `eq(table.organizationId, ctx.session.user.organizationId)` checks in tRPC procedures.
- **Recommendations:** Consider row-level security (RLS) in PostgreSQL or a higher-order tRPC procedure builder that automatically injects tenant filtering into Drizzle queries.

## Performance Bottlenecks

**Large Contact / Deal Datasets:**
- **Problem:** Client profile views and Kanban boards fetch entire deal/activity lists without infinite scrolling or virtualization.
- **Impact:** Performance degradation on organizations with thousands of leads and historical activities.
- **Recommendation:** Implement cursor-based pagination in `src/server/api/routers/deals.ts` and `src/server/api/routers/crm.ts`.
