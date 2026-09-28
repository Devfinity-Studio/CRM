# Milestone 12: Expanded CRM Workflows & Sales Pipelines - Requirements

## 1. Goal
Evolve DevCRM from a basic contact manager into a fully-fledged sales pipeline tool by introducing Deals, Kanban-style tracking, activity logging, lead qualification, and pipeline forecasting. This will empower sales teams to manage their entire workflow natively within the platform.

## 2. Requirements

### Phase 33: Deals & Kanban Pipeline
- [ ] **Schema Updates**: Introduce a `deals` table with stages (e.g., Prospect, Qualified, Proposal, Won, Lost), amounts, close dates, and relations to `companies`/`contacts`.
- [ ] **Kanban Board UI**: Build a drag-and-drop Kanban board to visualize deals across stages.
- [ ] **Deal Management**: Create modals/forms to add, edit, and move deals between stages.

### Phase 34: Activity Tracking Timeline
- [ ] **Activity Schema**: Create an `activities` table to log notes, calls, emails, and meetings associated with a client or deal.
- [ ] **Timeline UI**: Build a chronological activity feed on the Client and Deal detail pages.
- [ ] **Activity Forms**: Implement quick-add widgets to log new activities and schedule future tasks/reminders.

### Phase 35: Lead Scoring & Qualification
- [ ] **Scoring Engine**: Implement a basic scoring system (e.g., 0-100) based on profile completeness, engagement, or manual weighting.
- [ ] **Qualification Tags**: Allow users to explicitly mark leads as "Marketing Qualified" or "Sales Qualified".
- [ ] **Visual Indicators**: Display lead scores prominently on the Kanban board and contact lists.

### Phase 36: Pipeline Forecasting & Reporting
- [ ] **Win/Loss Analysis**: Build charts to track win rates and reasons for lost deals.
- [ ] **Revenue Forecasting**: Calculate projected revenue based on deal probability and expected close dates.
- [ ] **Sales Dashboard**: Create a dedicated view/widget summarizing pipeline health and active pipeline value.
