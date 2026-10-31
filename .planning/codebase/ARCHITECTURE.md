---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Architecture

**Analysis Date:** 2026-10-31

## Pattern Overview

**Overall:** Full-Stack Monolithic Web Application built on the **T3 Stack** pattern (Next.js App Router, tRPC v11, Drizzle ORM, Tailwind CSS v4, NextAuth.js v5).

**Key Characteristics:**
- **Typesafe Remote Procedure Calls:** End-to-end type safety connecting React client hooks directly to server procedures without manually maintained API client wrappers or code generation steps.
- **Multi-Tenant Scoping:** Shared database architecture where every business record (`company`, `deal`, `contact`, `invoice`, `quote`, `task`) is scoped by `organizationId`.
- **Dual Authentication Boundary:** Seamless session handling supporting both cookie-based JWT sessions for browser users and SHA-256 hashed API keys for programmatic integrations.
- **Modern Component-Driven UI:** UI designed with Stitch MCP design system tokens, Tailwind CSS v4, Radix primitives, Lucide icons, and rich interactive features (Kanban drag-and-drop, Tiptap rich text editor, Recharts visualizations).

## Layers

**1. Presentation Layer (`src/app/`, `src/components/`):**
- **Purpose:** Render views, handle client interactions, and manage local component state.
- **Components:**
  - Route Handlers & Pages (`src/app`): Next.js 15 App Router pages including `(dashboard)`, `admin`, `superadmin`, `billing`, `deals`, `clients`, `onboarding`, `settings`, and `public`.
  - Domain Components (`src/components`): Divided by business domain (`deals/`, `crm/`, `billing/`, `automations/`, `layout/`).
  - Design System Primitives (`src/components/ui/`): Reusable shadcn/Radix components styled with Tailwind v4 CSS variables.
- **Depends on:** tRPC React Query client (`src/trpc/react.tsx`), Zustand UI stores (`src/store/dashboard-store.ts`), S3 upload hooks (`src/hooks/use-s3-upload.ts`).
- **Used by:** End-user browsers and client devices.

**2. API & Routing Layer (`src/server/api/`, `src/app/api/`):**
- **Purpose:** Validate requests, authenticate callers, authorize organization access, and expose RPC and REST endpoints.
- **Components:**
  - tRPC Router Root (`src/server/api/root.ts`): Aggregates 19 domain-specific sub-routers (`deals`, `crm`, `billing`, `marketing`, `auth`, `dashboard`, `onboarding`, `uploads`, `settings`, `inventory`, `automations`, `notifications`, `apiKeys`, `webhooks`, `reporting`, etc.).
  - tRPC Procedures & Middleware (`src/server/api/trpc.ts`): Creates context from Next.js headers (`createTRPCContext`), inspects JWT session or API key header, enforces `protectedProcedure` and `superAdminProcedure`, and logs execution duration.
  - Next.js Route Handlers (`src/app/api/`): REST entry points for NextAuth handler, cron processing, ad webhooks, lead ingestion, and tRPC endpoint.
- **Depends on:** Drizzle ORM (`src/server/db`), NextAuth (`src/server/auth.ts`), Svix (`src/lib/svix.ts`).
- **Used by:** Presentation layer components, external webhook senders, and automated cron callers.

**3. Business Logic & Integrations Layer (`src/server/webhooks/`, `src/server/api/routers/`):**
- **Purpose:** Encapsulate business rules, transaction lifecycle, status calculations, and external side effects.
- **Components:**
  - Webhook Dispatcher (`src/server/webhooks/dispatch.ts`): Dispatches outgoing events to Svix.
  - S3 Presigner (`src/server/api/routers/uploads.ts`): Generates pre-signed PUT/GET URLs for direct client S3 communication.
  - Automation Evaluator (`src/app/api/cron/process-automations/route.ts`): Evaluates date offsets and rule conditions to generate tasks, notifications, and communications.
- **Depends on:** Database schema, AWS SDK, Svix SDK.
- **Used by:** tRPC procedures and cron tasks.

