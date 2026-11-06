# Phase 59: Global Staff Administration & User Access Governance - Context

**Milestone:** 19 (Super Admin Platform Engine: Feature Management, Integrations Hub & System Governance)
**Dependencies:** Phase 58 (Tenant Deep Inspection & Superadmin Activity Audit Trail)

## Purpose & Scope
This is the final phase of Milestone 19. It completes the platform administration capability by establishing full global user and staff access governance:
1. **Global User Directory & Search**: Searching across all tenants, filtering by role (`SUPER_ADMIN` vs `USER`) and status (`ACTIVE` vs `SUSPENDED`).
2. **Staff Role Elevation & Demotion**: Allowing Super Admins to elevate trusted operators to `SUPER_ADMIN` or demote staff, with self-demotion protection and immutable audit logs.
3. **Account Suspension & Session Termination**: Instant account deactivation (`isActive: false`) and termination of active authentication sessions (`revokeUserSessions`) for suspended or compromised users.
4. **Administrative Password Reset**: Forcing password reset with secure `bcrypt` hashing.
5. **Staff Onboarding**: Direct platform staff provisioning flow.
6. **Navigation & Final Polish**: Unified Super Admin header navigation (Overview, Tenants, Plans, Features, Integrations, Audit Trail, Global Users, Settings) and comprehensive production build verification.

## Target Deliverables
- Update `users` schema with `isActive: d.boolean().default(true).notNull()` in `src/server/db/schema.ts`
- Account suspension enforcement in `src/server/auth.ts`
- Super Admin router procedures in `src/server/api/routers/superadmin.ts`:
  - `getGlobalUsers`
  - `updateUserSystemRole`
  - `toggleUserActiveStatus`
  - `adminResetUserPassword`
  - `revokeUserSessions`
  - `createStaffUser`
- Centralized staff management UI at `src/app/superadmin/users/page.tsx`
- Complete Super Admin header navigation in `src/app/superadmin/layout.tsx`
- Vitest unit test suite in `src/server/api/__tests__/superadmin-users.test.ts`

