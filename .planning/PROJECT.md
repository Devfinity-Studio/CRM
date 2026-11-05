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
- **Testing**: Vitest (18 unit & integration test suites, 65 tests)

## Current Milestone: v19 Super Admin Platform Engine: Feature Management, Integrations Hub & System Governance

**Goal:** Establish an enterprise-grade Super Admin command center for global and per-tenant dynamic feature flags, end-to-end integration monitoring (Dodo Payments, Svix, Neon Storage, Email), tenant deep inspection with audit logs, and global staff administration.

**Target features:**
1. **Dynamic Feature Flags & Module Toggling Engine**: Real-time cascading feature resolution (Global defaults -> Plan definitions -> Tenant overrides) controlling Inventory, Invoicing, Automations, AI Insights, Webhooks, and Custom Domains.
2. **Super Admin Integrations Center & Health Monitoring**: Live status, credential verification, and sync tools for Dodo Payments (subscriptions/checkouts), Svix (event delivery & resend queue), Neon Storage (S3 quotas & asset tracking), and System Email/SMTP.
3. **Tenant Deep Inspection & Security Audit Logs**: Drill-down tenant inspector showing resource utilization, active members, ledger volume, and an immutable system audit trail logging superadmin actions (impersonations, plan overrides, feature toggles).
4. **Global User & Staff Management**: Comprehensive user administration interface allowing staff role elevation (`SUPER_ADMIN` / `USER`), account status control (suspend/activate), password resets, and session termination.

## Current State
DevCRM completed **Milestone 18: Platform SaaS Payment & Subscription Gateway Integration** (Phases 54-55).
- **Dodo Payments Official SDK Integration**: Integrated `dodopayments` (Merchant of Record) with dual-environment support (`test_mode` and `live_mode`), secure credential management, and customer portal session generation.
- **Cryptographic Standard Webhooks Gateway**: Route handler at `/api/webhooks/dodo` verifying Standard Webhooks HMAC-SHA256 signatures over raw body bytes with idempotency caching.
- **Automated Entitlement & Quota Synchronization**: Real-time provisioning of tenant quotas (`maxContacts`, `maxInvoices`, `maxAutomationsMonthly`, `maxTeamSeats`, `maxStorageMb`) and active subscription statuses upon `subscription.active` and `subscription.renewed` events.
- **Tenant Subscription Billing Center (`/settings/billing`)**: Dedicated self-service portal displaying active plan, next renewal date, live resource quota meters, monthly vs annual pricing switcher (~20% discount), 1-click Upgrade hosted checkout triggers, and direct Customer Portal link.
- **Automated Testing & Production Compilation**: 18 test files (65/65 tests passing) and all 54 Next.js static/dynamic routes compiled cleanly.

<details>
<summary>Previous State (Milestones 1-17)</summary>

- **Milestone 17**: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection (Phases 49-53).
- **Milestone 16**: Test Expansion, Dev/Prod DB Segregation & Staged Deployment (Phases 47-48).
- **Milestone 15**: Production Sync & Neon Object Storage Migration (Phases 45-46).
- **Milestone 14**: Stitch UI Implementation & Production Integration (Phases 41-44).
- **Milestone 13**: UI Overhaul via Stitch MCP (Design system and layout screens generated).
- **Milestones 1-12**: Foundation, CRM pipelines, multi-tenancy, scoring, public API, billing, inventory, marketing, and onboarding.
</details>

## Evolution

This document evolves at phase transitions and milestone boundaries.
