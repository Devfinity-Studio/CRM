# Phase 41: Dashboard Shell & Navigation Integration - Context

**Gathered:** 2026-10-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 41 delivers the production integration of the Stitch MCP-designed Dashboard Layout. This includes the responsive collapsible sidebar navigation, top header with organization switcher, glassmorphic KPI summary cards with trend badges and period filters, and overview tables for recent deals and upcoming invoices wired to live tRPC queries.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Navigation & Layout
- **D-01:** Desktop sidebar uses a collapsible rail pattern: expanded by default (~240px wide with icon + label) and collapsible to a 64px icon-only rail with tooltip labels on hover.
- **D-02:** Organization switcher lives in the sidebar header right below the DevCRM brand logo, showing active organization name, logo, and dropdown to switch tenants.
- **D-03:** Mobile navigation employs a responsive slide-in drawer sheet triggered by the top header hamburger button.

### Dashboard KPI Metric Cards
- **D-04:** The 4 core KPI cards (Total Revenue, Active Deals, New Leads, Overdue Invoices) feature comparative trend badges (e.g., `+12.5% vs previous period` with green/red status styling).
- **D-05:** Dashboard header includes period selector filter pills (`This Month`, `This Quarter`, `This Year`, `All Time`) dynamically passing time parameters to `dashboardRouter` tRPC queries.

### Dashboard Preview Widgets
- **D-06:** Recent Deals table: Clicking any deal row opens the slide-out `DealSheet` directly in place, keeping the user in dashboard context without a full page refresh.
- **D-07:** Upcoming Invoices table: Clicking an invoice row navigates to the detailed view (`/billing/invoice/[id]`), with quick view/action controls revealed on hover.

### Glassmorphism & Theming
- **D-08:** Aesthetic follows subtle modern glassmorphism: `bg-card/75` with `backdrop-blur-md`, delicate 1px border (`border-border/50`), and soft indigo hover glow.
- **D-09:** Full dual-mode support: crisp frosted white/slate in light mode and deep rich dark indigo/slate in dark mode based on `globals.css` design tokens.

### the agent's Discretion
- Exact layout spacing, micro-interactions, loading skeleton states, and Lucide icon selections for navigation items.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §Phase 41 — [Requirements REQ-41-01 to REQ-41-04]
- `.planning/ROADMAP.md` §Milestone 14 — [Phase structure and milestone goals]

### Design Tokens & Style
- `src/styles/globals.css` — [DevCRM Premium Indigo theme tokens, radius, and color variables]
- `.planning/codebase/ARCHITECTURE.md` — [Presentation layer and tRPC data flow]
- `.planning/codebase/CONVENTIONS.md` — [Naming conventions, component design, and Biome standards]

### Backend Routers
- `src/server/api/routers/dashboard.ts` — [Existing dashboard metrics and query endpoints]
- `src/server/api/routers/deals.ts` — [Deals queries used by recent deals widget]
- `src/server/api/routers/billing.ts` — [Invoice queries used by upcoming invoices widget]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/dashboard-layout.tsx`: Current dashboard layout shell, to be upgraded with Stitch collapsible navigation.
- `src/components/layout/notifications-bell.tsx`: Notification bell component to embed in the top header.
- `src/components/deals/deal-sheet.tsx`: Deal slide-out sheet component to trigger from recent deal rows.
- `src/app/dashboard/_components/SetupChecklist.tsx` & `WelcomeModal.tsx`: Existing onboarding components integrated into the dashboard page.

### Established Patterns
- tRPC v11 React Query hooks (`api.dashboard.getMetrics.useQuery`, `api.deals.getRecentDeals.useQuery`).
- shadcn/ui components (`Card`, `Button`, `Badge`, `DropdownMenu`, `Sheet`, `Tooltip`) styled with Tailwind CSS v4 variables.

### Integration Points
- `src/app/(dashboard)/layout.tsx` / `src/components/layout/dashboard-layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/server/api/routers/dashboard.ts`

</code_context>

<specifics>
## Specific Ideas
- Maintain Stitch screen aesthetics (Screen ID: `38787e1fc3e24405a1c32d2d0e2d8d39`) with sleek KPI cards, crisp borders, and Indigo accents.

</specifics>

<deferred>
## Deferred Ideas
- None — all discussed features are firmly in scope for Phase 41.

</deferred>

---

*Phase: 41-dashboard-shell-navigation*
*Context gathered: 2026-10-31*

