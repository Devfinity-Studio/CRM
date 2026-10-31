---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Codebase Structure

**Analysis Date:** 2026-10-31

## Directory Layout

```
e:\work\devcrm\
├── .planning/               # GSD milestones, phase documentation, and codebase maps
├── drizzle/                 # Drizzle ORM generated SQL migrations and metadata
│   ├── meta/                # Migration journal and snapshot files
│   └── *.sql                # Incremental database migration SQL files
├── public/                  # Static assets and images
├── scripts/                 # Standalone administrative and migration utility scripts
├── src/                     # Main application source code
│   ├── app/                 # Next.js 15 App Router pages, layouts, and API routes
│   │   ├── (dashboard)/     # Nested dashboard route groups (settings, etc.)
│   │   ├── admin/           # Tenant admin views (organizations, users)
│   │   ├── api/             # HTTP route handlers (auth, cron, leads, trpc, webhooks)
│   │   ├── automations/     # Workflow automation rules UI
│   │   ├── billing/         # Invoices, quotes, statements, payments, subscriptions
│   │   ├── c/               # Public/client shareable landing and view pages
│   │   ├── clients/         # Client profiles, detail pages, and creation flows
│   │   ├── contacts/        # Individual contact forms and directory
│   │   ├── dashboard/       # Main overview dashboard, metrics, and widgets
│   │   ├── deals/           # Deals Kanban board, details, and pipeline forecasting
│   │   ├── inventory/       # Product and service catalog inventory
│   │   ├── login/           # Authentication login page
│   │   ├── marketing/       # Marketing campaigns and ad performance views
│   │   ├── onboarding/      # New user / organization onboarding workflow
│   │   ├── pipeline/        # Sales pipeline configuration
│   │   ├── products/        # Product list and pricing
│   │   ├── public/          # Public-facing views for invoices, quotes, and statements
│   │   ├── register/        # Account registration page
│   │   ├── settings/        # Organization, profile, branding, and security settings
│   │   ├── superadmin/      # System-wide administrative controls and tenant manager
│   │   └── tasks/           # CRM tasks and follow-up reminders
│   ├── components/          # Reusable React components grouped by feature domain
│   │   ├── automations/     # Automation creation dialogs and cards
│   │   ├── billing/         # Quote builders, invoice tables, ledger views, payment dialogs
│   │   ├── clients/         # Client cards, lists, and forms
│   │   ├── crm/             # Activity timeline and interaction trackers
│   │   ├── deals/           # Kanban boards, deal dialogs, and deal detail sheets
│   │   ├── layout/          # Dashboard shell, header, sidebar, notifications bell
│   │   ├── onboarding/      # Multi-step onboarding components
│   │   ├── public/          # Public invoice/quote renderers and approval views
│   │   └── ui/              # Base shadcn / Radix UI design system primitives
│   ├── hooks/               # Custom React hooks (S3 upload, interactive tour)
│   ├── lib/                 # Core utility wrappers (Svix client, class merger utils)
│   ├── server/              # Server-side business logic, APIs, and data models
│   │   ├── api/             # tRPC root router, context, middleware, and domain routers
│   │   │   ├── __tests__/   # tRPC unit tests (API key context, auth)
│   │   │   └── routers/     # 19 domain-specific sub-routers
│   │   ├── auth.ts          # NextAuth v5 configuration and provider definitions
│   │   ├── db/              # Database schema definitions and connection pooling
│   │   └── webhooks/        # Webhook dispatch engine and unit tests
│   ├── store/               # Zustand client state stores (e.g., dashboard store)
│   ├── styles/              # Global Tailwind CSS v4 variables and custom styles
│   ├── trpc/                # tRPC React and server-side client bindings
│   ├── types/               # Shared TypeScript type definitions
│   ├── env.js               # Environment variable validation schema via @t3-oss/env-nextjs
│   └── middleware.ts        # Next.js route protection and session redirection middleware
├── biome.jsonc              # Biome linter, formatter, and import sorting configuration
├── components.json          # shadcn/ui configuration metadata
├── drizzle.config.ts        # Drizzle Kit configuration pointing to PostgreSQL schema
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies, scripts, and package metadata
├── tsconfig.json            # TypeScript configuration and path aliases
└── vitest.config.ts         # Vitest test runner configuration
```

## Directory Purposes

**`src/app/`:**
- **Purpose:** Next.js App Router hierarchical routes, layouts, and API routes.
- **Key Files:**
  - `src/app/layout.tsx`: Root HTML layout providing theme, tRPC context, and notifications provider.
  - `src/app/page.tsx`: Root redirector or landing page.
  - `src/app/api/trpc/[trpc]/route.ts`: tRPC API route handler hosting all RPC endpoints.
  - `src/app/api/auth/[...nextauth]/route.ts`: NextAuth authentication endpoint.
  - `src/app/api/cron/process-automations/route.ts`: Background automation job evaluator.

**`src/server/`:**
- **Purpose:** All server-side business logic, tRPC router implementations, database models, and external service adapters.
- **Key Files:**
  - `src/server/db/schema.ts`: Master database schema for PostgreSQL via Drizzle ORM.
  - `src/server/db/index.ts`: Database connection instantiation and pool configuration.
  - `src/server/api/root.ts`: Root tRPC router stitching together all domain routers.
  - `src/server/api/trpc.ts`: Context creation, procedure definitions, authentication guards, and timing middleware.
  - `src/server/auth.ts`: NextAuth handlers, adapter integration, and credentials authorization.

**`src/components/`:**
- **Purpose:** Visual React presentation components divided into domain-specific modules and atomic UI primitives.
- **Key Subdirectories:**
  - `deals/`: `kanban-board.tsx`, `deal-sheet.tsx`, `deal-dialog.tsx`.
  - `crm/`: `activity-timeline.tsx`.
  - `billing/`: `record-payment-dialog.tsx`, `ledger-view.tsx`, `generate-statement-dialog.tsx`.
  - `layout/`: `dashboard-layout.tsx`, `notifications-bell.tsx`, `impersonation-banner.tsx`.
  - `ui/`: 30+ accessible primitives (buttons, dialogs, dropdowns, inputs, rich text editor, signature pad).

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root application UI shell
- `src/app/api/trpc/[trpc]/route.ts`: Backend RPC server endpoint
- `src/middleware.ts`: Next.js request interceptor for protected route enforcement

**Configuration:**
- `src/env.js`: Environment variable type schemas and runtime validation
- `drizzle.config.ts`: Drizzle ORM migration and schema configuration
- `biome.jsonc`: Biome code formatting, linting, and import ordering rules
- `tsconfig.json`: TypeScript compiler options and `@/*` / `~/*` path aliases
- `vitest.config.ts`: Vitest unit and integration test configuration

**Core Business Logic:**
- `src/server/db/schema.ts`: Database relational schema and status enums
- `src/server/api/routers/deals.ts`: Deals pipeline management, stages, and metrics
- `src/server/api/routers/billing.ts`: Invoice, quote, payment, and statement generation
- `src/server/api/routers/crm.ts`: Contacts, companies, client profiles, and activity logs
- `src/server/api/routers/automations.ts`: Trigger rules, conditions, and action dispatch
- `src/server/webhooks/dispatch.ts`: Outbound webhook dispatch via Svix

**Testing:**
- `src/server/api/__tests__/trpc.test.ts`: tRPC API key authentication and context tests
- `src/server/webhooks/__tests__/dispatch.test.ts`: Webhook delivery and error-handling tests
