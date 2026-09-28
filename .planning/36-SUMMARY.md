# Phase 36: Pipeline Forecasting & Reporting - Summary

## Work Completed
- Added `status` (`OPEN`, `WON`, `LOST`) and `contactId` to the `deals` schema.
- Updated the Kanban board to dynamically filter and display only `OPEN` deals.
- Enhanced the `DealSheet` with action buttons to "Mark as Won" and "Mark as Lost".
- Refactored `getMetricsSummary` in TRPC to group active deals and calculate forecasted pipeline value dynamically using win probabilities from each stage, and to accurately compute the real win/loss ratios.
- Built the `ForecastDashboard` (`/deals/forecast`) showing Total Open Pipeline, Forecasted Revenue, Deals Won, and Win Rate, closing the feedback loop for sales forecasting.

## Next Steps
- Milestone 12 is complete! Run `/gsd-complete-milestone` to wrap it up and transition to Milestone 13.
