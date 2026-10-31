# Phase 42: Sales Pipeline Kanban Board UI Refresh - Context

## Overview
Phase 42 implements the Stitch UI redesign of the Sales Pipeline Kanban board, deal cards, stage headers, and detail modals/sheets in DevCRM.

## User Decisions & Preferences
1. **Top Pipeline Summary Bar**:
   - Render a high-density, glassmorphic summary bar directly above the Kanban board showing:
     - Total Pipeline Value ($)
     - Forecasted Weighted Revenue ($ based on stage win probabilities)
     - Overall Win Rate (%)
     - Active Deals count
     - Pipeline selector dropdown with "+ New Pipeline" / "+ New Deal" quick action buttons.
2. **Deal Card Design & Metadata**:
   - Apply Stitch glassmorphism card styling (`bg-card/75 backdrop-blur-md border border-border/70 shadow-xs hover:border-primary/50 hover:shadow-md transition-all`).
   - Company logo / initials avatar and company name.
   - Monetary deal value formatted in emerald/indigo badge.
   - Expected close date with urgency indicator (overdue, due soon).
   - Lead score indicator and qualification status badge (SQL, MQL).
   - Assigned team member avatar with fallback initials.
   - In-context quick actions menu on hover (Edit, Quick Won/Lost, View Details).
3. **Column Headers & Stage Metrics**:
   - Color-coded stage indicator dot with glowing pulse for active stages.
   - Stage name and deal count badge.
   - Aggregated stage value ($).
   - Win probability indicator (% badge) showing conversion likelihood.
4. **Drag & Drop Dynamics**:
   - Fluid drag and drop via `@hello-pangea/dnd` with optimistic UI updates.
   - Wired to `dealsRouter.moveDeal` / `updateDealStage`.
   - Error rollback with Sonner toast feedback.
5. **Modernized Modals & Drawers**:
   - `DealSheet`: Slide-out drawer with tabs/sections for Overview, Deal Details (Client, Owner, Value, Stage, Close Date), Quick Won/Lost triggers, and Activity Timeline.
   - `DealDialog`: Glassmorphic modal with company autocomplete, contact selection, pipeline/stage picker, and value formatting.
