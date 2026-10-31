---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Coding Conventions

**Analysis Date:** 2026-10-31

## Naming Patterns

**Files & Directories:**
- Component & hook files: `kebab-case.tsx` or `kebab-case.ts` (e.g., `src/components/layout/dashboard-layout.tsx`, `src/hooks/use-s3-upload.ts`). Certain compound UI components retain PascalCase (e.g., `SetupChecklist.tsx`, `WelcomeModal.tsx`).
- Routers: `camelCase.ts` or `kebab-case.ts` in `src/server/api/routers/` (e.g., `apiKeys.ts`, `client-subscriptions.ts`, `deals.ts`, `crm.ts`).
- Route groups and dynamic segments: Next.js App Router conventions (e.g., `(dashboard)`, `[id]`, `[...nextauth]`).

**Functions & Variables:**
- Standard functions and variables: `camelCase` (e.g., `createTRPCContext`, `dispatchWebhook`, `isProtectedRoute`).
- React Components: `PascalCase` (e.g., `DashboardLayout`, `KanbanBoard`, `ActivityTimeline`).
- Database Enums & Constants: `UPPER_SNAKE_CASE` for enum values (e.g., `ACTIVE`, `TRIALING`, `WON`, `LOST`, `SUPER_ADMIN`), `camelCaseEnum` for Drizzle enum variables (e.g., `userRoleEnum`, `dealStatusEnum`).

**Types & Interfaces:**
- Types and interfaces: `PascalCase` (e.g., `AppRouter`, `Session`, `InvoiceStatus`). No Hungarian `I` prefix.
- Drizzle table infer types: e.g., `typeof deals.$inferSelect` or `typeof deals.$inferInsert`.

**Database Tables:**
- Defined via `createTable` helper prefixing table names with `devcrm_` (e.g., `devcrm_user`, `devcrm_organization`, `devcrm_deal`).

## Code Style & Formatting

**Linter & Formatter (Biome):**
- Configured in `biome.jsonc` (replaces both ESLint and Prettier).
- 2-space indentation, semicolons enabled, double quotes for JSON, single/double quotes per JS standard.
- Automated import organization (`organizeImports: "on"`).
- Sorted class utility rules enabled (`useSortedClasses: "warn"` targeting `clsx`, `cva`, `cn`).
- Run commands:
  - `pnpm check`: Check linting and formatting.
  - `pnpm check:write`: Automatically format and fix issues.

**Component Architecture:**
- React Server Components (RSC) are used by default for data-fetching pages and layouts.
- Client Components must declare `"use client"` at the very top of the file when using React hooks (`useState`, `useEffect`, `useRouter`), browser APIs, or interactive UI libraries (`@hello-pangea/dnd`, `@tiptap/react`).
- Styling uses Tailwind CSS v4 utility classes combined with `cn()` (`src/lib/utils.ts` combining `clsx` and `tailwind-merge`).

## Import Organization

**Order & Grouping:**
1. External core libraries (e.g., `react`, `next`, `@trpc/server`, `drizzle-orm`)
2. Icons and third-party UI libraries (e.g., `lucide-react`, `@radix-ui/*`, `recharts`)
3. Internal application modules using path aliases (`~/server/*`, `~/components/*`, `~/lib/*`)
4. Relative imports (`./*`, `../*`)
5. Explicit type imports (`import type { ... }`)

**Path Aliases:**
- Configured in `tsconfig.json`:
  - `~/` maps to `./src/`
  - `@/` maps to `./src/`
  - Note: Prefer `~/` consistently for imports across server and client code.

## Error Handling & Validation

**Input Validation:**
- All tRPC mutation and query inputs must be validated using Zod schemas (`.input(z.object({ ... }))`).
- Environment variables are strictly validated on startup with Zod schemas in `src/env.js`.

**Server Errors:**
- Throw `TRPCError` with standard HTTP error codes:
  - `UNAUTHORIZED` - Unauthenticated users attempting to access protected procedures.
  - `FORBIDDEN` - Authenticated users lacking required role privileges (e.g., non-SUPER_ADMIN on superadmin routes).
  - `NOT_FOUND` - Target entity does not exist or does not belong to the user's organization.
  - `BAD_REQUEST` - Validation failures or invalid business operations.
  - `INTERNAL_SERVER_ERROR` - Unhandled external service failures.

**Multi-Tenancy Guarding:**
- Every query operating on tenant-owned data must explicitly filter by `organizationId: ctx.session.user.organizationId` to enforce strict isolation.
