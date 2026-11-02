# Phase 54: Gateway SDK Setup, Secure Webhooks & Automated Quota Sync - Context

## 1. Intent & Architecture
Phase 54 implements the foundation of Platform SaaS Billing for DevCRM using Dodo Payments (Merchant of Record).
When a tenant subscribes to a paid plan on DevCRM (`Starter`, `Pro`, `Enterprise`), Dodo Payments manages the checkout and subscription lifecycle. Dodo emits Standard Webhooks to notify our backend of subscription state changes.
Our webhook route (`/api/webhooks/dodo`) cryptographically verifies incoming requests, parses subscription payloads, updates the tenant's organization plan and quota limits in real time, and logs audit events.

## 2. Technical Contracts & Standards
- **SDK**: `dodopayments`
- **Webhook Standard**: Standard Webhooks specification (`webhook-id`, `webhook-signature`, `webhook-timestamp` headers, HMAC-SHA256 signature over `<id>.<timestamp>.<body-bytes>`).
- **Idempotency**: Cache and verify `webhook-id` to prevent replay attacks and duplicate processing.
- **Quota Synchronization**:
  - `organizations.maxContacts = plan.maxContacts`
  - `organizations.maxInvoices = plan.maxInvoices`
  - `organizations.maxAutomationsMonthly = plan.maxAutomationsMonthly`
  - `organizations.maxTeamSeats = plan.maxTeamSeats`
  - `organizations.maxStorageMb = plan.maxStorageMb`
  - `organizations.status = 'ACTIVE'`
- **Testing**: Vitest suite with mocked signatures and state transition assertions.

