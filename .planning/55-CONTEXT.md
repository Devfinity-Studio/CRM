# Phase 55: Tenant Subscription Billing Center, Checkout Sessions & Customer Portal - Context

## 1. Intent & Purpose
Phase 55 provides tenant administrators with full self-service subscription management inside DevCRM.
Tenants can inspect their active plan and renewal dates, observe live quota utilization meters (contacts, invoices, seats, automations), switch between monthly and annual billing tiers, initiate hosted checkout sessions via Dodo Payments to upgrade their subscription, and open the self-service Dodo Customer Portal to manage cards and download tax invoices.

## 2. Requirements & Touchpoints
- **tRPC Procedures (`src/server/api/routers/billing.ts`):**
  - `getPlatformSubscription`: Resolves current organization plan, active subscription, and live quota usage.
  - `getAvailablePlans`: Returns active subscription plans.
  - `createPlatformCheckoutSession`: Initiates server-side Dodo checkout session with organization metadata.
  - `createCustomerPortalSession`: Generates hosted Dodo customer portal session for the organization's `dodoCustomerId`.
- **Navigation (`src/app/settings/layout.tsx`):**
  - Adds "Subscription & Plans" (`/settings/billing`) to settings sidebar.
- **UI (`src/app/settings/billing/page.tsx`):**
  - Active plan summary & status badge.
  - 4-metric quota progress meters.
  - Monthly/Annual pricing cards with 1-click Upgrade checkout triggers.
  - Customer Portal redirect button.
- **Verification:**
  - Vitest test suite `src/server/api/__tests__/platform-subscription.test.ts`.
  - Next.js production build (`pnpm build`).
