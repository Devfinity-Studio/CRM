---
last_mapped_commit: 497081eeb4e2796116b07a5c35f52fbb96d9e957
---

# Testing Patterns

**Analysis Date:** 2026-10-31

## Test Framework

**Runner:**
- Vitest 5.0.1 (`vitest`)
- Config: `vitest.config.ts` in project root using Node environment (`environment: "node"`)
- Path Resolution: `vite-tsconfig-paths` (v6.1.1) to resolve `~/` and `@/` path aliases defined in `tsconfig.json`

**Assertion Library:**
- Vitest built-in assertions (`expect`, `describe`, `it`, `vi`) compatible with Jest syntax

**Run Commands:**
```bash
# Run all test suites
pnpm vitest run

# Run in watch mode during development
pnpm vitest

# Run a specific test file
pnpm vitest run src/server/api/__tests__/trpc.test.ts
pnpm vitest run src/server/webhooks/__tests__/dispatch.test.ts

# Type checking without test execution
pnpm typecheck
```

## Test File Organization

**Location:**
- Unit and integration tests are organized alongside their corresponding modules under `__tests__/` subdirectories:
  - `src/server/api/__tests__/trpc.test.ts`
  - `src/server/webhooks/__tests__/dispatch.test.ts`

**Naming Convention:**
- Test files follow `*.test.ts` or `*.test.tsx` naming conventions.

**Structure:**
```
src/
  server/
    api/
      __tests__/
        trpc.test.ts       # tRPC context creation and API key authentication tests
      trpc.ts
    webhooks/
      __tests__/
        dispatch.test.ts   # Webhook delivery and Svix error resilience tests
      dispatch.ts
```

## Test Patterns & Mocking Strategy

**Mocking External Dependencies:**
- Tests mock external dependencies and database clients using `vi.mock()` to ensure fast, deterministic offline execution.
- Examples:
  - `vi.mock("~/lib/svix")` to mock the Svix messaging SDK (`svix.message.create`)
  - `vi.mock("~/server/auth")` to stub NextAuth session responses
  - `vi.mock("~/server/db")` to stub Drizzle ORM query responses (`db.query.organizations.findFirst`, `db.query.apiKeys.findFirst`)

**Example Test Suite (`dispatch.test.ts`):**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchWebhook } from "../dispatch";
import { svix } from "~/lib/svix";
import { db } from "~/server/db";

vi.mock("~/lib/svix", () => ({
  svix: { message: { create: vi.fn() } },
}));

vi.mock("~/server/db", () => ({
  db: { query: { organizations: { findFirst: vi.fn() } } },
}));

describe("Webhooks Dispatch Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not dispatch if the organization does not have a svixAppId", async () => {
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: "org-1",
      svixAppId: null,
    });
    await dispatchWebhook("org-1", "test.event", { data: 123 });
    expect(svix.message.create).not.toHaveBeenCalled();
  });
});
```

## Quality Assurance & Static Analysis

- **Static Type Checking:** Enforced via `tsc --noEmit` (`pnpm typecheck`).
- **Linting & Formatting:** Enforced via Biome (`pnpm check`).
- **Continuous Integration / Verification Checklist:**
  1. `pnpm check` passes with 0 errors.
  2. `pnpm typecheck` passes with 0 errors.
  3. `pnpm vitest run` passes all test suites.
