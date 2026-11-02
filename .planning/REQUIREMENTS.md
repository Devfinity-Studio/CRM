# Milestone 18: Platform SaaS Payment & Subscription Gateway Integration - Requirements

## 1. Goal
Integrate a production-grade Platform SaaS Payment & Subscription Gateway using Dodo Payments (Merchant of Record). Tenants subscribe to DevCRM plans (`Starter`, `Pro`, `Enterprise`), complete payments through hosted checkout sessions, have webhooks cryptographically verified via the Standard Webhooks specification, and have their organization quotas, team seats, and active service statuses automatically provisioned and managed via a self-service customer portal.

## 2. Requirements

### Phase 54: Gateway SDK Setup, Secure Webhooks & Automated Quota Sync
- [x] **REQ-54-01**: Install and configure `dodopayments` SDK with `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and `DODO_PAYMENTS_ENVIRONMENT` (defaulting to `test_mode` in development/test, `live_mode` in production).
- [x] **REQ-54-02**: Implement `/api/webhooks/dodo` Next.js App Router route handler with Standard Webhooks signature verification on raw request body (`webhook-id`, `webhook-signature`, `webhook-timestamp`).
- [x] **REQ-54-03**: Implement idempotent lifecycle event processing for `subscription.active`, `subscription.renewed`, `subscription.cancelled`, `subscription.on_hold`, `payment.succeeded`, and `payment.failed`. On active/payment: automatically upgrade tenant's `organizations` record (plan, quotas for contacts, invoices, automations, team seats, storage) and sync `subscriptions` record.
- [x] **REQ-54-04**: Build comprehensive Vitest test suite for webhook signature validation, idempotency guards, event dispatching, and quota state synchronization.

### Phase 55: Tenant Subscription Billing Center, Checkout Sessions & Customer Portal
- [ ] **REQ-55-01**: Implement tRPC `billing.createPlatformCheckoutSession` generating hosted Dodo checkout URLs with tenant metadata (`organizationId`, `planId`, `billingCycle`).
- [ ] **REQ-55-02**: Implement tRPC `billing.createCustomerPortalSession` generating time-bound hosted Dodo customer portal URLs for payment method management and tax invoices.
- [ ] **REQ-55-03**: Create the `/settings/billing` page with current plan details, renewal status, live quota meters (contacts, invoices, seats, automations), monthly/yearly pricing cards, and 1-click Upgrade / Customer Portal triggers.
- [ ] **REQ-55-04**: Verify full test suite passing (Vitest), Biome check, and clean production build (`pnpm build`).

