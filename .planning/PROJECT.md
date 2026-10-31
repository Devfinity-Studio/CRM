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
- **Deployment & Hosting**: Vercel Production
- **Testing**: Vitest

## Current State
DevCRM has completed **Milestone 15: Production Sync & Neon Object Storage Migration** (Phases 45-46).
- **Database Sync**: Neon PostgreSQL branches (`production` and `Dev`) are 100% synchronized with all pending Drizzle schema migrations (0011-0013) applied across contacts, deals, notes, and user accounts.
- **Neon Object Storage**: Cloudflare R2 has been replaced by native Neon Object Storage (`uploads` bucket in `ap-southeast-1`), integrated via `files-sdk/neon` and verified with small-file upload/download tests.
- **Production Deployment**: Vercel project `devfinity-crm` is deployed live on `https://devfinity-crm.vercel.app` from synchronized `prod` branch with all production environment variables configured.
- **Full Verification**: Static prerender resilience verified with all 45/45 routes compiled cleanly, 12/12 passing Vitest unit tests, 0 Biome errors/warnings, and live HTTP 200 health checks across core public and authenticated endpoints.

<details>
<summary>Previous State (Milestone 14)</summary>
DevCRM completed **Milestone 14: Stitch UI Implementation & Production Integration** (Phases 41-44). The redesigned Stitch MCP design system, responsive 2-column client profile layouts, glassmorphic dashboard shell, interactive activity timeline, drag-and-drop Kanban pipeline board, and polished billing/ledger views are fully implemented and verified with live tRPC backends and multi-tenant scoping.
</details>

<details>
<summary>Previous State (Milestone 13)</summary>
DevCRM completed **Milestone 13: UI Overhaul via Stitch MCP** (Design system and layout screens generated).
</details>

## Next Milestone Goals
- Plan and execute next feature set (e.g., advanced automated email notifications, customer portal enhancements, expanded reporting analytics, or AI-powered lead qualification).

## Evolution

This document evolves at phase transitions and milestone boundaries.
