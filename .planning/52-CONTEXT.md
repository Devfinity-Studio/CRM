# Phase 52 Context: Invoicing Lifecycle, Subscriptions Engine & Unified Telemetry Dashboard

## Context & Objectives
Phase 52 delivers the complete financial execution and automated telemetry layer of DevCRM:
1. **Compliant Invoicing State Machine**:
   - Full lifecycle transitions: `Draft` -> `Sent` -> `Viewed` -> `Partially Paid` -> `Paid` -> `Overdue` -> `Void` / `Credit Note Issued`.
   - Public customer payment link generation (`/public/invoice/[id]`) and print-ready PDF export (`react-to-print`).
   - Reversible credit notes with balance reversals.
2. **Hard Inventory Stock Deductions & Immutable Ledger (`stockMovements`)**:
   - Upon invoice fulfillment or payment, hard deductions are committed against warehouse stock (`products.stockQuantity`).
   - Prior soft reservations from deals (`reservedQuantity`) are released.
   - Immutable audit trail recorded in `stockMovements` (`previousStock`, `newStock`, `quantity`, `type`, `invoiceId`, `performedByUserId`).
   - If a credit note is issued, stock is restored via a `RETURN` movement.
3. **Recurring Subscription Billing Engine**:
   - Supports Daily, Weekly, Monthly, and Annual client billing cycles.
   - Automated recurring invoice generation for active subscriptions at `nextRenewalDate`.
   - Dunning management: tracking failed payment attempts, grace period, and dunning alerts.
4. **Unified Executive Telemetry Dashboard**:
   - Live Monthly Recurring Revenue (MRR) and Annual Run Rate (ARR) calculations.
   - 90-day cash-flow projection and revenue run-rate.
   - Sales pipeline conversion velocity (average time from deal creation to WON).
   - Real-time warehouse low-stock alerts.

