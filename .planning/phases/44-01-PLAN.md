# Phase 44: Billing & Financial Views Polish - Plan

## Executive Summary
Phase 44 brings full Stitch design harmony to all financial and billing interfaces in DevCRM, including the Invoices list, Quotes list, Customer Statements, Party Ledger, and Public Document Viewers.

---

## Technical Context
- **Frameworks**: Next.js App Router (React 19), Tailwind CSS v4, tRPC v11, Drizzle ORM.
- **Design Tokens**: DevCRM Premium Indigo theme (`.glass-panel`, `.glass-card-interactive`, `backdrop-blur-md`, `border-border/70`).

---

## Task Breakdown

### Task 1: Invoices List View Polish & Financial KPI Strip
**Files:**
- `src/app/billing/invoices/page.tsx`

**Action:**
1. Wrap page with `<DashboardLayout>`.
2. Add top Financial Scorecards strip calculating live aggregates:
   - Total Invoiced ($)
   - Total Collected ($)
   - Outstanding Balance ($)
   - Overdue Invoices count and sum ($)
3. Add status filter pills: `All`, `Paid`, `Pending`, `Overdue`, `Draft`.
4. Restyle table inside rounded glassmorphic card container with tabular currency figures and glowing status badges.

**Verification:**
- Run `pnpm biome check src/app/billing/invoices/page.tsx`.

---

### Task 2: Quotes List View Polish & Pipeline KPI Strip
**Files:**
- `src/app/billing/quotes/page.tsx`

**Action:**
1. Wrap page with `<DashboardLayout>`.
2. Add Quote Pipeline Scorecards strip:
   - Total Pipeline Quoted ($)
   - Accepted / Won Quotes ($)
   - Pending Client Decision (count)
   - Draft Quotes (count)
3. Add status filter pills: `All`, `Accepted`, `Sent`, `Declined`, `Draft`.
4. Restyle table with glassmorphic cards, currency formatting, and action dropdowns.

**Verification:**
- Run `pnpm biome check src/app/billing/quotes/page.tsx`.

---

### Task 3: Customer Statements & Party Ledger Harmonization
**Files:**
- `src/app/billing/statements/page.tsx`
- `src/components/billing/ledger-view.tsx`

**Action:**
1. Wrap `src/app/billing/statements/page.tsx` with `<DashboardLayout>`.
2. Restyle `LedgerView`:
   - Date range selector with quick preset pills (`This Month`, `This Quarter`, `Year to Date`).
   - Running Balance Summary cards: Total Invoiced (Debits), Total Paid (Credits), Net Closing Balance.
   - Transaction ledger table with Debit (Emerald) and Credit (Slate) color highlighting.

**Verification:**
- Run `pnpm biome check src/app/billing/statements/page.tsx src/components/billing/ledger-view.tsx`.

---

### Task 4: Public Document Viewer Verification & Polish
**Files:**
- `src/components/public/document-viewer.tsx`

**Action:**
1. Verify document layout styling:
   - Enterprise corporate stationery header with tenant branding fallback.
   - Professional typography and tabular alignment.
   - Print media query styling (`print:m-0 print:border-none print:p-0`).

**Verification:**
- Run `pnpm biome check src/components/public/document-viewer.tsx`.

---

## Verification & Completion Gate
1. `pnpm biome check src/app/billing/invoices/page.tsx src/app/billing/quotes/page.tsx src/app/billing/statements/page.tsx src/components/billing/ledger-view.tsx src/components/public/document-viewer.tsx`
2. `pnpm vitest run` (all 12 unit tests passing)
3. Git commit and status report.
