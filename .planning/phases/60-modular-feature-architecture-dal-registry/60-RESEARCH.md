# Phase 60: Modular Feature Architecture, Data Access Layer (DAL) & Dynamic Registry Baseline - Research

## Context & Existing Architecture
DevCRM is a multi-tenant B2B CRM and billing engine built with Next.js 15 (App Router), TypeScript, Tailwind CSS, tRPC v11, NextAuth (JWT session), Drizzle ORM, and PostgreSQL (Neon Lakebase).

### 1. Multi-Tenancy & Data Access Audit
- **Current State**:
  - `src/server/api/trpc.ts` provides `resolveTenantContext(ctx, requestedOrgId?)` which inspects user memberships, impersonation cookies, and header overrides.
  - Some routers directly perform `ctx.db.query...` with `eq(table.organizationId, ...)`.
  - There is no unified Server Data Access Layer (DAL) module. Database logic is embedded inside router mutation and query handlers.
- **Architectural Requirement**:
  - Create a dedicated `src/server/dal/` module:
    - `tenancy.ts`: Safe resolution of tenant context, membership validation, and RBAC assertion (`assertTenantRole`, `assertTenantAdmin`).
    - Domain DALs (`crm.ts`, `deals.ts`, `billing.ts`, `automations.ts`, `members.ts`) encapsulating multi-tenant scoped Drizzle queries.
    - Zero reliance on client-provided tenant IDs: `organizationId` is strictly derived from the authenticated session and validated membership.

### 2. Feature Boundaries & Central Registry
- **Current State**:
  - Components are organized primarily by entity under `src/components/` (`deals`, `crm`, `clients`, `billing`, `automations`), while pages reside directly under `src/app/` (`deals`, `billing`, `clients`, `automations`).
  - Entitlements and feature keys are defined in `src/server/api/services/entitlements.ts` for superadmin/subscription plans (`inventory`, `invoicing`, `quotes`, `automations`, `aiInsights`, `customDomains`, `webhooks`, `apiKeys`).
- **Architectural Requirement**:
  - Create `src/lib/features/registry.ts`:
    - Uniform client/server feature metadata registry containing feature key, title, description, category, default enabled state, route paths, and permission gates.
  - Create self-contained feature packages in `src/features/<feature-name>/`:
    - `src/features/deals/`
    - `src/features/clients/`
    - `src/features/billing/`
    - `src/features/inventory/`
    - `src/features/automations/`
    - `src/features/marketing/`
    Each feature directory exports clean views, components, and route entry points.
  - Update route pages to consume feature views with `next/dynamic` where appropriate, enabling code-splitting and dynamic module hydration.

### 3. CMS & Content Configuration Layer
- **Current State**:
  - Marketing copy, navigation labels, and brand assets are hardcoded across `src/app/page.tsx`, `src/components/layout/dashboard-layout.tsx`, and landing components.
- **Architectural Requirement**:
  - Decouple static brand tokens (`src/config/brand.ts`) from mutable content blocks (`src/config/content.ts`).
  - Banners, announcements, promotional callouts, and landing hero sections resolve from this layer, allowing future headless CMS or remote config integration without modifying core layout or business logic.

### 4. Safety & Compatibility Guarantees
- No database schema alterations or migrations required.
- Existing tRPC API surface contracts remain 100% backward-compatible.
- All 23 Vitest suites must continue to pass with zero regressions.
- Next.js 15 production build must compile all static and dynamic routes cleanly.
