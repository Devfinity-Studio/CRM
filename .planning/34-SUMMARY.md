# Phase 34: Activity Tracking Timeline - Summary

## Work Completed
- Added `dealId` and `contactId` to the `activity_note` schema to allow linking activities beyond just companies.
- Updated TRPC endpoints `getActivityNotes` and `addActivityNote` to optionally take `dealId` and `contactId`.
- Built the `ActivityTimeline` UI component which provides a visually appealing chronological feed of past notes/calls/emails/meetings, along with a quick-add form.
- Created `DealSheet` to display the timeline when clicking on a Kanban card, bringing activity tracking directly into the Deals view.

## Next Steps
- Move to Phase 35: Lead Scoring & Qualification.
