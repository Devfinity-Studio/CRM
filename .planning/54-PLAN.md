# Phase 54: Gateway SDK Setup, Secure Webhooks & Automated Quota Sync - Plan

## Plan 54-01: Install SDK, Client Factory & Secure Webhook Route
- **Task 1**: Install `dodopayments` via `pnpm add dodopayments`.
- **Task 2**: Add optional environment variables in `src/env.js` for `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and `DODO_PAYMENTS_ENVIRONMENT`.
- **Task 3**: Create `src/server/payments/dodo-client.ts` client wrapper supporting `test_mode` / `live_mode` detection.
- **Task 4**: Implement App Router route handler `src/app/api/webhooks/dodo/route.ts` with Standard Webhook signature verification and idempotency caching.

## Plan 54-02: Subscription Lifecycle Processor, Quota Sync & Vitest Suite
- **Task 1**: Enhance `src/server/api/services/platform-billing.ts` to handle full Dodo webhook payloads (`subscription.active`, `subscription.renewed`, `subscription.cancelled`, `subscription.on_hold`, `payment.succeeded`, `payment.failed`).
- **Task 2**: Wire automatic organization quota synchronization and update `organizations` and `subscriptions` tables.
- **Task 3**: Expand domain event bus (`src/server/events/event-bus.ts`) to handle `subscription.active` and `subscription.cancelled` events.
- **Task 4**: Write comprehensive Vitest test suite `src/server/api/__tests__/dodo-webhooks.test.ts` verifying signature validation, idempotency, and quota transitions.
- **Task 5**: Verify `pnpm vitest run` and `pnpm build`.

