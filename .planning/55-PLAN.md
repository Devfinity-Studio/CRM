# Phase 55: Tenant Subscription Billing Center, Checkout Sessions & Customer Portal - Plan

## Plan 55-01: tRPC Router Procedures & Quota Resolution
- **Task 1**: Add `getPlatformSubscription`, `getAvailablePlans`, `createPlatformCheckoutSession`, and `createCustomerPortalSession` to `billingRouter` in `src/server/api/routers/billing.ts`.
- **Task 2**: Write Vitest tests in `src/server/api/__tests__/platform-subscription.test.ts` verifying procedure outputs, checkout session generation, and customer portal session links.

## Plan 55-02: Settings Billing UI, Quota Meters & Staged Release
- **Task 1**: Update `src/app/settings/layout.tsx` to include "Subscription & Plans" (`/settings/billing`).
- **Task 2**: Create `src/app/settings/billing/page.tsx` with active plan hero, quota progress meters, monthly/yearly plan comparison cards, checkout triggers, and customer portal button.
- **Task 3**: Run `pnpm vitest run` to ensure all tests pass.
- **Task 4**: Run `pnpm build` to compile all 49 routes cleanly.
- **Task 5**: Commit and push to `dev`, merge to `prod`, and update milestone records.
