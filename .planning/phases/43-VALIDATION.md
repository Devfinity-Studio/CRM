# Phase 43: CRM Client Profiles 2-Column Overhaul - Validation

## Quality Gates & Verification Matrix

### 1. Automated Verification Checks
| Scope | Command | Acceptance Threshold |
| :--- | :--- | :--- |
| **Linting & Formatting** | `pnpm biome check src/app/clients/[id]/page.tsx src/components/crm/activity-timeline.tsx src/components/clients/add-poc-dialog.tsx src/server/api/routers/deals.ts src/server/api/__tests__/deals.test.ts` | 0 errors, 0 warnings |
| **Unit Testing (Deals)** | `pnpm vitest run src/server/api/__tests__/deals.test.ts` | All tests passing |
| **Full Regression Suite** | `pnpm vitest run` | All tests passing across all suites |

### 2. Manual & Functional Checks
- **2-Column Layout Integrity**: Desktop view displays client properties, POCs, and deal history in primary left column, with sticky activity timeline in right column.
- **Deal History (REQ-43-03)**: Renders all deals associated with the client with stage indicators and amounts.
- **Contact Lead Scores & Badges (REQ-43-04)**: Renders lead scores with flame/sparkle icon and SQL/MQL qualification pills using theme tokens.
- **Activity Timeline (REQ-43-02)**: Type switcher pills (Note, Call, Email, Meeting) function smoothly and post to the timeline feed.
- **POC Modal**: In-context `AddPocDialog` creates contacts linked directly to the client company.

