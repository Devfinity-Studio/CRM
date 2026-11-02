# Phase 53 Plan: Cross-Module Automation Event Bus, Svix Webhooks, Global Command Palette & Staged Release

## Step 1: Schema Evolution
- In `src/server/db/schema.ts`:
  - Expand `automationTriggerEnum` with `"DEAL_STAGE_CHANGED"`, `"DEAL_WON"`, `"INVOICE_CREATED"`, `"INVOICE_PAID"`, `"INVENTORY_LOW_STOCK"`, `"QUOTE_ACCEPTED"`.
  - Expand `automationActionEnum` with `"DISPATCH_WEBHOOK"`, `"ADJUST_INVENTORY"`.
  - In `automationRules`: add `conditions: d.jsonb()`.
  - In `automationLogs`: add `status: d.varchar({ length: 50 }).default("SUCCESS")`, `details: d.jsonb()`.

## Step 2: Internal Domain Event Bus & Multi-Condition Runner
- Create `src/server/events/event-bus.ts`:
  - Event payload definitions.
  - Multi-condition evaluation engine (`evaluateConditions`).
  - Action execution dispatcher (tasks, notifications, emails, webhooks, inventory).
  - Outbound Svix webhook integration.
  - Execution audit logging to `automationLogs`.

## Step 3: Global Cross-Module Search Procedure
- In `src/server/api/routers/dashboard.ts`:
  - Add `globalSearch` procedure querying deals, companies, contacts, invoices, quotes, and products with substring matching and categorized output.

## Step 4: Global Command Palette Component & Integration
- Create `src/components/layout/global-command-palette.tsx`:
  - `cmdk` `CommandDialog` listening for `Cmd+K` / `Ctrl+K`.
  - Live search debounced input calling `api.dashboard.globalSearch`.
  - Module shortcut commands (`/deals`, `/invoices`, `/clients`, `/settings`, etc.).
- In `src/components/layout/dashboard-layout.tsx`:
  - Mount `GlobalCommandPalette`.
  - Add clickable search bar in top sticky header displaying `⌘K` badge.

## Step 5: Test Suite Expansion & Biome Check
- Create `src/server/api/__tests__/event-bus.test.ts`.
- Create `src/server/api/__tests__/command-palette.test.ts`.
- Run `pnpm vitest run`.
- Run `@biomejs/biome` formatting/lint check.

## Step 6: Staged Production Verification & Final Milestone Review
- Run `pnpm build` (47/47 routes clean).
- Create `.planning/53-SUMMARY.md` and phase summaries.
- Update `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`.
- Commit and push to `origin/dev`.
