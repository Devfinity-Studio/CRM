# Phase 48: UI and UX Redesign - Master Plan

## Goal
Execute a comprehensive, route-by-route UI/UX overhaul, zero-defect contrast remediation, responsive mobile ergonomics optimization, and Stitch MCP design system implementation across all surfaces of DevCRM (Desktop `1024px+` and Mobile `320px-767px`), preserving 100% of business logic, tRPC router contracts, and state bindings.

---

## Master Route & Surface Ledger

### Category A: Global Shells, Design Tokens & Shared UI Primitives
1. `src/styles/globals.css`: Theme tokens, surface elevation, WCAG AAA text contrast, focus rings, autofill overrides, safe-area variables.
2. `src/components/layout/dashboard-layout.tsx`: Desktop sidebar, responsive collapse rail, top header, notifications bell, mobile drawer/bottom bar.
3. `src/components/layout/superadmin-layout.tsx`: Superadmin navigation shell, organization switcher, tenant badge.
4. `src/components/ui/button.tsx`: 44px min mobile touch target, contrast states (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`).
5. `src/components/ui/input.tsx` & `src/components/ui/textarea.tsx`: 16px font size on mobile (anti-zoom), high-contrast borders, focus-visible glow.
6. `src/components/ui/card.tsx`: Glassmorphic styling, subtle border tokens, background surface isolation.
7. `src/components/ui/badge.tsx`: High-contrast status pills (success, warning, error, neutral, accent).
8. `src/components/ui/table.tsx`: Clean desktop tables with responsive mobile card / horizontal touch scroll container.
9. `src/components/ui/dialog.tsx` & `src/components/ui/sheet.tsx`: Desktop modal centered, mobile bottom sheet (`max-h-[88dvh]`, sticky headers/footers).
10. `src/components/ui/tabs.tsx`: Smooth horizontal scrolling tabs on mobile without scrollbar clipping.
11. `src/components/ui/empty-state.tsx`: Modern illustrated empty state cards with clear call-to-actions.

### Category B: Core Workflow Pages
12. `src/app/page.tsx`: Modern flagship landing page with glassmorphic hero, feature grid, and auth navigation.
13. `src/app/dashboard/page.tsx`: Glassmorphic KPI scorecards, interactive charts, recent deals, and cashflow pulse.
14. `src/app/deals/page.tsx` & `src/app/pipeline/page.tsx`: Kanban pipeline board, stage summary headers, deal cards, drag-and-drop mechanics.
15. `src/app/deals/forecast/page.tsx`: Weighted revenue forecast table, quarter/month toggle, probability metrics.
16. `src/app/clients/page.tsx`: Client directory data table, search input, status filters, quick-action dropdowns.
17. `src/app/clients/[id]/page.tsx`: 2-column client profile (Left: info & historical deals; Right: interactive chronological activity timeline).
18. `src/app/clients/new/page.tsx` & `src/app/contacts/new/page.tsx`: Structured client and POC creation form with field validation.
19. `src/app/tasks/page.tsx`: Task list/kanban, priority pills, due-date badges, status toggle.
20. `src/app/billing/invoices/page.tsx` & `src/app/billing/invoices/new/page.tsx`: Invoice list table and multi-line item invoice creator.
21. `src/app/billing/quotes/page.tsx` & `src/app/billing/quotes/new/page.tsx`: Quote management and proposal drafting views.
22. `src/app/billing/subscriptions/page.tsx`: Recurring plan cards, renewal dates, MRR indicators, status badges.
23. `src/app/billing/statements/page.tsx`: Customer party ledgers, running balance cards, debit/credit color-coding.
24. `src/app/products/page.tsx` & `src/app/inventory/products/page.tsx`: Catalog item cards, SKU management, stock level indicators, adjustment modals.
25. `src/app/marketing/page.tsx` & `src/app/marketing/ads/page.tsx`: Marketing campaign dashboard, lead acquisition charts, broadcast templates.
26. `src/app/automations/page.tsx`: Workflow automation cards, trigger/action badges, execution logs.
27. `src/app/settings/profile/page.tsx`, `organization/page.tsx`, `branding/page.tsx`, `security/page.tsx`, `api-keys/page.tsx`, `webhooks/page.tsx`: Workspace administration tabs.
28. `src/app/admin/page.tsx`, `admin/organizations/page.tsx`, `admin/users/page.tsx`: Tenant administration panels.
29. `src/app/superadmin/page.tsx`, `superadmin/tenants/page.tsx`, `superadmin/settings/page.tsx`: Global SaaS platform oversight console.
30. `src/app/login/page.tsx`, `register/page.tsx`, `onboarding/page.tsx`: Clean auth cards, OAuth buttons, multi-step tenant onboarding wizard.
31. `src/app/c/[orgId]/page.tsx`: Client self-service portal (invoice history, quote approval, statements).
32. `src/app/public/invoice/[id]/page.tsx` & `public/quote/[id]/page.tsx` & `public/statement/[id]/page.tsx`: Public viewable documents with print-friendly layout.

### Category C: Modals, Dialogs & Sheets
33. `src/components/deals/deal-sheet.tsx` & `deal-dialog.tsx`: Deal details drawer and edit dialog.
34. `src/components/clients/add-poc-dialog.tsx` & `client-creation-modal.tsx`: Contact and company creation modals.
35. `src/components/billing/record-payment-dialog.tsx` & `view-payments-dialog.tsx`: Payment recording and transaction history.
36. `src/components/billing/generate-statement-dialog.tsx`: Date range and party picker statement generator.
37. `src/components/billing/shared/tax-configuration-modal.tsx` & `cess-configuration-modal.tsx` & `signature-pad-modal.tsx`.
38. `src/components/automations/create-rule-dialog.tsx`: Event trigger and action condition builder.

### Category D: System & Edge Views
39. `src/app/not-found.tsx`: Global branded 404 page with return-to-dashboard shortcut.
40. `src/app/error.tsx`: Global error boundary with retry trigger and error reporting.
41. `src/app/loading.tsx`: Elegant skeleton placeholder shell matching Stitch design tokens.

---

## Requirements
- **REQ-48-01**: Establish Stitch design tokens in `globals.css` guaranteeing WCAG 2.1 AAA contrast ratios in light/dark modes, 16px mobile input anti-zoom, and safe-area insets.
- **REQ-48-02**: Overhaul shared primitives (`Button`, `Input`, `Card`, `Badge`, `Table`, `Dialog`, `Sheet`, `Tabs`, `EmptyState`) with mobile touch targets (min 44px) and zero white-on-white / dark-on-dark defects.
- **REQ-48-03**: Modernize navigation shells (`dashboard-layout.tsx`, `superadmin-layout.tsx`) with desktop glassmorphic sidebar and mobile drawer/bottom bar ergonomics.
- **REQ-48-04**: Redesign core workflow views (Dashboard, Deals, Pipeline, Clients, Tasks, Billing, Invoices, Quotes, Subscriptions, Statements, Products, Inventory, Marketing, Automations) with Stitch glassmorphism and mobile responsive cards.
- **REQ-48-05**: Redesign Workspace Settings, Admin, Superadmin, Auth (`login`, `register`, `onboarding`), Client Portal (`/c/`), and Public Document Viewers (`/public/`).
- **REQ-48-06**: Implement System/Edge views (`not-found.tsx`, `error.tsx`, `loading.tsx`) with consistent theme styling.
- **REQ-48-07**: Preserve 100% of existing tRPC procedures, forms, handlers, data schemas, and Vitest automated tests (21/21 passing, Next.js build clean).

---

## Execution Phases / Sub-Plans

### Wave 1: Design Tokens, Shells & UI Primitives (Plan 48-01)
- Audit & update `src/styles/globals.css`:
  * Surface colors, high-contrast borders, focus-visible rings (`ring-2 ring-primary/50`).
  * Mobile dynamic viewport units (`min-h-dvh`), safe-area insets (`env(safe-area-inset-bottom)`).
  * WebKit autofill text color correction.
- Refactor base components in `src/components/ui`:
  * `button.tsx`: 44px min height on touch devices (`h-11 sm:h-9`), visible contrast borders.
  * `input.tsx` & `textarea.tsx`: `text-base sm:text-sm` (preventing iOS Safari auto-zoom), high contrast placeholder and border colors.
  * `card.tsx`: Glassmorphism with dark-mode background isolation.
  * `badge.tsx`: Glowing contrast badges.
  * `dialog.tsx` & `sheet.tsx`: Bottom sheet anchoring on `< 640px`.
  * `table.tsx`: Horizontal scroll with sticky first column or responsive card conversion.
- Modernize `src/components/layout/dashboard-layout.tsx` & `superadmin-layout.tsx`:
  * Desktop sidebar rail + top bar.
  * Mobile drawer + sticky mobile header with 44px triggers.

### Wave 2: Operations, Sales & CRM Views (Plan 48-02)
- Overhaul `/dashboard`: KPI scorecards, pulse indicators, deal tables.
- Overhaul `/deals` & `/pipeline`: Kanban drag-and-drop cards, column badges, probability indicators.
- Overhaul `/deals/forecast`: Forecast grid, weighted totals.
- Overhaul `/clients`, `/clients/[id]`, `/clients/new`, `/contacts/new`: 2-column client profile, chronological timeline, POC cards.
- Overhaul `/tasks`: Task filters, priority tags, status checkboxes.

### Wave 3: Billing, Catalog, Inventory, Marketing & Automations (Plan 48-03)
- Overhaul `/billing/invoices` & `/billing/invoices/new`: Table, line item builder, tax calculations.
- Overhaul `/billing/quotes` & `/billing/quotes/new`: Proposal builder, status pills.
- Overhaul `/billing/subscriptions` & `/billing/statements`: MRR cards, party ledger running balance.
- Overhaul `/products` & `/inventory/products`: Product grid, SKU tables, stock levels.
- Overhaul `/marketing` & `/marketing/ads`: Campaign cards, lead acquisition stats.
- Overhaul `/automations`: Trigger/action cards, rule builder dialog.

### Wave 4: Admin, Auth, Portals, System Views & Verification (Plan 48-04)
- Overhaul Settings (`profile`, `organization`, `branding`, `security`, `api-keys`, `webhooks`).
- Overhaul Admin & Superadmin (`admin/organizations`, `admin/users`, `superadmin/tenants`, `superadmin/settings`).
- Overhaul Auth (`/login`, `/register`, `/onboarding`, `/`).
- Overhaul Client & Public Portals (`/c/[orgId]`, `/public/invoice/[id]`, `/public/quote/[id]`, `/public/statement/[id]`).
- Create `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/loading.tsx`.
- Run full test verification: `pnpm vitest run`, `pnpm biome check`, `pnpm build`.
- Deploy to Vercel preview and production following staged deployment protocol.

---

## Verification Checklist
- [ ] 0 hardcoded contrast collisions (no white-on-white or dark-on-dark text).
- [ ] All interactive touch targets >= 44px on mobile (`< 768px`).
- [ ] No iOS Safari auto-zoom (all mobile inputs >= 16px font-size).
- [ ] Zero horizontal overflow (`overflow-x`) on viewports down to 320px.
- [ ] All modals transform cleanly to bottom sheets on mobile.
- [ ] All existing tRPC procedures, forms, and business logic intact.
- [ ] `pnpm vitest run`: 21/21 passing unit tests.
- [ ] `pnpm biome check`: 0 errors.
- [ ] `pnpm build`: 45/45 routes compile successfully.
- [ ] Staged Vercel preview & production deployments verified live.
