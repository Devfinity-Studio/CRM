# Phase 44: Billing & Financial Views Polish - Research

**Date:** 2026-10-31
**Phase:** 44 (Milestone 14)
**Status:** Complete

## Technical Analysis

### 1. Invoices List Page (`src/app/billing/invoices/page.tsx`)
- **Current State**:
  - Missing `<DashboardLayout>` shell.
  - Table lacks high-level financial metrics and status filtering.
- **Upgrades**:
  - Wrap in `<DashboardLayout>`.
  - Add Financial Scorecards strip:
    - **Total Invoiced**: Aggregated value of all tenant invoices ($).
    - **Total Collected**: Total amount paid by clients ($).
    - **Outstanding Balance**: Total unpaid balance due ($).
    - **Overdue Invoices**: Count and sum of past-due invoices with high-urgency alert styling.
  - Add filter pills: `All`, `Paid`, `Pending (Sent)`, `Overdue`, `Draft / Proforma`.
  - Data table wrapped in `rounded-3xl border border-border/70 bg-card/75 backdrop-blur-md shadow-xs`.
  - Format monetary numbers in `font-mono` / tabular figures.
  - Glassmorphic status badges with color dots (`PAID`, `SENT`, `OVERDUE`, `DRAFT`, `PROFORMA`).

### 2. Quotes List Page (`src/app/billing/quotes/page.tsx`)
- **Current State**:
  - Missing `<DashboardLayout>` shell.
  - Table uses basic styling without summary pipeline metrics.
- **Upgrades**:
  - Wrap in `<DashboardLayout>`.
  - Add Quote Pipeline Scorecards strip:
    - **Total Pipeline Quoted**: Total proposed value ($).
    - **Accepted Quotes**: Total won/converted quote value ($).
    - **Awaiting Client (Sent)**: Total in-review quotes.
    - **Drafts**: Pre-release quotes.
  - Filter pills: `All`, `Accepted`, `Sent`, `Declined`, `Draft`.
  - Data table with glassmorphic cards and action dropdowns (Revise, Copy public link, Delete, Convert to Invoice).

### 3. Customer Statements & Party Ledgers (`src/app/billing/statements/page.tsx` & `src/components/billing/ledger-view.tsx`)
- **Current State**:
  - `statements/page.tsx` missing `<DashboardLayout>` wrapper.
  - `LedgerView` uses default raw inputs and unstyled table cells.
- **Upgrades**:
  - Wrap `statements/page.tsx` in `<DashboardLayout>`.
  - Restyle `LedgerView`:
    - Glassmorphic date range bar with quick pills (`This Month`, `This Quarter`, `Year to Date`).
    - Running Balance Summary: Total Invoiced (Debits), Total Paid (Credits), Net Closing Balance.
    - Transaction ledger table with Debit (Emerald) and Credit (Slate) highlighting.

### 4. Public Document Viewer (`src/components/public/document-viewer.tsx`)
- **Verification**:
  - Confirm print layout (`print:m-0 print:border-none print:p-0`) formats accurately for PDF generation.
  - Ensure document header displays tenant logo or typography cleanly.
  - Verify line items table, subtotal, tax breakdown, and terms section adhere to enterprise stationery standards.

### 5. Automated Verification Plan
- Biome check (`pnpm biome check`) across all modified billing files.
- Vitest run (`pnpm vitest run`) to confirm full test pass across all suites.

