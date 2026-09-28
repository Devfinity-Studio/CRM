# Phase 35: Lead Scoring & Qualification - Plan

## Step 1: Database Schema
- **Action**: Add `qualificationStatusEnum` to `src/server/db/schema.ts` (`NONE`, `MQL`, `SQL`, `DISQUALIFIED`).
- **Action**: Add `leadScore` (integer, default 0) and `qualificationStatus` to the `contacts` table.
- **Action**: Run DB migration.

## Step 2: Update Contact UI
- **Action**: Modify `src/app/clients/page.tsx` to display `leadScore` and `qualificationStatus` in the contact list/cards.
- **Action**: Create visual badges for MQL (Marketing Qualified) and SQL (Sales Qualified).

## Step 3: Update Deals Kanban
- **Action**: Modify `src/components/deals/kanban-board.tsx` to conditionally display the lead score if a deal is associated with a contact (this may require joining contacts in the TRPC endpoint, or just fetching them).

## Step 4: TRPC Updates
- **Action**: Update `createContact` (or add `updateContact` if not present) in `crm.ts` to support `leadScore` and `qualificationStatus`.
