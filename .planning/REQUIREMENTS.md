# Milestone 14: Stitch UI Implementation & Production Integration - Requirements

## 1. Goal
Implement and wire the Stitch MCP-designed layouts and components directly into the live Next.js App Router codebase, fully connected to tRPC procedures and database models.

## 2. Requirements

### Phase 41: Dashboard Shell & Navigation Integration
- [x] **REQ-41-01**: Implement the redesigned Stitch Sidebar navigation with collapse/expand support, active route indicators, and organization switcher styling.
- [x] **REQ-41-02**: Upgrade the top header with user profile menu, tenant notifications pill, and search bar integration.
- [x] **REQ-41-03**: Implement the glassmorphic KPI cards on the dashboard (`/dashboard`), connecting live metrics (Total Revenue, Active Deals, New Leads, Overdue Invoices) to `dashboardRouter`.
- [x] **REQ-41-04**: Implement the recent deals table and upcoming invoice preview widgets on the dashboard.

### Phase 42: Sales Pipeline Kanban Board UI Refresh
- [x] **REQ-42-01**: Overhaul deal card components (`src/components/deals/`) with Stitch glassmorphism styling, company avatars, deal tags, and value badges.
- [x] **REQ-42-02**: Refresh Kanban column headers with stage deal counts, aggregated values, and win probability indicators.
- [x] **REQ-42-03**: Ensure smooth drag-and-drop mechanics (`@hello-pangea/dnd`) with optimistic state updates wired to `dealsRouter.updateDealStage`.
- [x] **REQ-42-04**: Modernize the `DealSheet` and `DealDialog` with the Stitch modal/drawer styling.

### Phase 43: CRM Client Profiles 2-Column Overhaul
- [ ] **REQ-43-01**: Re-architect `src/app/clients/[id]/page.tsx` into the Stitch 2-column layout (Client Info & Deal History on Left/Primary, Interactive Activity Timeline on Right).
- [ ] **REQ-43-02**: Polish the chronological `ActivityTimeline` with modern icons for notes, calls, emails, and meetings, plus inline quick-add forms.
- [ ] **REQ-43-03**: Add deal history cards showing historical and open deals associated with the client.
- [ ] **REQ-43-04**: Display contact lead scores and qualification badges with consistent theme tokens.

### Phase 44: Billing & Financial Views Polish
- [ ] **REQ-44-01**: Restyle the invoices list (`/billing/invoices`) and quotes list (`/billing/quotes`) data tables with rounded glassmorphic card containers and status badges.
- [ ] **REQ-44-02**: Harmonize customer statement views and party ledgers (`/billing/statements`) with the DevCRM Premium Indigo theme.
- [ ] **REQ-44-03**: Verify public invoice/quote layouts (`/public/invoice/[id]`) display cleanly with the new design system.

