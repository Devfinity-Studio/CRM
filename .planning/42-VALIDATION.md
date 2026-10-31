# Phase 42: Sales Pipeline Kanban Board UI Refresh - Validation

## Quality Gates & Verification Matrix

### 1. Automated Verification Checks
| Scope | Command | Acceptance Threshold |
| :--- | :--- | :--- |
| **Linting & Formatting** | `pnpm biome check src/app/deals/page.tsx src/components/deals/kanban-board.tsx src/components/deals/deal-sheet.tsx src/components/deals/deal-dialog.tsx src/server/api/routers/deals.ts src/server/api/__tests__/deals.test.ts` | 0 errors, 0 warnings |
| **Unit Testing (Deals)** | `pnpm vitest run src/server/api/__tests__/deals.test.ts` | All tests passing |
| **Full Regression Suite** | `pnpm vitest run` | All tests passing across all suites |

### 2. Manual & Functional Checks
- **Drag-and-Drop Integrity**: Dragging a deal card across columns triggers optimistic UI placement, persists via `dealsRouter.moveDeal`, and shows error toast on failure.
- **Card Metadata Display**: Company avatar/name, value badge, close date badge, qualification status, and assigned owner avatar render accurately.
- **Column Header Metrics**: Deal count badge, total stage amount ($), and win probability indicator display accurate live aggregates.
- **Top Pipeline Summary Bar**: Displays Total Pipeline Value, Forecasted Weighted Revenue, Win Rate %, and active deals count.
- **Modernized Drawers/Modals**: Opening `DealSheet` displays rich properties and activity timeline; opening `DealDialog` offers complete deal creation fields.
