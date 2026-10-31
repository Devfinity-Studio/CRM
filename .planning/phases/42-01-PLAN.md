# Phase 42: Sales Pipeline Kanban Board UI Refresh - Plan

## Executive Summary
Phase 42 refreshes the DevCRM Sales Pipeline Kanban Board, Deal Cards, Column Headers, and associated Sheet/Dialog interfaces to the Stitch MCP glassmorphic design system with real-time optimistic drag-and-drop mechanics.

---

## Technical Context
- **Frameworks**: Next.js App Router (React 19), Tailwind CSS v4, tRPC v11, Drizzle ORM.
- **DND Library**: `@hello-pangea/dnd` for accessible drag-and-drop.
- **Design Tokens**: DevCRM Premium Indigo theme (`.glass-panel`, `.glass-card-interactive`, `backdrop-blur-md`, `border-border/70`).

---

## Task Breakdown

### Task 1: Backend Router Extensions & Unit Testing
**Files:**
- `src/server/api/routers/deals.ts`
- `src/server/api/__tests__/deals.test.ts`

**Action:**
1. Enhance `dealsRouter.getDeals` to left-join `companies` (`name`, `logoUrl`) and `users` (`name`, `image`).
2. Add `dealsRouter.getDeal` procedure accepting `{ dealId: z.string() }` returning full deal details with relations.
3. Ensure `moveDeal` and `updateDealStage` procedures update `stageId` and `orderIndex`.
4. Create `src/server/api/__tests__/deals.test.ts` to test `getDeals`, `moveDeal`, and `getMetricsSummary`.

**Verification:**
- Run `pnpm vitest run src/server/api/__tests__/deals.test.ts`.

---

### Task 2: Top Pipeline Summary Header & Shell
**Files:**
- `src/app/deals/page.tsx`

**Action:**
1. Fetch and render top summary metrics via `api.deals.getMetricsSummary.useQuery`:
   - Total Pipeline Value ($)
   - Forecasted Weighted Revenue ($)
   - Win Rate (%)
   - Active Deals Count
2. Add pipeline selector dropdown, "+ New Deal" trigger, and "+ View Forecast" link.
3. Wrap board container in responsive horizontal-scroll glass canvas.

**Verification:**
- Run `pnpm biome check src/app/deals/page.tsx`.

---

### Task 3: Glassmorphic Kanban Board & Deal Card Overhaul
**Files:**
- `src/components/deals/kanban-board.tsx`

**Action:**
1. Column Headers:
   - Color-accented stage dot with subtle glow.
   - Stage name and deal count badge.
   - Column total value ($) formatted with tabular numbers.
   - Win probability badge (`{stage.winProbability}% win prob`).
2. Deal Cards:
   - Card container with `bg-card/75 backdrop-blur-md border border-border/70 hover:border-primary/50`.
   - Company avatar (logo or 2-letter uppercase initials) and company name.
   - Monetary value formatted badge (`text-emerald-500 font-semibold`).
   - Expected close date with urgency badge (overdue, due soon).
   - Lead score and qualification status pill (SQL/MQL).
   - Assigned user avatar.
   - In-context hover actions menu (Quick Won/Lost, View Sheet).
3. Drag-and-drop:
   - `@hello-pangea/dnd` `DragDropContext` with optimistic updates in local state.
   - Mutation trigger to `moveDeal` with toast error rollback.

**Verification:**
- Run `pnpm biome check src/components/deals/kanban-board.tsx`.

---

### Task 4: Modernize `DealSheet` & `DealDialog`
**Files:**
- `src/components/deals/deal-sheet.tsx`
- `src/components/deals/deal-dialog.tsx`

**Action:**
1. `DealSheet`:
   - Enhanced slide-out drawer with status badges, stage changer dropdown, and quick Won/Lost action buttons.
   - Structured property grid (Company, Value, Stage, Assigned Owner, Close Date).
   - Integrated `ActivityTimeline`.
2. `DealDialog`:
   - Enhanced modal with company selection, contact selection, pipeline, stage, value, and expected close date.

**Verification:**
- Run `pnpm biome check src/components/deals/deal-sheet.tsx src/components/deals/deal-dialog.tsx`.

---

## Verification & Completion Gate
1. `pnpm biome check src/app/deals/page.tsx src/components/deals/kanban-board.tsx src/components/deals/deal-sheet.tsx src/components/deals/deal-dialog.tsx src/server/api/routers/deals.ts src/server/api/__tests__/deals.test.ts`
2. `pnpm vitest run src/server/api/__tests__/deals.test.ts`
3. `pnpm vitest run`
4. Git commit and status report.

