# Phase 43: CRM Client Profiles 2-Column Overhaul - Research

**Date:** 2026-10-31
**Phase:** 43 (Milestone 14)
**Status:** Complete

## Technical Analysis

### 1. Backend Data Models & Endpoints
- **Deals by Client Query**:
  - `dealsRouter` requires a `getDealsByCompanyId` procedure accepting `{ companyId: z.string() }`.
  - Joins `pipelineStages` and `pipelines` to return stage name, stage color, and pipeline name alongside deal metrics.
  - Scoped to `organizationId: ctx.session.user.organizationId` for strict multi-tenant isolation.
- **Client & POC Queries**:
  - `crmRouter.getCompanyById` returns the primary company entity.
  - `crmRouter.getPOCsByCompanyId` returns associated contacts with `leadScore` and `qualificationStatus`.
  - `crmRouter.createContact` creates new contacts with `companyId` linking.

### 2. Frontend Layout & Stitch 2-Column Structure
- **Left / Primary Column (~60-65% width)**:
  - **Company Profile Header**: Company initials/logo avatar, client name, alias, UID badge, industry, country.
  - **Financial Metrics Strip**: Lifetime won deal value, active pipeline value, deal count.
  - **Company & Tax Card**: Grid of tax treatment, GSTIN, business PAN, phone, email, and address.
  - **Points of Contact (POCs)**:
    - Contact cards with avatar, salutation, full name, email, phone, UID.
    - Theme-consistent Lead Score badge (`bg-amber-500/10 text-amber-500 border-amber-500/20`).
    - Qualification Status pill (SQL in primary, MQL in secondary, Unqualified in muted).
    - Quick "+ Add POC" button triggering `AddPocDialog`.
  - **Deal History Section**:
    - Deal cards showing title, value ($ in emerald), stage badge with stage color, expected close date, and status.
    - "+ New Deal" button opening `DealDialog` pre-filled with companyId.
- **Right / Activity Timeline Column (~35-40% width)**:
  - Sticky container on desktop (`sticky top-6`).
  - Quick-add activity bar with segmented type pills (`Note`, `Call`, `Email`, `Meeting`).
  - Chronological activity feed with color-coded circular icon nodes and relative timestamps (`formatDistanceToNow`).

### 3. Verification Plan
- Unit tests in `src/server/api/__tests__/deals.test.ts` testing `getDealsByCompanyId`.
- Biome linting and formatting check (`pnpm biome check`).
- Full Vitest suite execution (`pnpm vitest run`).
