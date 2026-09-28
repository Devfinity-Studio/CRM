# Phase 36: Pipeline Forecasting & Reporting - Context

## Scope
Provide high-level visibility into the sales pipeline. Users need to track win/loss rates and see a forecast of potential revenue based on the stage of active deals.

## Decisions Made
- **Database Schema**: Add `status` enum (`OPEN`, `WON`, `LOST`) to the `deals` table. Add `contactId` to deals since we used it in Phase 34/35 but it appears to be missing in schema `deals` definition. (Wait, let me check if `contactId` is in `deals` schema. Ah, it was referenced in `kanban-board.tsx` and `crm.ts`, I better add it properly to `deals` schema as well).
- **Forecasting Report**: A simple dashboard page (`/deals/forecast`) showing:
  - Total Pipeline Value (sum of all open deals).
  - Forecasted Value (sum of `deal.value * stage.winProbability / 100`).
  - Win/Loss ratio.
- **Deal Actions**: Allow marking a deal as "Won" or "Lost" from the Kanban card or Deal Sheet.

## Out of Scope
- Advanced multi-currency conversion for forecasting.
- Historical trend lines (month-over-month comparisons).
