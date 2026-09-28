# Phase 36: Pipeline Forecasting & Reporting - Plan

## Step 1: Database Schema Updates
- **Action**: Add `dealStatusEnum` (`OPEN`, `WON`, `LOST`) to `schema.ts`.
- **Action**: Update `deals` table to include `status` (default `OPEN`) and `contactId` (string, references contacts).
- **Action**: Run DB migration.

## Step 2: TRPC Endpoints
- **Action**: Update `dealsRouter.getDeals` to correctly join `contactId`.
- **Action**: Add `dealsRouter.updateDealStatus` mutation.
- **Action**: Add `dealsRouter.getForecast` query that groups open deals by stage and applies `winProbability` to calculate expected revenue.

## Step 3: Deal Actions UI
- **Action**: In `DealSheet`, add buttons to mark a deal as "Won" or "Lost".
- **Action**: Filter out Won/Lost deals from the active Kanban board by default.

## Step 4: Forecasting Dashboard
- **Action**: Create `src/app/deals/forecast/page.tsx`.
- **Action**: Build simple summary cards (Total Pipeline, Forecasted Revenue, Deals Won, Deals Lost).
