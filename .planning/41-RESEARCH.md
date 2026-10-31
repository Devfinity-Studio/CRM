# Phase 41: Dashboard Shell & Navigation Integration - Research

**Date:** 2026-10-31
**Phase:** 41 (Milestone 14)
**Status:** Complete

## Executive Summary

Phase 41 transitions the Stitch MCP-designed Dashboard Layout (`Screen ID: 38787e1fc3e24405a1c32d2d0e2d8d39`) into production React code within the Next.js App Router. The research investigates:
1. Translating the Stitch HTML/CSS tokens and `.glass-panel` / `.glass-card-interactive` classes into Tailwind CSS v4 utility classes.
2. Building the collapsible sidebar navigation with 64px icon-rail mode and desktop/mobile responsiveness.
3. Enhancing `dashboardRouter` to support time period filtering (`This Month`, `This Quarter`, `This Year`, `All Time`), comparative trend percentages (`+18.4% vs last month`), and queries for recent deals and upcoming invoices.
4. Integrating the existing `DealSheet` directly into the dashboard overview table without navigating away.

---

## Technical Analysis & Stitch Architecture

### 1. Design Tokens & Styling
From the Stitch screen download (`projects/14542632693020697439/files/84171214fb7f4dec8af3f0a95b241723`), the design uses:
- **Glassmorphism Panels**:
  - Light mode: `bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm`
  - Interactive cards: Hover transition with `hover:border-indigo-500/50 hover:-translate-y-0.5 hover:shadow-md`
- **Typography & Font pairings**:
  - Inter for display and body text
  - JetBrains Mono for monetary values and code badges (`font-mono`)
- **Indigo Theme Accent**:
  - Primary color: `#6366f1` / `#4f46e5`
  - Glow effects: `bg-indigo-500/5 blur-3xl pointer-events-none`

### 2. Navigation & Layout Hierarchy
- **Desktop Sidebar (`aside`)**:
  - Top header: App branding (`DevCRM HQ`) + Organization Switcher dropdown
  - Navigation list: Dashboard, Deals, Contacts, Invoices, Settings, Tasks, Marketing, Automations
  - Action button: "+ New Deal" or "+ New Pipeline" shortcut
  - Collapse trigger: Toggle between ~240px expanded and 64px icon-rail
- **Top Header (`header`)**:
  - Sticky with `backdrop-blur-md`
  - Search field with `⌘K` keyboard shortcut badge
  - Notifications bell with unread indicator (`src/components/layout/notifications-bell.tsx`)
  - User avatar with dropdown menu (profile, settings, sign out)
- **Main Canvas (`main`)**:
  - Greeting banner with date range and period filter pills (`This Month`, `This Quarter`, `This Year`, `All Time`)
  - 4 KPI metric cards in a responsive grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`)
  - Two-column asymmetric section (`lg:grid-cols-12`):
    - Left (8 cols): Recent Deals table with stage badge, lead dev/contact, value, and row click opening `DealSheet`.
    - Right (4 cols): Upcoming Invoices with glassmorphic dashed empty state and "Generate Invoice" CTA.

---

## Backend & Data Flow Enhancements

### `src/server/api/routers/dashboard.ts`
Currently `dashboardRouter` provides basic counters (`totalContacts`, `unpaidInvoices`, `tasksDue`, `activePipelineValue`). For Phase 41, it needs:
1. **`getMetrics` input schema**:
   ```typescript
   z.object({
     period: z.enum(["month", "quarter", "year", "all"]).default("month"),
   })
   ```
2. **Metrics calculation**:
   - `totalRevenue`: Sum of paid invoices (`status = 'PAID'`) in the selected period.
   - `revenueTrend`: Comparative percentage change vs the immediately preceding period.
   - `activeDealsCount`: Count of open deals (`status = 'OPEN'`).
   - `pipelineValue`: Total monetary sum of active deals.
   - `overdueInvoicesCount` & `overdueAmount`: Invoices where `status = 'OVERDUE'` or (`status = 'SENT'` and `dueDate < now()`).
3. **`getRecentDeals` endpoint**:
   - Returns top 5 deals ordered by `updatedAt DESC` with joined `company`, `stage`, and `assignedUser`.
4. **`getUpcomingInvoices` endpoint**:
   - Returns top 5 invoices ordered by `dueDate ASC` where `status IN ('SENT', 'OVERDUE')`.
5. **`getLayoutData` expansion**:
   - Returns user profile, active organization, and the list of organizations the user belongs to (for the switcher).

---

## Component Inventory & Architecture

| Component | File Path | Scope |
| :--- | :--- | :--- |
| **`DashboardLayout`** | `src/components/layout/dashboard-layout.tsx` | Upgraded collapsible sidebar, mobile drawer, top header, org switcher |
| **`DashboardView`** | `src/app/dashboard/page.tsx` | Main dashboard canvas, greeting banner, period selector, KPI grid |
| **`KpiCard`** | `src/components/dashboard/kpi-card.tsx` | Glassmorphic metric card with trend badge, icon, and formatted currency |
| **`RecentDealsWidget`** | `src/components/dashboard/recent-deals-widget.tsx` | Table of recent deals with stage badge, avatar, and `DealSheet` trigger |
| **`UpcomingInvoicesWidget`** | `src/components/dashboard/upcoming-invoices-widget.tsx` | Upcoming invoices or glassmorphic empty state |

---

## Validation Architecture

1. **Static Analysis & Typecheck**:
   - `pnpm check`: 0 Biome lint or formatting errors.
   - `pnpm typecheck`: 0 TypeScript compiler errors.
2. **Unit Tests (`vitest`)**:
   - Add unit tests for `dashboardRouter.getMetrics` verifying period filtering and trend calculation logic.
3. **Visual & Interactive Acceptance Criteria**:
   - Sidebar toggles between 240px and 64px rail smoothly without layout flicker.
   - Clicking period pills (`This Month`, `This Quarter`, etc.) triggers React Query refetch and updates card figures.
   - Clicking a deal row opens `DealSheet` without page reload.
   - Responsive check: Mobile viewport displays hamburger button and opens drawer sheet.
