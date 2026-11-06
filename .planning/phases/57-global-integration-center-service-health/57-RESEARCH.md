# Phase 57: Global Integration Center & Third-Party Service Health Monitoring - Research

## Architectural Assessment

### 1. Dodo Payments Health & Diagnostics
- **Endpoints / Verification**:
  - Dodo API uses standard REST endpoints under `https://test.dodopayments.com` (test mode) or `https://live.dodopayments.com` (live mode).
  - Diagnostic check: Query products or subscriptions list (limit 1) with `DODO_PAYMENTS_API_KEY`.
  - Check measures: latency (ms), HTTP status (200 OK vs 401 Unauthorized), environment configuration (`test_mode` vs `live_mode`), webhook secret status.
  - Fail-safe: If API key is unconfigured or returns 401, return `{ status: "ERROR" | "NOT_CONFIGURED", message, latencyMs }`.

### 2. Svix Webhooks Health & Diagnostics
- **Client**: `svix` package already in dependencies (`import { svix } from "~/lib/svix"`).
- **Diagnostics**:
  - Call `svix.application.list({ limit: 1 })` to verify token validity.
  - Latency measure: time taken for `application.list`.
  - Triage actions:
    - List recent Svix registered tenant applications.
    - Dispatch a test ping event (`ping.test`) to verify outbound pipeline health.

### 3. Neon Object Storage (S3-compatible) Health & Diagnostics
- **Client**: `@aws-sdk/client-s3` (`HeadBucketCommand` or `ListObjectsV2Command` with MaxKeys: 1).
- **Credentials & Config**:
  - Region: `env.S3_REGION`
  - Endpoint: `env.S3_ENDPOINT_URL`
  - Bucket: `env.S3_BUCKET_NAME`
  - Access key & secret key.
- **Metrics**:
  - Connectivity & latency via `HeadBucketCommand`.
  - Platform-wide file count: Count files stored under tenant prefixes or calculate from attachments/metadata.

### 4. Email Service Diagnostics
- **Verification**: Check SMTP / Resend / Transac provider configuration.
- **Simulation / Test Mode**: If `RESEND_API_KEY` or `SMTP_HOST` is configured, test credential reachability; if not configured, mark status as `MOCK_ACTIVE` or `UNCONFIGURED` with helpful setup guidelines.

### 5. UI Architecture
- Super Admin Integration Hub at `/superadmin/integrations`:
  - 4 major integration health cards with status indicators (Green/Amber/Red), latency in milliseconds, credential status, and "Run Diagnostic" buttons.
  - Platform Storage Utilization card: Neon Storage bucket capacity, estimated objects, and quick presigned URL test.
  - Svix Webhook Management tab: Active tenant Svix apps, recent delivery status, and "Send Test Webhook" trigger.
  - Dodo Payments Sync tab: Active subscription inspection and webhook key validation.

