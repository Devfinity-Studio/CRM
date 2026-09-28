# Phase 34: Activity Tracking Timeline - Plan

## Step 1: Database Schema Update
- **Action**: Modify `activityNotes` in `src/server/db/schema.ts` to include `dealId` and `contactId`.
- **Action**: Run DB generate.

## Step 2: TRPC Endpoints
- **Action**: Add `getActivities` and `createActivity` to `src/server/api/routers/crm.ts` (or deals router).
  - Inputs: `companyId` (optional), `dealId` (optional), `contactId` (optional)
  - Return related user info (author).

## Step 3: Activity Timeline UI Component
- **Action**: Create `src/components/crm/activity-timeline.tsx`.
- **UI**: A vertical timeline showing notes, emails, calls, and meetings. Add an input form at the top to log new activities.

## Step 4: Integration
- **Action**: Add `ActivityTimeline` to a sheet/drawer that opens when clicking a Deal in the Kanban board.
- **Action**: (Optional/Future) Add `ActivityTimeline` to Company/Contact detail pages.
