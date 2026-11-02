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
DevCRM has completed **Milestone 16: Test Expansion, Dev/Prod DB Segregation & Staged Deployment** (Phases 47-48).
- **Automated Test Suite Expansion**: Comprehensive Vitest coverage across Webhooks dispatch, tRPC router procedures, presigned S3 upload pipelines, Dashboard telemetry, Deals Kanban pipelines, Onboarding state tracking, and CRM/Billing operations (23/23 tests passing).
- **Neon Database Segregation & Parity**: Verified schema parity across Neon database branches `Dev` (`br-jolly-bird-az9jq7gz`) and `production` (`br-little-scene-az7iw7fk`).
- **Staged Vercel Architecture**: Vercel project `devfinity-crm` linked to `dev` for Preview deployments (targeting Neon Dev DB) and `prod` for Production deployments (targeting Neon Prod DB).
- **Master UI/UX Overhaul**: 75/75 routes, layout shells, modals, drawers, and edge views upgraded with 4-tier surface elevation, WCAG 2.1 AAA contrast, $\ge 44\text{px}$ mobile touch targets, and iOS Safari auto-zoom prevention.
- **Selective Route Onboarding Gating**: Route-aware warning banner on `/dashboard` and `/settings/profile` ensuring full interaction without trapping the user; full-page backdrop blocker on restricted business sub-routes.
- **Tutorial & Tour Synchronization**: Driver.js guided tour and Welcome Modal synchronized to only display after onboarding completion.
- **Live Production Deployment**: Confirmed `READY` on `https://devfinity-crm.vercel.app` and `https://crm.devfinity.net` with `HTTP 200 OK`.

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
