---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Technology Stack

**Analysis Date:** 2026-10-31

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code, server APIs, database schemas, React components, and hooks (`src/`)

**Secondary:**
- JavaScript / CommonJS - Build configuration, migration scripts, and utility runners (`migrate.cjs`, `next.config.js`, `postcss.config.js`)
- SQL - Database migrations and schema definitions (`drizzle/*.sql`)
- CSS - Styling tokens, Tailwind directives, and glassmorphic UI design tokens (`src/styles/globals.css`)

## Runtime

**Environment:**
- Node.js >=20.x
- Next.js Turbopack execution runtime for fast development builds (`next dev --turbo`)

**Package Manager:**
- pnpm 11.5.1
- Lockfile: `pnpm-lock.yaml` (strict monorepo-compatible dependency lock)
- Workspace config: `pnpm-workspace.yaml`

## Frameworks

**Core:**
- Next.js 15.2.3 - Full-stack React framework utilizing the App Router (`src/app`), Server Components, Client Components, and Next.js Route Handlers (`src/app/api/`)
- React 19.0.0 & React DOM 19.0.0 - Component rendering and modern React concurrent primitives
- tRPC v11.0.0 (`@trpc/server`, `@trpc/client`, `@trpc/react-query`) - End-to-end typesafe client-server communication
- TanStack React Query 5.69.0 (`@tanstack/react-query`) - Client-side asynchronous server-state synchronization and caching

**Testing:**
- Vitest 5.0.1 (`vitest`) - Modern unit and integration test runner configured for Node environment (`vitest.config.ts`)
- vite-tsconfig-paths 6.1.1 - Path resolution for TypeScript path aliases in test execution

**Build/Dev:**
- Biome 2.2.5 (`@biomejs/biome`) - Fast unified linter, formatter, and import organizer replacing ESLint and Prettier (`biome.jsonc`)
- Tailwind CSS v4.0.15 (`tailwindcss`, `@tailwindcss/postcss`) - Utility-first styling framework with CSS variables
- PostCSS 8.5.3 - CSS transformations and PostCSS pipeline
- Drizzle Kit 0.30.5 (`drizzle-kit`) - Schema migration generator, schema push, and database studio (`drizzle.config.ts`)

## Key Dependencies

**Critical:**
- `drizzle-orm` (0.41.0) & `postgres` (3.4.4) - PostgreSQL ORM, schema builder (`createTable`), and connection driver
- `next-auth` (5.0.0-beta.32) & `@auth/drizzle-adapter` (1.11.3) & `bcryptjs` (3.0.3) - Authentication engine with credentials and OAuth providers, JWT session strategy
- `@aws-sdk/client-s3` (3.1095.0) & `@aws-sdk/s3-request-presigner` (3.1095.0) - S3-compatible object storage SDK (used with Cloudflare R2 or AWS S3) for client asset management
- `svix` (2.5.0) - Enterprise webhook sending, signing, and event dispatch engine
- `zod` (3.25.76) & `@hookform/resolvers` (5.4.0) - Schema validation for tRPC inputs, environment variables, and forms
- `react-hook-form` (7.82.0) - High-performance form state management

**UI & Component Ecosystem:**
- `shadcn` (4.14.1) & Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-avatar`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`) - Accessible UI foundation
- `lucide-react` (1.26.0) - Icon system across all pages and navigation
- `@hello-pangea/dnd` (18.0.1) - Drag-and-drop Kanban boards for sales pipeline deals
- `@tiptap/react` & `@tiptap/starter-kit` (3.29.0) - Headless rich text editor for invoices, quotes, and client notes
- `recharts` (3.10.0) - Charts for revenue forecasting and CRM analytics
- `sonner` (2.0.7) - Toast notification system
- `zustand` (5.0.14) - Client-side state store for dashboard filters and UI state

## Configuration

**Environment:**
- Validated via `@t3-oss/env-nextjs` in `src/env.js`
- Required variables: `DATABASE_URL`, `AUTH_SECRET`, `NODE_ENV`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT_URL`, `SVIX_TOKEN`
- Optional variables: `S3_PUBLIC_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`

**Build & Tooling Configs:**
- `tsconfig.json` - Strict TypeScript settings, ESNext modules, bundler resolution, path aliases `~/*` and `@/*`
- `biome.jsonc` - Automated import organization, sorted classes, and strict linting rules
- `drizzle.config.ts` - Database schema target `./src/server/db/schema.ts` targeting PostgreSQL dialect
- `next.config.js` - Next.js compiler and bundle settings

## Platform Requirements

**Development:**
- Node.js 20+
- PostgreSQL 15+ database instance (accessible via `DATABASE_URL`)
- S3-compatible bucket (Cloudflare R2 or AWS S3)
- Modern browser with ES2022 support

**Production:**
- Vercel or Node.js server container
- Hosted PostgreSQL (Neon, Supabase, or AWS RDS)
- Object storage (Cloudflare R2)
- Svix account for webhook delivery
