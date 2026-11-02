# Phase 47: Test Expansion, Neon Dev/Prod Environment Segregation, & Staged Vercel Deployment - Context

## Objective
1. Expand Vitest unit/integration testing suite across critical CRM, billing, uploads, and storage workflows to increase coverage and catch regressions early.
2. Synchronize and verify all Drizzle schema migrations against both Neon database branches: `Dev` (`br-jolly-bird-az9jq7gz`) and `production` (`br-little-scene-az7iw7fk`).
3. Set up Vercel environment variable segregation:
   - Preview environment: Neon `Dev` branch connection string (`ep-bitter-darkness-azznf1fc-pooler` on `Dev` branch).
   - Production environment: Neon `production` branch connection string (`ep-bitter-darkness-azznf1fc-pooler` on `production` branch).
   - Ensure Neon Object Storage and NextAuth credentials are valid across both environments.
4. Execute staged pipeline:
   - Push to `origin/dev`, monitor Vercel preview deployment, test preview URL.
   - Fast-forward merge to `origin/prod`, trigger production deployment, test production URL (`https://devfinity-crm.vercel.app`).

