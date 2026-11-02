# Milestone 17: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection - Requirements

## 1. Goal
Upgrade DevCRM from a functional MVP into an enterprise-grade multi-tenant SaaS platform that outperforms legacy CRMs: dynamic host-header resolution for custom domains, granular tenant RBAC, centralized feature gating and quota engine, Super Admin Control Plane with SaaS Plan Builder and Dodo Payments/Razorpay platform billing, regional dynamic tax engine, interconnected data flows (deals + quotes + e-signatures + inventory soft/hard reservations), recurring subscription lifecycle engine, cross-module domain event bus with Svix webhooks, and a global Cmd+K command palette.

## 2. Requirements

### Phase 49: Multi-Tenancy, Custom Domains, Tenant RBAC & Entitlement Engine
- [x] **REQ-49-01**: Host-Header Resolution in `middleware.ts` resolving `crm.devfinity.net`, tenant subdomains `{slug}.devfinity.net`, and custom domains (via Vercel Domains API integration and caching), injecting `x-tenant-id` and `x-tenant-slug` headers.
- [x] **REQ-49-02**: Tenant RBAC expansion in schema (`TENANT_OWNER`, `ADMIN`, `SALES_REP`, `ACCOUNTANT`, `INVENTORY_MANAGER`, `CUSTOM_ROLE`) with JSON permissions matrix (`module: { read, create, update, delete, export }`).
- [x] **REQ-49-03**: Centralized Entitlement & Quota Engine (`checkEntitlement`, `checkQuota`) gating access to modules and enforcing monthly limits (contacts, invoices, automation runs, seats, storage).
- [x] **REQ-49-04**: tRPC `tenantProcedure` and `entitlementProcedure` enforcing automatic tenant isolation, role authorization, and feature/quota limits.

### Phase 50: Super Admin Control Plane, Plan Builder, Tenant Overrides & Platform Billing
- [x] **REQ-50-01**: Dedicated Super Admin Console at `/super-admin` with tenant discovery, status toggling, and secure impersonation session switcher with persistent banner.
- [x] **REQ-50-02**: SaaS Plan Builder allowing superadmins to create/edit subscription plans, price tiers, seat/contact quotas, and boolean module flags.
- [x] **REQ-50-03**: Per-tenant override management allowing custom quotas, beta module access, and billing waivers.
- [x] **REQ-50-04**: Platform SaaS billing integration with Dodo Payments (and Razorpay) for checkout sessions, recurring subscription lifecycle, and webhook synchronization.

### Phase 51: Dynamic Tax Engine, Interconnected Contacts, Deals, Quotes & Soft Inventory Holds
- [x] **REQ-51-01**: Country- and state-aware Dynamic Tax Engine using `country-state-city` (India GST with CGST/SGST/IGST + reverse charge, UK/EU VAT, US Sales Tax).
- [x] **REQ-51-02**: SKU line-item integration on Deals with automated soft inventory reservations (`reservedQuantity`) in negotiation/won stages to prevent overselling.
- [x] **REQ-51-03**: Quotation builder with digital e-signatures (`react-signature-canvas`) and public approval/signing view.
- [x] **REQ-51-04**: 360° unified chronological timeline on Contacts and Companies showing deals, rich-text notes (`@tiptap/react`), signed quotes, invoices, and LTV calculation.

### Phase 52: Invoicing Lifecycle, Subscriptions Engine & Unified Telemetry Dashboard
- [x] **REQ-52-01**: Invoicing full state machine (`Draft` -> `Sent` -> `Viewed` -> `Partially Paid` -> `Paid` -> `Overdue` -> `Void` / `Credit Note Issued`) with print-ready PDF generation (`react-to-print`) and hosted customer payment link.
- [x] **REQ-52-02**: Hard inventory stock deduction on invoice fulfillment with immutable `stockMovements` ledger tracking.
- [x] **REQ-52-03**: Recurring subscription engine supporting daily, weekly, monthly, and annual billing cycles, automated renewal invoice generation, and dunning alerts on payment failure.
- [x] **REQ-52-04**: Unified Executive Dashboard displaying live MRR/ARR, cash-flow run rate, pipeline conversion velocity, and low-stock alerts.

### Phase 53: Cross-Module Automation Event Bus, Svix Webhooks, Global Command Palette & Staged Release
- [x] **REQ-53-01**: Strongly-typed internal domain event bus emitting cross-module events (`deal.stage_changed`, `deal.won`, `invoice.created`, `invoice.paid`, `inventory.low_stock`).
- [x] **REQ-53-02**: Automation execution runner supporting multi-condition evaluation (`AND`/`OR`) and automated actions (tasks, notifications, emails, webhooks, inventory adjustments) with execution audit logs.
- [x] **REQ-53-03**: Outbound webhook orchestration with Svix for tenant endpoint registration and signature verification.
- [x] **REQ-53-04**: Global `Cmd+K` / `Ctrl+K` command palette (`cmdk`) for cross-module search and quick keyboard navigation.
- [x] **REQ-53-05**: Full test suite expansion (Vitest), Biome lint/format check, and staged Vercel deployment (preview on `dev` -> production on `prod` / `crm.devfinity.net`).

