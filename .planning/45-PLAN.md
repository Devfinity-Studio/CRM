# Phase 45: Database Branch Sync & Neon Object Storage Migration - Plan

## Goal
Synchronize local working directory and git branches (`dev` and `prod`), ensure both `dev` and `production` database branches in Neon have all schema migrations applied, replace Cloudflare R2 with Neon Object Storage (`uploads` bucket via Files SDK), and prove functionality with live upload, listing, and read-back tests.

## Context
- Project: DevCRM
- Milestone: 15 (Production Sync & Neon Object Storage Migration)
- Neon Project ID: `royal-field-53532962`
- Target Branch for Object Storage: `production`
- Bucket Name: `uploads`
- Files SDK Adapter: `files-sdk/neon` or AWS S3 SDK with `forcePathStyle: true`

## Tasks

### Task 1: Working Tree Commit & Git Sync
- Stage modified files and commit clean codebase formatting changes: `chore: format and sync repository files`.
- Push `dev` branch to `origin/dev`.
- Switch/merge or fast-forward `prod` branch to include all recent Milestone 13 & 14 deliverables.
- Push `prod` branch to `origin/prod`.

### Task 2: Neon Database Schema Parity (Dev & Production)
- Inspect connection strings in `.env` and Neon branches for project `royal-field-53532962`.
- Run Drizzle migrations (`pnpm drizzle-kit push` or `pnpm drizzle-kit migrate`) against `dev` branch.
- Run migrations against `production` branch to ensure all tables (invoices, quotes, contacts, deals, automations, etc.) are 100% identical.

### Task 3: Neon CLI & Project Initialization
- Check if `neon` is installed: `neon --version` or install via `npm install -g neon@latest` / `npx neon@latest`.
- Authenticate if needed (`neon login`).
- Run `neon init -y --project-id royal-field-53532962 --branch production --services postgres,object-storage`.

### Task 4: Neon Object Storage Provisioning
- Run `neon config add bucket uploads`.
- Run `neon deploy` to create the bucket and pull environment variables into `.env`.
- Verify bucket exists and environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ENDPOINT_URL_S3` / bucket config) are present.

### Task 5: R2 Decommission & Neon Files SDK Integration
- Install `files-sdk` and `@aws-sdk/s3-presigned-post` (alongside existing `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`).
- Remove Cloudflare R2 specific environment variables and references.
- Create/update storage utility (`src/lib/storage.ts` or `src/server/storage.ts`) using the Neon Files SDK adapter.
- Update `src/server/api/routers/uploads.ts` and `src/hooks/use-s3-upload.ts` to utilize the new storage configuration.
- Execute real file upload test:
  1. Upload small text file (`test-neon-storage.txt`) to the bucket.
  2. List the bucket contents to verify presence.
  3. Read the file back and show its contents.
  4. Ensure no secrets (API keys, tokens) are exposed.

## Verification
- `git status` shows clean branches, both `dev` and `prod` synced with remote.
- Database schemas on both `dev` and `production` branches confirmed up to date.
- Neon `uploads` bucket created and active.
- End-to-end file upload test succeeds with verified content read-back.
- App passes `pnpm vitest run` and `pnpm biome check`.

