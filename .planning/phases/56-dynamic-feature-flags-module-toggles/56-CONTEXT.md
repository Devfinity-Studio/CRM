# Phase 56: Dynamic Feature Flags & Cascading Module Toggles - Context

**Gathered:** 2026-11-05
**Status:** Ready for planning
**Source:** Phase 56 Discussion with User

<domain>
## Phase Boundary
Phase 56 delivers a dynamic hierarchical Feature Flags & Module Toggling engine for DevCRM.
Super admins gain complete control over modules (Inventory, Subscriptions, Automations, Quotes/Invoicing, Custom Domains, Webhooks, API Keys, AI Insights) with a global kill-switch, plan entitlements, and granular per-tenant overrides, backed by route guards and a dedicated `/superadmin/features` control hub.
</domain>

<decisions>
## Implementation Decisions

### 1. Cascading Flag Hierarchy & Global Kill-Switch
- **Evaluation Order**: Global Defaults (`globalSettings.featureFlags`) $\rightarrow$ Subscription Plan entitlements (`subscriptionPlans`) $\rightarrow$ Per-Tenant custom overrides (`tenantOverrides.featureOverrides`).
- **Global Kill-Switch Rule**: If a feature is toggled OFF globally in `globalSettings`, it acts as a platform-wide kill switch across all plans and tenants, UNLESS an explicit VIP tenant override exists in `tenantOverrides`.
- **Supported Feature Keys**:
  - `hasInventory` (Inventory SKU items & holds)
  - `hasSubscriptions` (Recurring customer billing)
  - `hasAutomations` (Workflow rules & cron triggers)
  - `hasQuotes` (Quote builder & digital signatures)
  - `hasInvoicing` (Invoice generator & ledger tracking)
  - `hasCustomDomains` (Custom domain routing & CNAME resolution)
  - `hasWebhooks` (Outgoing Svix webhook dispatching)
  - `hasApiKeys` (Developer API keys generation & authorization)
  - `hasAiInsights` (AI-powered lead qualification & scoring)

### 2. Super Admin Control Hub (`/superadmin/features`)
- Dedicated `/superadmin/features` page with a tabbed interface:
  - **Global Features Tab**: System-wide kill switches and default toggles with live impact counters (e.g. "Active on 12 tenants, overridden on 2").
  - **Tenant Overrides Tab**: Searchable list of organizations, active subscription tier badge, and switchboard to grant custom overrides or revoke access with 1 click.
- Super Admin navigation layout updated to include the "Features" tab in sidebar.

### 3. Access Enforcement & User Experience
- **Navigation Guarding**: The main dashboard sidebar dynamically evaluates the active organization's effective feature flags (`useTenantEntitlements`), filtering out disabled links (e.g. `/inventory/products`, `/automations`).
- **Route Guarding**: If a user attempts to navigate directly to a disabled module route via URL (e.g. `/inventory/products`), the page or middleware immediately performs a hard redirect to `/dashboard` with an optional warning toast notification.
- **Backend tRPC Guards**: Middleware / procedures check `checkFeatureAccess(db, ctx.session.user.organizationId, featureKey)` before executing operations, throwing `FORBIDDEN` error if disabled.

</decisions>

<canonical_refs>
## Canonical References

### Database Schema & Entitlements Service
- `src/server/db/schema.ts` — `globalSettings`, `subscriptionPlans`, `tenantOverrides`, `organizations`.
- `src/server/api/services/entitlements.ts` — Core `getTenantEntitlements`, `checkFeatureAccess`, and `FeatureKey` types.
- `src/components/layout/dashboard-layout.tsx` — Navigation items array and dynamic sidebar rendering.
- `src/app/superadmin/layout.tsx` — Super Admin sidebar navigation links.
- `src/server/api/routers/superadmin.ts` — Existing superadmin tRPC router procedures.

</canonical_refs>

<specifics>
## Specific Ideas & Requirements
- Update `globalSettings` schema with a `featureFlags` column (JSON/text storing record of `FeatureKey -> boolean`) so global switches persist in PostgreSQL.
- Provide a clean batch update procedure `superadmin.updateGlobalFeatureFlags` and `superadmin.setTenantFeatureOverride` in tRPC.
- Expand Vitest test suite (`src/server/api/__tests__/entitlements.test.ts`) covering global kill-switch, plan fallbacks, tenant VIP overrides, and route redirection logic.

</specifics>

<deferred>
## Deferred Ideas
- Per-user fine-grained permissions within an organization (handled in Milestone 17 tenant RBAC: OWNER/ADMIN/MEMBER/VIEWER).
- Scheduled feature release dates / time-delayed flags (deferred to future milestone).
</deferred>

---
*Phase: 56-dynamic-feature-flags-module-toggles*
*Context gathered: 2026-11-05*
