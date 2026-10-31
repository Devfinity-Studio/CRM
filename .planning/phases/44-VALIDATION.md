# Phase 44: Billing & Financial Views Polish - Validation

## Quality Gates & Verification Matrix

### 1. Automated Verification Checks
| Scope | Command | Acceptance Threshold |
| :--- | :--- | :--- |
| **Linting & Formatting** | `pnpm biome check src/app/billing/invoices/page.tsx src/app/billing/quotes/page.tsx src/app/billing/statements/page.tsx src/components/billing/ledger-view.tsx src/components/public/document-viewer.tsx` | 0 errors, 0 warnings |
| **Full Regression Suite** | `pnpm vitest run` | All 12 tests passing across all suites |

### 2. Manual & Functional Checks
- **Navigation Shell**: Invoices, Quotes, and Statements pages render inside `DashboardLayout` with collapsible rail and top header.
- **Financial Scorecards (REQ-44-01)**: Top KPI metrics (Total Invoiced, Collected, Balance Due, Overdue Count) calculate and display accurately with formatted currency.
- **Status Badges & Filtering**: Filter pills (All, Paid, Sent, Overdue, Draft) filter rows seamlessly; status badges render with glowing accents and color dots.
- **Party Ledger Harmonization (REQ-44-02)**: `LedgerView` displays clean date range controls, balance summaries, and color-coded transaction debit/credit amounts.
- **Public Document Viewer (REQ-44-03)**: Document viewer loads without authentication, displays clean branding, and triggers print styling accurately.
