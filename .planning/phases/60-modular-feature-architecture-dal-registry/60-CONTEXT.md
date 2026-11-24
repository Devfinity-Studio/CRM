# Phase 60: Modular Feature Architecture, Data Access Layer (DAL) & Dynamic Registry Baseline - Context

## Objective & Scope
Refactor and organize the existing DevCRM codebase into a clean, decoupled architectural baseline ready for incremental feature upgrades, remote configuration, and dynamic module loading without breaking any existing functionality.

## Core Pillars

### 1. Strict Tenant Isolation & Data Access Layer (DAL)
- Audit database queries and tRPC/server action endpoints to ensure tenant-scoped operations enforce `tenantId` / `organizationId` derived strictly from authenticated session context (never trusting client-supplied values).
- Centralize tenant-scoped database helpers into a server-side Data Access Layer (DAL) with explicit role/permission checks (e.g. tenant Owner/Admin vs Member/Viewer).

### 2. Decoupled Feature Registry & Dynamic Module Boundaries
- Establish modular feature boundaries under `src/features/<feature-name>/` exporting clean entry points, routes/views, components, and metadata rather than scattered cross-feature imports.
- Implement a centralized feature registry at `src/lib/features/registry.ts` defining:
  - Feature keys (e.g., `deals`, `contacts`, `invoicing`, `quotes`, `inventory`, `subscriptions`, `automations`, `aiInsights`).
  - Route paths/slugs.
  - Default enabled state.
  - Tenant and role visibility resolution.
- Refactor feature landing pages and views to resolve through this registry and leverage `next/dynamic` code-splitting for runtime module toggling.

### 3. CMS & Content Configuration Layer
- Separate static brand constants (brand name, logos, primary navigation links) from mutable content/CMS blocks.
- Prepare layout banners, announcements, and promotional blocks to be driven by dynamic configuration without touching core feature logic.
- Preserve system-synchronized dark/light themes and accessibility standards.

### 4. Verification & Documentation
- Preserve all working authentication flows, organization onboarding, and employee/member management.
- Verify complete TypeScript compilation (`pnpm tsc --noEmit`) and zero test regressions (`pnpm test`).
- Document what was reorganized, decoupled, and the exact next steps for remote feature flags (e.g. ConfigCat/Unleash).
