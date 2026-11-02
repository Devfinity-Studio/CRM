# Phase 50: Super Admin Control Plane, Plan Builder, Tenant Overrides & Platform Billing - Context

## Objective
Build the Super Admin Control Plane for platform operators to manage SaaS subscription plans, per-tenant feature/quota overrides, secure impersonation with visual exit banner, and automated platform billing synchronization.

## Deliverables
1. **Super Admin API Extensions (`src/server/api/routers/superadmin.ts`):**
   - Plan Builder CRUD (`getPlans`, `createPlan`, `updatePlan`, `deletePlan`).
   - Tenant Overrides management (`getTenantOverrides`, `upsertTenantOverrides`).
   - Tenant Plan assignment (`assignTenantPlan`).
2. **Platform Billing Service (`src/server/api/services/platform-billing.ts`):**
   - Platform subscription checkout session generation (Dodo Payments / Razorpay).
   - Standard Webhook dispatcher and event sync (`subscription.active`, `subscription.past_due`, `subscription.cancelled`).
3. **Super Admin UI Views (`src/app/superadmin/`):**
   - Dedicated Plan Builder page (`src/app/superadmin/plans/page.tsx`).
   - Enhanced Tenant registry (`src/app/superadmin/tenants/page.tsx`) with Plan selector, Override editor dialog, and Impersonation trigger.
   - Impersonation Banner in `DashboardLayout` when active.
   - Route `/super-admin` alias redirecting to `/superadmin`.

