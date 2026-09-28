# Phase 33: Deals & Kanban Pipeline - Plan

## Step 1: Dependencies
- **Action**: Install `@hello-pangea/dnd` for Kanban drag-and-drop. (It's a modern fork of `react-beautiful-dnd`).

## Step 2: Kanban UI Components
- **Action**: Create `src/app/deals/page.tsx` as the main Deals view.
- **Action**: Create `KanbanBoard`, `KanbanColumn`, and `KanbanCard` components in `src/components/deals/`.
- **Logic**: Implement drag-and-drop `onDragEnd` logic to call `update` TRPC mutation when a deal changes columns.

## Step 3: Deal Management Modals
- **Action**: Create `DealDialog` component for adding and editing deals.
- **Integration**: Add a "New Deal" button to the Deals page and optionally to the Company details page.