**4. Data Access Layer (`src/server/db/`):**
- **Purpose:** Define database schemas, relationships, enums, and execute SQL queries.
- **Components:**
  - Database Schema (`src/server/db/schema.ts`): Complete Drizzle schema defining all tables (`users`, `organizations`, `companies`, `contacts`, `deals`, `pipelines`, `pipelineStages`, `invoices`, `quotes`, `payments`, `statements`, `clientSubscriptions`, `products`, `automationRules`, `apiKeys`, etc.).
  - Database Client (`src/server/db/index.ts`): Configured `postgres` connection pool with Drizzle query client.
- **Depends on:** PostgreSQL database instance.
- **Used by:** tRPC routers and route handlers.

## Data Flow

**Interactive User Action (e.g., Updating a Deal Stage):**
1. User drags a deal card in the Kanban board (`src/components/deals/kanban-board.tsx`).
2. Event handler invokes `api.deals.updateDealStage.useMutation()`.
3. Client tRPC proxy serializes input via SuperJSON and sends HTTP POST to `/api/trpc/deals.updateDealStage`.
4. Route handler invokes `createTRPCContext`, retrieving the authenticated user's session from cookie.
5. Procedure middleware verifies authenticated status and reads `ctx.session.user.organizationId`.
6. Procedure validates input with Zod, executes Drizzle `db.update(deals)`, and updates stage and order index.
7. Procedure optionally logs activity to `activityNotes` and dispatches webhook `deal.updated` via Svix.
8. Response is returned to client; React Query invalidates related queries and updates UI.

**Public API Request Flow (e.g., API Key Fetching Current User):**
1. External client sends `GET /api/v1/me` with header `x-api-key: devcrm_live_...`.
2. Handler calls `createTRPCContext`. Since no cookie session exists, it computes the SHA-256 hash of the key.
3. Database looks up the active key in `devcrm_api_key`.
4. Mock session is instantiated containing the linked user profile and `organizationId`.
5. Handler verifies `ctx.session.user` and returns organization data JSON.

**Automation Cron Processing Flow:**
1. Scheduled cron triggers `POST /api/cron/process-automations` with `Authorization: Bearer <CRON_SECRET>`.
2. Endpoint queries all active `automationRules`.
3. Iterates through rules (e.g., `INVOICE_DUE` with `daysOffset = -3`).
4. Checks unlogged target invoices. When condition matches, creates notification or task and inserts record into `automationLogs`.

## Key Abstractions

- **Multi-Tenant Organization Isolation:** Every core CRM table has `organizationId` referencing `organizations.id` with cascading deletes. Procedures must filter queries by `ctx.session.user.organizationId`.
- **Role Hierarchy:** System role (`SUPER_ADMIN` | `USER`) controls platform-wide administrative functions (`/superadmin`), while organization membership role (`OWNER` | `ADMIN` | `MEMBER` | `VIEWER`) governs tenant resource permissions.
- **Lifecycle Enums:** Formal state machines implemented as Postgres enums in `schema.ts`:
  - `dealStatusEnum`: `OPEN`, `WON`, `LOST`
  - `invoiceStatusEnum`: `DRAFT`, `PROFORMA`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`
  - `leadStatusEnum`: `NEW`, `QUALIFIED`, `CONTACTED`, `NURTURING`, `UNQUALIFIED`
  - `qualificationStatusEnum`: `NONE`, `MQL`, `SQL`, `DISQUALIFIED`
  - `subscriptionStatusEnum`: `ACTIVE`, `TRIALING`, `CANCELED`, `PAST_DUE`

## Entry Points

- **Web Browser Client:** `src/app/layout.tsx` (Root layout wrapping TRPCReactProvider, ThemeProvider, and Toaster)
- **Dashboard Home:** `src/app/dashboard/page.tsx`
- **tRPC API Handler:** `src/app/api/trpc/[trpc]/route.ts`
- **NextAuth Handler:** `src/app/api/auth/[...nextauth]/route.ts`
- **Automations Cron:** `src/app/api/cron/process-automations/route.ts`
- **Edge Middleware:** `src/middleware.ts`

