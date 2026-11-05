# Phase 56: Dynamic Feature Flags & Cascading Module Toggles - Research

**Date:** 2026-11-05
**Status:** Completed

## 1. Executive Summary
Phase 56 requires a three-tier hierarchical feature flag resolution engine:
1. **Tier 1 - Global Platform Settings** (`globalSettings.featureFlags`): Controls platform-wide defaults and emergency kill-switches.
2. **Tier 2 - Subscription Plan Entitlements** (`subscriptionPlans`): Standard tier features assigned to `starter`, `pro`, `enterprise` plans.
3. **Tier 3 - Tenant Specific Overrides** (`tenantOverrides.featureOverrides`): VIP grants or restrictive overrides for specific organizations.

## 2. Architecture & Codebase Touchpoints

### Database Layer (`src/server/db/schema.ts`)
- `globalSettings` currently has:
  ```ts
  export const globalSettings = createTable("global_settings", (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey().default("default"),
    maintenanceMode: d.boolean().default(false).notNull(),
    enableBetaFeatures: d.boolean().default(false).notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }));
  ```
  We will add `featureFlags: d.text()` (JSON serialized dictionary of `Record<FeatureKey, boolean>`) to persist global feature flags with robust defaults.

### Entitlements Resolution Service (`src/server/api/services/entitlements.ts`)
- Extend `FeatureKey`:
  ```ts
  export type FeatureKey =
    | "hasInventory"
    | "hasSubscriptions"
    | "hasAutomations"
    | "hasCustomDomains"
    | "hasWebhooks"
    | "hasApiKeys"
    | "hasQuotes"
    | "hasInvoicing"
    | "hasAiInsights";
  ```
- Implement resolution logic in `getTenantEntitlements`:
  1. Fetch `globalSettings`. If a feature is explicitly disabled (`false`) globally, default to `false` (kill-switch mode).
  2. If globally enabled/allowed, evaluate the organization's plan (`subscriptionPlans`).
  3. Finally, check `tenantOverrides.featureOverrides`. If a tenant has an explicit override (`true` or `false`), it takes precedence over both plan and global default (allowing VIP enterprise access even during global rollout).

### Backend Router & Security (`src/server/api/routers/superadmin.ts`)
- Add procedures:
  - `superadmin.getGlobalFeatureFlags`: Returns parsed global flags dictionary.
  - `superadmin.updateGlobalFeatureFlags`: Mutates `globalSettings.featureFlags`.
  - `superadmin.getTenantFeatureMatrix`: Returns organization list paired with effective flags, plan name, and active override states for table views.
  - `superadmin.setTenantFeatureOverride`: Sets or removes specific flag override in `tenantOverrides`.

### Frontend & Navigation Enforcement
1. **Dashboard Layout (`src/components/layout/dashboard-layout.tsx`)**:
   - Query `layoutData.entitlements.features` or pass effective flags via `getLayoutData`.
   - Filter `navItems`:
     - If `hasInventory === false`, omit `/inventory/products`.
     - If `hasSubscriptions === false`, omit `/billing/subscriptions`.
     - If `hasAutomations === false`, omit `/automations`.
     - If `hasInvoicing === false` and `hasQuotes === false`, omit `/billing/invoices`.
2. **Client-Side Module Guard Hook / Page Guard**:
   - In `/inventory/products/page.tsx` and `/automations/page.tsx`, if the module is disabled for the tenant, trigger `router.replace("/dashboard")` with a Sonner toast `toast.error("The Inventory module is currently disabled for your organization.")`.
3. **Super Admin Features UI (`src/app/superadmin/features/page.tsx`)**:
   - Tab 1: Global Features Switchboard with descriptions, badge indicators, and 1-click toggles.
   - Tab 2: Tenant Overrides Grid with search, filter by plan, and quick override switches.
   - Update `src/components/layout/superadmin-layout.tsx` to include `Features` (`/superadmin/features`, icon: `ToggleLeft` / `Layers`) in the main navigation.

## 3. Testing Strategy
- Update `src/server/api/__tests__/entitlements.test.ts`:
  - Verify global kill-switch turns off feature when plan has it enabled.
  - Verify tenant VIP override enables feature even when globally killed.
  - Verify plan default applies when no override and globally enabled.
  - Verify `checkFeatureAccess` returns `true`/`false` correctly across all 9 feature keys.
- Run `pnpm test` (all 18 test suites) and `pnpm build` (all static/dynamic routes).

