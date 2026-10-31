# PROJECT.md - DevCRM

## Vision
DevCRM is a comprehensive, end-to-end Customer Relationship Management platform designed for businesses to manage their entire client lifecycle: customer databases, leads, quotes, invoices, payments, subscriptions, inventory, ad campaigns, and automated reminders.

## Target Audience
Businesses, B2B companies, and sales/ops teams needing an all-in-one CRM suite for managing customer relations, operations, finance, and marketing.

## Primary Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.8
- **Database & ORM**: PostgreSQL with Drizzle ORM
- **API**: tRPC v11 & React Query
- **Styling & UI**: TailwindCSS v4 with Stitch MCP Premium Indigo Design System
- **Code Quality**: Biome
- **File Storage**: Cloudflare R2 (S3 API)
- **Testing**: Vitest

## Current Milestone: v14 Stitch UI Implementation & Production Integration

**Goal:** Implement and wire the Stitch MCP-designed layouts and components directly into the live Next.js App Router codebase, fully connected to tRPC procedures and database models.

**Target features:**
- **Phase 41: Dashboard Shell & Navigation Integration**: Integrate the redesigned Stitch sidebar, header, navigation controls, and glassmorphic metric cards into the live Next.js dashboard, connected to `dashboardRouter` tRPC queries.
- **Phase 42: Sales Pipeline Kanban Board UI Refresh**: Implement the Stitch glassmorphism deal cards, column headers, win/loss controls, and drag-and-drop interactions in `src/app/deals/page.tsx` and `src/components/deals/`, fully wired to `dealsRouter`.
- **Phase 43: CRM Client Profiles 2-Column Overhaul**: Build the responsive 2-column Stitch layout on client profile pages (`src/app/clients/[id]/page.tsx`), integrating the Deal History tab and the Chronological Activity Timeline with live tRPC mutations.
- **Phase 44: Billing & Financial Views Polish**: Harmonize invoices, quotes, payments, customer ledgers, and creation modals with the DevCRM Premium Indigo tokens and glassmorphism accents.

## Current State
DevCRM has completed **Milestone 14: Stitch UI Implementation & Production Integration** (Phases 41-44). The redesigned Stitch MCP design system, responsive 2-column client profile layouts, glassmorphic dashboard shell, interactive activity timeline, drag-and-drop Kanban pipeline board, and polished billing/ledger views are fully implemented and verified with live tRPC backends and multi-tenant scoping.

<details>
<summary>Previous State (Milestone 13)</summary>
DevCRM has completed **Milestone 13: UI Overhaul via Stitch MCP** (Design system and layout screens generated).
</details>

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
