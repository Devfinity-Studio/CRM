# ROADMAP.md - DevCRM

## Milestones & Phases

### Milestone 17: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection
- [x] **Phase 49: Multi-Tenancy, Custom Domains, Tenant RBAC & Entitlement Engine**
  - **Goal:** Host-header routing in middleware.ts (crm.devfinity.net, {slug}.devfinity.net, custom domains via Vercel Domains API), expanded tenant RBAC with granular permissions matrix, centralized entitlement and quota engine, and tRPC tenantProcedure / entitlementProcedure.
  - **Depends on:** Milestone 16
  - **Plans:** 2/2 plans completed
- [x] **Phase 50: Super Admin Control Plane, Plan Builder, Tenant Overrides & Platform Billing**
  - **Goal:** Super Admin Console at /super-admin with tenant discovery, status toggling, impersonation session switcher, SaaS Plan Builder (pricing, quotas, module flags), per-tenant overrides, and platform SaaS billing integration (Dodo Payments / Razorpay webhooks and checkout).
  - **Depends on:** Phase 49
  - **Plans:** 2/2 plans completed
- [x] **Phase 51: Dynamic Tax Engine, Interconnected Contacts, Deals, Quotes & Soft Inventory Holds**
  - **Goal:** Country/state-aware tax engine (CGST/SGST/IGST, VAT, Sales Tax), deal line-item integration with soft inventory reservations to prevent overselling, quotation e-signatures (react-signature-canvas), and 360° contact/company activity timeline with automated LTV metrics.
  - **Depends on:** Phase 50
  - **Plans:** 2/2 plans completed
- [ ] **Phase 52: Invoicing Lifecycle, Subscriptions Engine & Unified Telemetry Dashboard**
  - **Goal:** Compliant invoice lifecycle state machine, hard stock deductions with immutable stockMovements ledger, recurring subscription billing engine (daily to annual cycles, dunning alerts, auto renewal), and unified Executive Dashboard telemetry.
  - **Depends on:** Phase 51
  - **Plans:** 0/2 plans completed
- [ ] **Phase 53: Cross-Module Automation Event Bus, Svix Webhooks, Global Command Palette & Staged Release**
  - **Goal:** Internal domain event bus, automation execution engine with multi-condition evaluation and audit logs, outbound Svix webhooks, global Cmd+K command palette (cmdk), Vitest automated testing, and staged Vercel deployment to production (crm.devfinity.net).
  - **Depends on:** Phase 52
  - **Plans:** 0/2 plans completed

### Milestone 16: Test Expansion, Dev/Prod DB Segregation & Staged Deployment (Completed)
- [x] [Archived in v16-ROADMAP.md](./milestones/v16-ROADMAP.md)

### Milestone 15: Production Sync & Neon Object Storage Migration (Completed)
- [x] [Archived in v15-ROADMAP.md](./milestones/v15-ROADMAP.md)

### Milestone 14: Stitch UI Implementation & Production Integration (Completed)
- [x] [Archived in v14-ROADMAP.md](./milestones/v14-ROADMAP.md)

### Milestone 13: UI Overhaul via Stitch MCP (Completed)
- [x] [Archived in v13-ROADMAP.md](./milestones/v13-ROADMAP.md)

### Milestone 12: Expanded CRM Workflows & Sales Pipelines (Completed)
- [x] [Archived in v12-ROADMAP.md](./milestones/v12-ROADMAP.md)

### Milestone 11: User Onboarding & Experience Polish (Completed)
- [x] [Archived in v11-ROADMAP.md](./milestones/v11-ROADMAP.md)

### Milestone 10: Finalization & Deployment (Completed)
- [x] [Archived in v10-ROADMAP.md](./milestones/v10-ROADMAP.md)

### Milestone 9: Platform Administration & Tenant Management (Completed)
- [x] [Archived in v9-ROADMAP.md](./milestones/v9-ROADMAP.md)

### Milestone 8: Marketing, Automations & Analytics (Completed)
- [x] [Archived in v8-ROADMAP.md](./milestones/v8-ROADMAP.md)

### Milestone 7: Catalog, Inventory & Subscriptions (Completed)
- [x] **Phase 20: Products & Services Catalog**
- [x] **Phase 21: Inventory Management (Merged with Phase 20)**
- [x] **Phase 22: Recurring Subscriptions (Completed as Phase 21)**

### Milestone 6: Core Billing & Financial Operations (Completed)
- [x] [Archived in v6-ROADMAP.md](./milestones/v6-ROADMAP.md)

### Milestone 5: Public API & Webhooks (Completed)
- [x] [Archived in v5-ROADMAP.md](./milestones/v5-ROADMAP.md)

### Milestone 4: Lead Scoring & Pipeline Customization (Completed)
- [x] [Archived in v4-ROADMAP.md](./milestones/v4-ROADMAP.md)

### Milestone 3: Multi-Tenancy & Data Isolation (Completed)
- [x] [Archived in v3-ROADMAP.md](./milestones/v3-ROADMAP.md)

### Milestone 2: Core CRM Entities & Pipelines (Completed)
- [x] [Archived in v2-ROADMAP.md](./milestones/v2-ROADMAP.md)

### Milestone 1: Foundation & Authentication (Completed)
- [x] [Archived in v1-ROADMAP.md](./milestones/v1-ROADMAP.md)
