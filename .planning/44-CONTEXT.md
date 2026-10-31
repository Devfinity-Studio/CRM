# Phase 44: Billing & Financial Views Polish - Context

## Overview
Phase 44 is the final phase of Milestone 14 ("Stitch UI Implementation & Production Integration"). It brings full Stitch design harmony to all financial and billing interfaces:
- `/billing/invoices`: Invoices list with KPI cards, filtering, and glassmorphic tables.
- `/billing/quotes`: Quotes list with pipeline metrics, status indicators, and actions.
- `/billing/statements`: Statements list and interactive party ledger (`LedgerView`).
- `/public/invoice/[id]` & `/public/quote/[id]`: Clean, responsive public document viewers.

## User Decisions & Preferences
1. **Top Scorecard Banners**:
   - Above the invoices and quotes data tables, add top financial KPI scorecards:
     - Invoices: Total Invoiced ($), Total Collected ($), Balance Due ($), Overdue Count.
     - Quotes: Total Quoted Value ($), Accepted Value ($), Pending Quotes, Drafts.
2. **Glassmorphic Status Badges**:
   - Modern glassmorphic badges with subtle glowing borders and colored status indicator dots:
     - `PAID` / `ACCEPTED`: Emerald wash with emerald dot (`text-emerald-500 bg-emerald-500/10 border-emerald-500/20`).
     - `OVERDUE` / `DECLINED`: Crimson wash with red dot (`text-red-500 bg-red-500/10 border-red-500/20`).
     - `SENT` / `PROFORMA`: Indigo/Sky blue wash (`text-sky-500 bg-sky-500/10 border-sky-500/20`).
     - `DRAFT`: Slate/neutral wash (`text-muted-foreground bg-muted border-border/70`).
3. **Layout Consistency**:
   - Wrap `/billing/invoices`, `/billing/quotes`, and `/billing/statements` in `<DashboardLayout>` so the sidebar navigation and header shell are always present.
4. **Theme Tokens**:
   - Align with DevCRM Premium Indigo theme tokens (`.glass-panel`, `.glass-card-interactive`, `backdrop-blur-md`, `border-border/70`).
