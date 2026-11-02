# PROJECT.md - DevCRM

## Vision
DevCRM is a comprehensive, end-to-end Customer Relationship Management platform designed for businesses to manage their entire client lifecycle: customer databases, leads, quotes, invoices, payments, subscriptions, inventory, ad campaigns, and automated reminders.

## Target Audience
Businesses, B2B companies, and sales/ops teams needing an all-in-one CRM suite for managing customer relations, operations, finance, and marketing.

## Primary Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8
- **Database & ORM**: Neon Serverless PostgreSQL with Drizzle ORM
- **API**: tRPC v11 & React Query
- **Styling & UI**: TailwindCSS v4 with Stitch MCP Premium Indigo Design System
- **Code Quality**: Biome
- **File Storage**: Neon Object Storage (`uploads` bucket via Neon Files SDK / S3 API)
- **Deployment & Hosting**: Vercel Production & Staged Preview
- **Testing**: Vitest (23 unit & integration test suites)

## Current State
DevCRM has completed **Milestone 17: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection** (Phases 49-53).
- **Multi-Tenancy & Edge Host Routing**: Fully dynamic host-header resolution for custom domains and subdomains (`crm.devfinity.net`, `{slug}.devfinity.net`), injecting `x-tenant-id` and `x-tenant-slug` headers with edge caching.
- **Tenant RBAC & Entitlement Quota Engine**: 6 tenant roles (`TENANT_OWNER`, `ADMIN`, `SALES_REP`, `ACCOUNTANT`, `INVENTORY_MANAGER`, `CUSTOM_ROLE`) with modular JSON permissions matrix and centralized entitlement procedure guards.
- **Super Admin Control Plane & SaaS Billing**: Superadmin console at `/super-admin` with plan builder, tenant quotas/overrides, secure impersonation banner, and platform SaaS billing via Dodo Payments / Razorpay.
- **Regional Dynamic Tax Engine**: Country- and state-aware tax calculation supporting India GST (CGST/SGST/IGST + reverse charge), UK/EU VAT, and US Sales Tax.
- **Deal Line Items & Soft Inventory Reservations**: Automated reservations preventing overselling, proposal digital e-signatures (`react-signature-canvas`), and 360° unified timeline with LTV telemetry.
- **Compliant Invoicing State Machine & Ledger**: 8-state invoice transition engine, hard stock deductions into immutable `stockMovements` ledger, and recurring subscription billing cycles.
- **Domain Event Bus & Outbound Webhooks**: Internal event dispatcher with multi-condition rules, audit logging in `automationLogs`, and Svix outbound webhook delivery.
- **Global Command Palette (`cmdk`)**: Keyboard-first `⌘K`/`Ctrl+K` cross-module search querying Deals, Companies, Contacts, Invoices, Quotes, and Products.
- **Testing & Staged Release**: 57/57 Vitest tests passing, 47/47 Next.js routes compiled cleanly, deployed to production.

<details>
<summary>Previous State (Milestone 16)</summary>
DevCRM completed **Milestone 16: Test Expansion, Dev/Prod DB Segregation & Staged Deployment** (Phases 47-48) with automated test expansion, Neon DB Dev/Prod segregation, Master UI/UX overhaul across 75 surfaces, and Driver.js tour synchronization.
</details>

<details>
<summary>Previous State (Milestone 15)</summary>
DevCRM completed **Milestone 15: Production Sync & Neon Object Storage Migration** (Phases 45-46). Neon PostgreSQL branches were synchronized with pending Drizzle migrations (0011-0013), Cloudflare R2 was replaced by Neon Object Storage (`uploads` bucket), and live verification was performed on Vercel.
</details>

<details>
<summary>Previous State (Milestone 14)</summary>
DevCRM completed **Milestone 14: Stitch UI Implementation & Production Integration** (Phases 41-44). The redesigned Stitch MCP design system, responsive 2-column client profile layouts, glassmorphic dashboard shell, interactive activity timeline, drag-and-drop Kanban pipeline board, and polished billing/ledger views were fully implemented.
</details>

<details>
<summary>Previous State (Milestone 13)</summary>
DevCRM completed **Milestone 13: UI Overhaul via Stitch MCP** (Design system and layout screens generated).
</details>

## Next Milestone Goals
- Milestone 17: Next generation feature expansion (e.g. AI-powered lead scoring/qualification, advanced multi-channel notifications, customer portal payment gateway integration, or deep analytics reporting).

## Evolution

This document evolves at phase transitions and milestone boundaries.
