---
phase: 41
slug: dashboard-shell-navigation
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-10-31
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.1 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run src/server/api/__tests__/dashboard.test.ts` |
| **Full suite command** | `pnpm vitest run && pnpm typecheck && pnpm check` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm typecheck`
- **After backend router enhancements:** Run `pnpm vitest run src/server/api/__tests__/dashboard.test.ts`
- **After every plan wave:** Run `pnpm vitest run && pnpm typecheck && pnpm check`
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|---|
| 41-01-01 | 01 | 1 | REQ-41-03 | unit | `pnpm vitest run src/server/api/__tests__/dashboard.test.ts` | ❌ W0 | ⬜ pending |
| 41-01-02 | 01 | 1 | REQ-41-01 | static | `pnpm typecheck && pnpm check` | ✅ | ⬜ pending |
| 41-01-03 | 01 | 2 | REQ-41-02 | static | `pnpm typecheck && pnpm check` | ✅ | ⬜ pending |
| 41-01-04 | 01 | 2 | REQ-41-04 | static | `pnpm typecheck && pnpm check` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

- [ ] `src/server/api/__tests__/dashboard.test.ts` — Stubs and unit tests for `dashboardRouter.getMetrics` period calculations and trends.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| Sidebar rail collapse | REQ-41-01 | Visual / UI state | Click sidebar toggle icon; verify width changes between 240px and 64px, and icon tooltips display on hover. |
| Organization switcher | REQ-41-01 | UI dropdown | Click org switcher in sidebar header; verify dropdown opens with active tenant and switches properly. |
| DealSheet slide-out | REQ-41-04 | Interactive drawer | Click a recent deal row on `/dashboard`; verify `DealSheet` opens on the right side without navigating away. |
| Period filter pills | REQ-41-03 | React Query refetch | Click `This Month`, `This Quarter`, etc.; verify card metrics recalculate. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-31
