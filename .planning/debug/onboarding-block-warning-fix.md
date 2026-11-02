---
status: verifying
trigger: "the fix the feature bloxked due to onboarding as a warning in red on the top instead of blocing the whole dashboard. the warnign will cover the whole page only when the user accesses any page other than dashboard or profile. also check that if the page is blocked dont show the tutorial. and display it after the user returns after a successful onboarding."
created: 2026-11-02T13:07:00Z
updated: 2026-11-02T13:12:00Z
---

## Current Focus

hypothesis: In DashboardLayout, isOnboardingIncomplete applies a global modal overlay and pointer-events-none opacity-20 to all routes unconditionally, including /dashboard and /settings/profile. Additionally, useTour auto-starts without verifying onboarding completion, causing Driver.js to trigger on blocked pages and prematurely setting localStorage before the user has completed onboarding.
test: Check all route conditions, WelcomeModal conditional triggers, useTour onboarding checks, Vitest test suite, and Next.js build.
expecting: /dashboard and /settings/profile show red top warning banner while remaining fully interactive; other routes show full-page modal blocker with Back to Dashboard button; tutorial tour and welcome modal never fire when un-onboarded; tour fires cleanly upon return after onboarding completion.
next_action: Update git commits and push to dev / preview verification.
reasoning_checkpoint:
  hypothesis: Onboarding layout gating was global rather than route-specific, and tutorial popups were firing regardless of onboarding status.
  confirming_evidence: dashboard-layout.tsx rendered modal unconditionally when isOnboardingIncomplete was true; useTour ran unconditionally without querying onboardingComplete.
  falsification_test: Run vitest (23/23 passing) and next build (45/45 static/dynamic pages compiled cleanly).
  fix_rationale: Conditionally split layout behavior based on isAllowedUnonboardedRoute (/dashboard and /settings/profile), pass enabled guard to useTour, and only open WelcomeModal after onboardingComplete is true.
  blind_spots: Mobile bottom tabs navigation allows return to dashboard from blocked routes.
tdd_checkpoint: null

## Symptoms

expected: When onboarding is incomplete:
  1. /dashboard and /settings/profile should display a prominent red warning banner at the top instead of blocking the entire view.
  2. Any other page (e.g., /deals, /clients, /billing, /inventory, /automations, etc.) should have the warning cover the entire page blocking feature access.
  3. If the page is blocked or onboarding is incomplete, tutorials and tour popups must not be shown.
  4. The tutorial should only display when the user returns after a successful onboarding.
actual:
  1. DashboardLayout displayed a full-screen fixed modal overlay on all routes including /dashboard, making the entire dashboard inaccessible with pointer-events-none and opacity-20.
  2. Driver.js useTour started on a 600ms timer unconditionally on dashboard and 500ms on other pages, triggering while the page is blocked and storing tour_dashboard in localStorage prematurely.
  3. WelcomeModal opened whenever hasSeenWelcome was false even if onboarding was not completed.
errors: []
reproduction: Log in as a user with onboardingComplete=false; visit /dashboard; observe full-screen modal blocking dashboard and Driver.js tour firing in background.
started: Always configured with global unconditional blocker.

## Eliminated

## Evidence

- timestamp: 2026-11-02T13:07:00Z
  checked: src/components/layout/dashboard-layout.tsx:450-477
  found: isOnboardingIncomplete unconditionally renders fixed inset-0 z-50 modal and sets pointer-events-none opacity-20 on all children.
  implication: /dashboard and /settings/profile get completely blocked along with every other route.
- timestamp: 2026-11-02T13:07:00Z
  checked: src/app/dashboard/page.tsx:80-84 and src/hooks/use-tour.tsx
  found: startTour() is invoked in useEffect without checking onboardingComplete or modal state.
  implication: Tutorial tour fires even when onboarding is blocked, polluting localStorage.
- timestamp: 2026-11-02T13:07:00Z
  checked: src/app/dashboard/_components/WelcomeModal.tsx:22-26
  found: Modal checks status && !status.hasSeenWelcome but does not check status.onboardingComplete.
  implication: Welcome modal appears before the user has completed the onboarding flow.

## Resolution

root_cause: DashboardLayout lacked route-aware conditional branching for un-onboarded users, treating /dashboard and /settings/profile identically to restricted business sub-routes. Additionally, useTour and WelcomeModal lacked onboarding completion prerequisites.
fix:
  1. Updated src/components/layout/dashboard-layout.tsx with isAllowedUnonboardedRoute gating. On /dashboard and /settings/profile, renders a top-docked red warning banner (WCAG AAA compliant, min-h 44px CTA) while keeping children interactive. On all other routes, renders a full-page modal blocker with "Back to Dashboard" and "Complete Onboarding" actions.
  2. Updated src/hooks/use-tour.tsx to query api.onboarding.getStatus and enforce isTourEnabled. When onboarding is incomplete, startTour/forceStartTour return false and do not consume localStorage.
  3. Updated src/app/dashboard/_components/WelcomeModal.tsx to only display when status.onboardingComplete && !status.hasSeenWelcome, and forward an onStartTour callback upon closing.
  4. Updated src/app/dashboard/page.tsx to bind WelcomeModal's onStartTour with forceStartTour and suppress auto-starting while onboarding is incomplete or the welcome modal is pending.
  5. Updated src/app/dashboard/_components/SetupChecklist.tsx action links to correct routes (/settings/profile, /inventory/products, /clients).
  6. Added src/server/api/__tests__/onboarding.test.ts unit tests covering getStatus and markWelcomeSeen.
verification: Vitest passing 23/23 tests across 8 suites; Next.js 15.5.21 production build passing 45/45 static/dynamic routes.
files_changed:
  - src/components/layout/dashboard-layout.tsx
  - src/hooks/use-tour.tsx
  - src/app/dashboard/_components/WelcomeModal.tsx
  - src/app/dashboard/page.tsx
  - src/app/dashboard/_components/SetupChecklist.tsx
  - src/server/api/__tests__/onboarding.test.ts
