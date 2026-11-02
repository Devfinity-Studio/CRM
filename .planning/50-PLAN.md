# Phase 50: Super Admin Control Plane, Plan Builder, Tenant Overrides & Platform Billing - Plan

## Plan 50-01: Backend Router Extensions & Platform Billing Service
1. **Extend `src/server/api/routers/superadmin.ts`:**
   - Add `getPlans` query returning plans and counts.
   - Add `createPlan` mutation accepting name, code, priceMonthly, priceYearly, quotas, and feature flags.
   - Add `updatePlan` mutation.
   - Add `deletePlan` mutation (toggle isActive).
   - Add `getTenantOverrides` and `upsertTenantOverrides` mutations.
   - Add `assignTenantPlan` mutation.
2. **Build `src/server/api/services/platform-billing.ts`:**
   - Dodo Payments & Razorpay webhook processor.
   - Sync subscription statuses to `subscriptions` table.
3. **Unit Tests:**
   - Add `src/server/api/__tests__/superadmin-plans.test.ts` testing Plan CRUD, overrides, and impersonation.

## Plan 50-02: Super Admin UI & Impersonation Banner
1. **Create `src/app/superadmin/plans/page.tsx`:**
   - Plan Builder grid, active subscriber counts, feature badge checklist, modal to create/edit plan tiers.
2. **Update `src/app/superadmin/tenants/page.tsx`:**
   - Display tenant custom domain, active plan, override modal, and impersonation button.
3. **Impersonation Persistent Banner:**
   - Add top warning banner in `DashboardLayout` when `devcrm_impersonate_org` cookie is present, allowing one-click return to Super Admin.
4. **Create `/super-admin/page.tsx`:**
   - Canonical redirect to `/superadmin`.

