# Phase 42: Sales Pipeline Kanban Board UI Refresh - Research

**Date:** 2026-10-31
**Phase:** 42 (Milestone 14)
**Status:** Complete

## Technical Analysis

### 1. Backend Data Shape (`dealsRouter`)
In `src/server/api/routers/deals.ts`:
- `getDeals` currently joins `contacts` to return `leadScore` and `qualificationStatus`.
- To fulfill REQ-42-01 (company avatars, assigned reps, deal tags, value badges):
  - Add `leftJoin(companies, eq(deals.companyId, companies.id))` to retrieve `companies.name` and `companies.logoUrl`.
  - Add `leftJoin(users, eq(deals.assignedUserId, users.id))` to retrieve `users.name` and `users.image`.
- Add procedure `getDeal`:
  - Detailed single-deal query for `DealSheet` returning associated contact, company, pipeline stage, and assigned user.
- Verify `moveDeal` and alias `updateDealStage` to maintain compatibility with existing call sites while satisfying REQ-42-03.

### 2. Frontend Kanban Board & Drag-and-Drop (`kanban-board.tsx`)
- Drag-and-drop is powered by `@hello-pangea/dnd`.
- Local optimistic state `localDeals` updates immediately on `onDragEnd` and rolls back if the mutation fails.
- Column header styling:
  - Color-accented stage indicator with glowing background halo (`bg-[stage.color]/10 border-[stage.color]/30`).
  - Stage name, deal count pill, aggregated value in tabular numerals, and win probability badge (`{stage.winProbability}%`).
- Glassmorphic Deal Card:
  - Rounded container (`rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-xs hover:border-primary/50 hover:shadow-md transition-all`).
  - Visual dragging state: `scale-[1.02] shadow-xl border-primary ring-2 ring-primary/20 rotate-1`.
  - Company avatar with fallback initials.
  - Expected close date badge with urgency tint (red for overdue, amber for <= 7 days, muted for later).
  - Score & qualification pill (SQL/MQL/Unqualified).
  - Assigned user avatar.

### 3. Pipeline Header Summary Bar (`src/app/deals/page.tsx`)
- High-level metric summary scorecards above the board using `deals.getMetricsSummary`:
  - **Total Pipeline**: Formatted sum of all open deals.
  - **Forecasted Revenue**: Sum of `deal.value * (stage.winProbability / 100)`.
  - **Win Rate**: Closed won vs closed lost percentage.
  - **Active Deals**: Count of open opportunities.
- Top control bar:
  - Pipeline switcher dropdown (if multiple pipelines exist).
  - Quick action "+ New Deal" button.
  - Navigation button to `/deals/forecast`.

### 4. Modals & Sheets (`deal-sheet.tsx` & `deal-dialog.tsx`)
- `DealSheet`:
  - Styled with Radix `Sheet` primitive.
  - Status management header with Won/Lost quick toggles and stage dropdown.
  - Formatted monetary value hero and key property grid.
  - Activity timeline integrated seamlessly.
- `DealDialog`:
  - Styled with Radix `Dialog` primitive.
  - Comprehensive creation form with title, value, pipeline, stage, client/company selection, and expected close date.

### 5. Automated Verification Plan
- Unit tests in `src/server/api/__tests__/deals.test.ts` testing `getDeals`, `getMetricsSummary`, and `moveDeal`.
- Biome check (`pnpm biome check`) across all modified deals files.
- Vitest run (`pnpm vitest run`) to confirm 100% test pass rate.

