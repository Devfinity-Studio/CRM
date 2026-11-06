# Phase 58: Tenant Deep Inspection & Superadmin Activity Audit Trail - Context

**Milestone:** 19 (Super Admin Platform Engine: Feature Management, Integrations Hub & System Governance)
**Dependencies:** Phase 57 (Global Integration Center & Third-Party Service Health Monitoring)

## Purpose & Scope
Enterprise multi-tenant platforms require strict accountability and deep tenant visibility:
1. **Immutable Audit Trail**: Recording every privileged operation conducted by platform administrators (tenant impersonation, feature flag changes, plan assignments, quota overrides, settings modifications).
2. **Tenant Deep Inspector**: A 360° platform administrative view of any tenant organization (`/superadmin/tenants/[id]`) covering member rosters, financial history, deal pipelines, subscription tiers, quota utilization, and tenant-specific audit events.
3. **Audit Log Explorer**: A centralized log viewer (`/superadmin/audit`) allowing security officers to filter, search, inspect raw JSON metadata, and reconstruct operational history.

## Target Deliverables
- `systemAuditLogs` table in `src/server/db/schema.ts`
- `src/server/security/audit.ts`: Centralized audit logging utility (`logSuperAdminAction`)
- Audit wiring across mutating procedures in `src/server/api/routers/superadmin.ts`
- Superadmin query procedures: `getAuditLogs`, `getTenantDeepInspection`
- `src/app/superadmin/tenants/[id]/page.tsx`: Tenant Deep Inspector dashboard
- `src/app/superadmin/audit/page.tsx`: Centralized Audit Trail viewer
- `src/app/superadmin/layout.tsx`: Updated navigation with Audit link
- Vitest automated tests in `src/server/security/__tests__/audit.test.ts`

