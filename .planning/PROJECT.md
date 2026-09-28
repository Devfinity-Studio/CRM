# PROJECT.md - DevCRM

## Vision
DevCRM is a comprehensive, end-to-end Customer Relationship Management platform designed for businesses to manage their entire client lifecycle: customer databases, leads, quotes, invoices, payments, subscriptions, inventory, ad campaigns, and automated reminders.

## Target Audience
Businesses, B2B companies, and sales/ops teams needing an all-in-one CRM suite for managing customer relations, operations, finance, and marketing.

## Primary Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database & ORM**: PostgreSQL with Drizzle ORM
- **API**: tRPC v11 & React Query
- **Styling & UI**: TailwindCSS v4
- **Code Quality**: Biome
- **File Storage**: Cloudflare R2 (S3 API)

## Current State
DevCRM has completed **Milestone 12: Expanded CRM Workflows & Sales Pipelines**. The platform now offers a fully-fledged sales pipeline featuring a drag-and-drop Kanban board for Deals, a chronological activity tracker for logging calls/meetings on deals, lead scoring and qualification tags for contacts, and a dedicated pipeline forecast dashboard predicting revenue and tracking win/loss metrics.

<details>
<summary>Previous State</summary>
DevCRM has completed **Milestone 11: User Onboarding & Experience Polish**. The platform now offers a robust first-time user experience featuring a welcoming modal, a persistent setup checklist, engaging empty states across all core data tables, contextual tooltip helpers, and driver.js-powered interactive guided tours. All features up through Milestone 11 have been successfully implemented and archived.
</details>

## Next Milestone Goals
The next step (Milestone 13) is ready to be defined. Future enhancements may focus on deep analytics, communication integrations (e.g. email ingestion, calendar sync), or expanding reporting capabilities.
