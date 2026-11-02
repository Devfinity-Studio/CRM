# Phase 51 Plan: Dynamic Tax Engine, Interconnected Contacts, Deals, Quotes & Soft Inventory Holds

## Step 1: Schema Evolution
- In `src/server/db/schema.ts`:
  - `products`: add `reservedQuantity: d.integer().default(0).notNull()`.
  - `dealProducts`: create table for deal SKU line items with `id`, `organizationId`, `dealId`, `productId`, `quantity`, `unitPrice`, `createdAt`.
  - `quotes`: add `dealId`, `signedAt`, `signerIp`, `signerEmail`, `taxDetails` fields.

## Step 2: Dynamic Tax Engine Service
- Create `src/server/api/services/tax-engine.ts`:
  - Helper functions querying `country-state-city` for state and country resolution.
  - India GST calculation (CGST/SGST 50/50 split for intra-state vs IGST for inter-state, RCM, and 0% export zero-rating).
  - EU/UK VAT calculation (standard rates, cross-border reverse charge).
  - US Sales Tax rates per state.
  - Expose `billingRouter.calculateTax` in `src/server/api/routers/billing.ts`.

## Step 3: Deal SKU Line Items & Soft Inventory Reservations
- In `src/server/api/routers/deals.ts`:
  - Add `getDealProducts`, `setDealProducts` procedures.
  - Automatically calculate deal `value` from line items sum.
  - Soft inventory holds: adjust `products.reservedQuantity` when stage is "negotiation" or status is "WON"; decrement/release when deal is marked "LOST".

## Step 4: Digital E-Signatures on Quotes
- In `src/server/api/routers/public.ts`:
  - Add `signQuote` mutation recording digital signature canvas drawing, signer name/email/IP, updating status to `ACCEPTED`, and auto-advancing linked deal to `WON`.
- In `src/components/public/document-viewer.tsx`:
  - Embed `react-signature-canvas` in a responsive signing drawer/modal with clear/undo and submission.

## Step 5: 360° Unified Timeline & Tiptap Rich Notes
- In `src/server/api/routers/crm.ts`:
  - Add `getUnifiedTimeline` combining activity notes, deals, quotes, and invoices chronologically, calculating client LTV.
- In `src/components/crm/rich-note-composer.tsx`:
  - Build Tiptap rich-text editor with bold, italic, list formatting, and clean action buttons.
- In `src/components/crm/activity-timeline.tsx`:
  - Integrate unified timeline and rich-text note composer.

## Step 6: Testing & Production Verification
- Write comprehensive unit tests in `src/server/api/__tests__/tax-engine.test.ts` and `src/server/api/__tests__/deal-inventory.test.ts`.
- Run `pnpm vitest run` and `pnpm build`.

