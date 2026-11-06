# Milestone 19: Super Admin Platform Engine: Feature Management, Integrations Hub & System Governance - Requirements

## 1. Goal
Deliver an enterprise-grade Super Admin command center for DevCRM. Enable platform administrators to dynamically manage feature flags and modules globally and per-tenant, monitor and diagnose critical third-party integrations (Dodo Payments, Svix, Neon Storage, Email), deeply inspect tenant organizations with immutable security audit logs, and govern global staff and user access.

## 2. Requirements

### Phase 56: Dynamic Feature Flags & Cascading Module Toggles
- [ ] **REQ-56-01**: Define comprehensive feature flag schema (`inventory`, `invoicing`, `quotes`, `automations`, `aiInsights`, `customDomains`, `webhooks`, `apiKeys`) with default values in `globalSettings`.
- [ ] **REQ-56-02**: Implement hierarchical feature flag resolution engine (`getEffectiveFeatureFlags(orgId)`): Global defaults $\rightarrow$ Subscription Plan entitlements $\rightarrow$ Per-tenant custom overrides in `tenantOverrides`.
- [ ] **REQ-56-03**: Build the Super Admin Feature Flags management UI in `/superadmin/features` with interactive switch controls for global defaults and granular per-tenant toggles.
- [ ] **REQ-56-04**: Enforce feature flag guards across application layout navigation and backend tRPC routers, hiding disabled modules and preventing unauthorized API execution.
- [ ] **REQ-56-05**: Develop automated Vitest test suite validating cascading feature resolution and route guards.

### Phase 57: Global Integration Center & Third-Party Service Health Monitoring
- [x] **REQ-57-01**: Build `/superadmin/integrations` dashboard displaying real-time connectivity status, response latency, and operational health for Dodo Payments, Svix Webhooks, Neon Object Storage, and Email Service.
- [x] **REQ-57-02**: Implement diagnostic verification procedures (`testDodoConnection`, `testSvixConnection`, `testStorageConnection`, `testEmailConnection`) validating API keys, endpoints, and bucket permissions.
- [x] **REQ-57-03**: Provide operational management actions for Dodo Payments (live subscription inspection, manual sync triggers) and Svix (application directory, test message dispatch, failed delivery queue review).
- [x] **REQ-57-04**: Monitor platform-wide storage consumption (total files uploaded, bucket capacity, active presigned URLs) across tenants.
- [x] **REQ-57-05**: Vitest tests covering diagnostic endpoints, failure handling, and health check procedures.

### Phase 58: Tenant Deep Inspection & Superadmin Activity Audit Trail
- [x] **REQ-58-01**: Create `devcrm_system_audit_log` database table storing immutable records: `actorId`, `actorEmail`, `action` (`IMPERSONATE_ORG`, `TOGGLE_FEATURE`, `UPDATE_PLAN`, `OVERRIDE_QUOTA`, `SUSPEND_TENANT`, `RESET_PASSWORD`), `targetType`, `targetId`, `metadata`, `ipAddress`, `createdAt`.
- [x] **REQ-58-02**: Implement centralized `logSuperAdminAction` utility and wire into all mutating superadmin procedures.
- [x] **REQ-58-03**: Create Tenant Deep Inspector page at `/superadmin/tenants/[id]` displaying member roster with roles, historical deal revenue, invoice stats, storage usage, and recent tenant logs.
- [x] **REQ-58-04**: Build the Audit Logs viewer in `/superadmin/audit` with filterable action timeline, actor badges, date range filter, and formatted JSON metadata modal.
- [x] **REQ-58-05**: Vitest tests for audit log creation, pagination, and tenant inspector aggregations.

### Phase 59: Global Staff Administration & User Access Governance
- [ ] **REQ-59-01**: Expand `/superadmin/users` with full global user governance: search and filter across all organizations, role elevation (`SUPER_ADMIN` vs `USER`), and account suspension toggle (`isActive`).
- [ ] **REQ-59-02**: Implement administrative password reset and secure staff onboarding flow.
- [ ] **REQ-59-03**: Implement session revocation procedure (`revokeUserSessions`) immediately terminating active sessions for suspended or compromised accounts.
- [ ] **REQ-59-04**: Update `/superadmin` navigation sidebar with dedicated links for Overview, Tenants, Plans, Features, Integrations, Audit Logs, and Global Users.
- [ ] **REQ-59-05**: Comprehensive verification: 100% Vitest test pass rate and clean Next.js production build (`pnpm build`) covering all static and dynamic routes.
