# Phase 43: CRM Client Profiles 2-Column Overhaul - Plan

## Executive Summary
Phase 43 re-architects the CRM Client Profile page (`src/app/clients/[id]/page.tsx`) into the Stitch MCP 2-column layout (Primary Client Details & Deal History on Left, Interactive Activity Timeline on Right), adding deal history widgets and polished contact lead score / qualification badges.

---

## Technical Context
- **Frameworks**: Next.js App Router (React 19), Tailwind CSS v4, tRPC v11, Drizzle ORM.
- **Design Tokens**: DevCRM Premium Indigo theme (`.glass-panel`, `.glass-card-interactive`, `backdrop-blur-md`, `border-border/70`).

---

## Task Breakdown

### Task 1: Backend Router Extensions & Unit Testing
**Files:**
- `src/server/api/routers/deals.ts`
- `src/server/api/__tests__/deals.test.ts`

**Action:**
1. Add `dealsRouter.getDealsByCompanyId` procedure accepting `{ companyId: z.string() }` returning deals joined with `pipelineStages` and `pipelines`.
2. Add unit test in `src/server/api/__tests__/deals.test.ts` verifying `getDealsByCompanyId` returns properly shaped deals scoped to the organization.

**Verification:**
- Run `pnpm vitest run src/server/api/__tests__/deals.test.ts`.

---

### Task 2: Modernized Interactive Activity Timeline
**Files:**
- `src/components/crm/activity-timeline.tsx`

**Action:**
1. Upgrade `ActivityTimeline` with:
   - Modern segmented type buttons (`Note`, `Call`, `Email`, `Meeting`) with glowing accent indicators.
   - Inline quick logger with auto-expanding input and submit action.
   - Chronological feed with color-coded circular icon nodes (Phone: Blue, Email: Indigo, Meeting: Emerald, Note: Amber/Slate).
   - Relative timestamps via `formatDistanceToNow`.

**Verification:**
- Run `pnpm biome check src/components/crm/activity-timeline.tsx`.

---

### Task 3: In-Context Quick Add POC Dialog
**Files:**
- `src/components/clients/add-poc-dialog.tsx`

**Action:**
1. Create `AddPocDialog` component using Radix `Dialog` primitive.
2. Accepts `companyId` and `open`/`onOpenChange`.
3. Inputs: Salutation, First Name, Last Name, Email, Phone.
4. Calls `api.crm.createContact.useMutation` and invalidates `crm.getPOCsByCompanyId`.

**Verification:**
- Run `pnpm biome check src/components/clients/add-poc-dialog.tsx`.

---

### Task 4: Client Profile 2-Column Stitch Layout
**Files:**
- `src/app/clients/[id]/page.tsx`

**Action:**
1. Re-architect page into the Stitch 2-column responsive layout:
   - Header: Large company avatar / initials, company name, client type badge, alias, UID, and "+ New Deal" / "+ Add POC" buttons.
   - Financial Performance Metric Strip: Total Won Value, Open Pipeline Value, Deal Count.
   - Left Column (lg:col-span-7 or 8):
     - Company & Tax Details Card (GSTIN, Business PAN, Email, Phone, Address).
     - Points of Contact (POCs) Card: Contact list with avatars, Lead Scores, and SQL/MQL qualification badges.
     - Deal History Section: Open and won/lost deals list with stage pills, values, and status.
   - Right Column (lg:col-span-5 or 4):
     - Sticky `ActivityTimeline` widget with quick logger.
   - Secondary Tab: Retain `Ledger & Statements` tab for full ledger view.

**Verification:**
- Run `pnpm biome check src/app/clients/[id]/page.tsx`.

---

## Verification & Completion Gate
1. `pnpm biome check src/app/clients/[id]/page.tsx src/components/crm/activity-timeline.tsx src/components/clients/add-poc-dialog.tsx src/server/api/routers/deals.ts src/server/api/__tests__/deals.test.ts`
2. `pnpm vitest run src/server/api/__tests__/deals.test.ts`
3. `pnpm vitest run`
4. Git commit and status report.

