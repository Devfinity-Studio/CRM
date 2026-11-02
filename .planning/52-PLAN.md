# Phase 52 Plan: Invoicing Lifecycle, Subscriptions Engine & Unified Telemetry Dashboard

## Step 1: Schema Evolution
- In `src/server/db/schema.ts`:
  - Update `invoiceStatusEnum` with `"VIEWED"`, `"PARTIALLY_PAID"`, `"VOID"`, `"CREDIT_NOTE_ISSUED"`.
  - In `invoices`: add `paymentLinkUrl`, `viewedAt`, `creditNoteNumber`, `creditNoteReason`, `fulfilledAt`.
  - Create `stockMovementTypeEnum` and `stockMovements` table.
  - In `clientSubscriptions`: add `lastRenewalDate`, `failedAttempts`, `dunningStatus`, `dunningAlertSentAt`.

## Step 2: Invoicing State Machine & Fulfillment Service
- Create `src/server/api/services/invoice-state-machine.ts`:
  - State machine transition validation matrix (`isValidInvoiceTransition`).
  - `fulfillInvoiceStock(db, invoiceId, userId)`: hard stock deduction on `products.stockQuantity`, release soft holds on `products.reservedQuantity`, and record immutable `stockMovements` ledger entry.
  - `issueInvoiceCreditNote(db, invoiceId, reason, userId)`: credit note issuance with stock return reversal.

## Step 3: Subscription Engine & Dunning Service
- Create `src/server/api/services/subscription-engine.ts`:
  - `processSubscriptionRenewals(db, organizationId)`: iterates due subscriptions, generates recurring invoices, and computes `nextRenewalDate`.
  - `recordSubscriptionPaymentFailure(db, subscriptionId)`: increments `failedAttempts`, sets dunning status, and triggers alerts.

## Step 4: Router Enhancements
- In `src/server/api/routers/billing.ts`:
  - Add `updateInvoiceStatus` with state machine validation.
  - Add `fulfillInvoice` calling fulfillment service.
  - Add `issueCreditNote`.
  - Add `getStockMovements` query for inventory audit trail.
- In `src/server/api/routers/client-subscriptions.ts`:
  - Add `triggerRenewals` procedure.
- In `src/server/api/routers/dashboard.ts`:
  - Add `getExecutiveTelemetry` query returning MRR, ARR, cash-flow run rate, conversion velocity, and low-stock alerts.

## Step 5: Dashboard Telemetry UI
- In `src/app/dashboard/page.tsx`:
  - Render telemetry cards: MRR, ARR, Cash-Flow Run Rate, Pipeline Velocity, and Low-Stock Alert warnings.

## Step 6: Testing & Verification
- Create unit tests in `src/server/api/__tests__/invoice-lifecycle.test.ts` and `src/server/api/__tests__/subscriptions-engine.test.ts`.
- Run `pnpm vitest run` and `pnpm build`.

