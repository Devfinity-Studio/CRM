# Phase 34: Activity Tracking Timeline - Context

## Scope
Extend the existing `activity_note` table to support `dealId` and `contactId` associations. Build a chronological timeline UI that can be displayed on client (company) and deal pages to show history. Provide forms to log new activities.

## Decisions Made
- **Database Schema**: Add `dealId` and `contactId` to `activity_note`.
- **UI Components**: Create a reusable `ActivityTimeline` component that accepts a `companyId`, `dealId`, or `contactId` to fetch and display relevant notes.
- **Activity Types**: Keep existing `NOTE`, `CALL`, `EMAIL`, `MEETING`. Add visual icons to distinguish them.
- **Location**: Render `ActivityTimeline` in a drawer/sidebar on the Deals Kanban board (when clicking a deal) or on the company detail page.

## Out of Scope
- Automated email ingestion (manual logging only for this phase).
- Bi-directional calendar sync.
