# ROADMAP.md - DevCRM

## Milestones & Phases

### Milestone 19: Super Admin Platform Engine: Feature Management, Integrations Hub & System Governance (Active)
- [x] **Phase 56: Dynamic Feature Flags & Cascading Module Toggles**
  - **Goal**: Implement hierarchical feature flag resolution (Global -> Plan -> Tenant) and UI controls in `/superadmin/features`.
  - **Depends on**: Phase 55
  - **Requirements**: REQ-56-01, REQ-56-02, REQ-56-03, REQ-56-04, REQ-56-05
  - **Plans**: 2 plans (completed)
- [x] **Phase 56.1: Security Hardening & PII Encryption (INSERTED)**
  - **Goal**: Implement application-level PII encryption (PAN, Aadhaar, Passport), eliminate cross-tenant IDORs in remaining domain routers (billing, automations, apiKeys, clientSubscriptions), secure public ingestion endpoints, and enforce role-based access control (RBAC).
  - **Depends on**: Phase 56
  - **Requirements**: SEC-01, SEC-02, SEC-05, SEC-07, SEC-08, SEC-12
  - **Plans**: 2 plans (completed)
- [x] **Phase 57: Global Integration Center & Third-Party Service Health Monitoring**
  - **Goal**: Build integration monitoring and operational tools for Dodo Payments, Svix, Neon Storage, and Email.
  - **Depends on**: Phase 56.1
  - **Requirements**: REQ-57-01, REQ-57-02, REQ-57-03, REQ-57-04, REQ-57-05
  - **Plans**: 2 plans (completed)
- [ ] **Phase 58: Tenant Deep Inspection & Superadmin Activity Audit Trail**
  - **Goal**: Create immutable system audit logging and tenant drill-down inspection dashboard.
  - **Depends on**: Phase 57
  - **Requirements**: REQ-58-01, REQ-58-02, REQ-58-03, REQ-58-04, REQ-58-05
  - **Plans**: 1-2 plans
- [ ] **Phase 59: Global Staff Administration & User Access Governance**
  - **Goal**: Full user governance, staff role management, session revocation, navigation polish, and full production build verification.
  - **Depends on**: Phase 58
  - **Requirements**: REQ-59-01, REQ-59-02, REQ-59-03, REQ-59-04, REQ-59-05
  - **Plans**: 1-2 plans

### Milestone 18: Platform SaaS Payment & Subscription Gateway Integration (Completed)
- [x] [Archived in v18-ROADMAP.md](./milestones/v18-ROADMAP.md)

### Milestone 17: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection (Completed)
- [x] [Archived in v17-ROADMAP.md](./milestones/v17-ROADMAP.md)

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
