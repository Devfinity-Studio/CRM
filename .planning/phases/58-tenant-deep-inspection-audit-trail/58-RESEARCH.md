# Phase 58: Tenant Deep Inspection & Superadmin Activity Audit Trail - Research

## Architectural Assessment

### 1. System Audit Log Table Design
- **Table Name**: `devcrm_system_audit_log`
- **Fields**:
  - `id`: `varchar(255)` primary key, UUID
  - `actorId`: `varchar(255)` not null, references `users.id`
  - `actorEmail`: `varchar(255)` not null
  - `action`: `varchar(100)` not null (e.g. `IMPERSONATE_ORG`, `TOGGLE_GLOBAL_FEATURE`, `SET_TENANT_FEATURE_OVERRIDE`, `RESET_TENANT_FEATURE_OVERRIDES`, `CREATE_PLAN`, `UPDATE_PLAN`, `ASSIGN_TENANT_PLAN`, `UPDATE_TENANT_QUOTAS`, `UPDATE_GLOBAL_SETTINGS`, `DISPATCH_TEST_WEBHOOK`, `SUSPEND_TENANT`, `ACTIVATE_TENANT`)
  - `targetType`: `varchar(50)` (e.g. `ORGANIZATION`, `PLAN`, `GLOBAL_SETTING`, `WEBHOOK`, `USER`)
  - `targetId`: `varchar(255)`
  - `metadata`: `jsonb` or `text` (stores before/after snapshot, parameters, diffs)
  - `ipAddress`: `varchar(100)`
  - `userAgent`: `text`
  - `createdAt`: `timestamp with time zone` default `now()`
- **Indexes**:
  - `actorId`
  - `action`
  - `targetId`
  - `createdAt`

### 2. Centralized Logger Utility (`src/server/security/audit.ts`)
```ts
export async function logSuperAdminAction(
  db: any,
  params: {
    actorId: string;
    actorEmail: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }
)
```
- Non-blocking execution / failure containment: Audit logging should never crash the primary operation if logging fails, but in production it should log errors to console/monitoring.

### 3. Tenant Deep Inspection Aggregation
- In `superadmin.getTenantDeepInspection`:
  - Organization metadata (id, name, slug, logoUrl, isActive, createdAt)
  - Member roster: `organizationMembers` joined with `users` (id, name, email, role, joinedAt)
  - Commercial metrics:
    - Deals: total count, won count, won value sum, pipeline value sum
    - Invoices: total count, paid count, total billed sum, total paid sum, overdue count
  - Plan & Entitlements: active subscription, assigned plan, effective feature flags, custom overrides
  - Audit Trail: recent audit logs targeting this tenant (`targetId === orgId`)

### 4. UI Design Tokens & UX
- `/superadmin/tenants/[id]`:
  - Quick action toolbar: "Impersonate Organization", "Manage Plan & Features", "Toggle Active Status"
  - Summary cards: Total Revenue, Pipeline Value, Active Members, Subscription Tier
  - Tabs: Members Roster, Financial Summary, Feature Entitlements, Audit History
- `/superadmin/audit`:
  - Action filter dropdown (`All Actions`, `IMPERSONATE_ORG`, `TOGGLE_FEATURE`, etc.)
  - Actor search filter
  - Timeline table with action badges, actor email, target ID, date, and expandable JSON metadata modal

