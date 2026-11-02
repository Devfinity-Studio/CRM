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
DevCRM has completed **Milestone 18: Platform SaaS Payment & Subscription Gateway Integration** (Phases 54-55).
- **Dodo Payments Official SDK Integration**: Integrated `dodopayments` (Merchant of Record) with dual-environment support (`test_mode` and `live_mode`), secure credential management, and customer portal session generation.
- **Cryptographic Standard Webhooks Gateway**: Route handler at `/api/webhooks/dodo` verifying Standard Webhooks HMAC-SHA256 signatures over raw body bytes with idempotency caching.
- **Automated Entitlement & Quota Synchronization**: Real-time provisioning of tenant quotas (`maxContacts`, `maxInvoices`, `maxAutomationsMonthly`, `maxTeamSeats`, `maxStorageMb`) and active subscription statuses upon `subscription.active` and `subscription.renewed` events.
- **Tenant Subscription Billing Center (`/settings/billing`)**: Dedicated self-service portal displaying active plan, next renewal date, live resource quota meters, monthly vs annual pricing switcher (~20% discount), 1-click Upgrade hosted checkout triggers, and direct Customer Portal link.
- **Automated Testing & Production Compilation**: 18 test files (65/65 tests passing) and all 49 Next.js static/dynamic routes compiled cleanly.

<details>
<summary>Previous State (Milestone 17)</summary>
DevCRM completed **Milestone 17: Enterprise Multi-Tenant SaaS Platform & Deep Module Interconnection** (Phases 49-53) with dynamic host-header resolution for custom domains, 6-role tenant RBAC, regional dynamic tax engine (GST/VAT/Sales Tax), deal line-item inventory reservations, digital e-signatures, compliant invoicing state machine, domain event bus, and global `⌘K` command palette.
</details>

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
