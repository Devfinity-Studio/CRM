# Phase 59: Global Staff Administration & User Access Governance - Research

## Context & Existing Implementations
1. **User Schema**: `src/server/db/schema.ts` defines `users` with `id`, `name`, `email`, `systemRole`, etc.
   - It currently lacks an `isActive` boolean flag to cleanly suspend compromised or departed users.
   - Adding `isActive: d.boolean().default(true).notNull()` to `users` matches how `organizations` has `isActive`.
2. **Authentication Flow**:
   - NextAuth is configured in `src/server/auth.ts`.
   - In `CredentialsProvider`, checking `existingUser.isActive === false` rejects authentication immediately.
3. **Sessions**:
   - NextAuth sessions table `sessions` uses `userId` foreign key referencing `users.id`.
   - Deleting `sessions` matching `userId` terminates active sessions immediately.
4. **Password Hashing**:
   - `bcryptjs` is already used in `src/server/auth.ts` (`import compare from "bcryptjs"`). We can use `bcrypt.hash(password, 10)` for administrative password resets and staff provisioning.
5. **Audit Logging**:
   - `logSuperAdminAction` in `src/server/security/audit.ts` is ready to log actions such as `UPDATE_USER_ROLE`, `SUSPEND_USER`, `ACTIVATE_USER`, `RESET_USER_PASSWORD`, `REVOKE_USER_SESSIONS`, and `CREATE_STAFF_USER`.
6. **Guardrails**:
   - Super admins must NOT be able to demote themselves (`userId === ctx.session.user.id`).
   - Super admins must NOT be able to suspend their own account (`userId === ctx.session.user.id`).
   - `passwordHash` must be completely omitted from all output models and responses.

