# Phase 33: Deals & Kanban Pipeline - Context

## Scope
Introduce a `deals` table with sales stages and build a Kanban board UI for pipeline visualization and drag-and-drop management.

## Decisions Made
- **Database Schema**: Use Drizzle ORM to add a `deals` table with fields: `id`, `title`, `amount`, `stage` (enum), `closeDate`, `companyId` (relation), `contactId` (relation), `createdAt`, `updatedAt`.
- **Stages**: `PROSPECT`, `QUALIFIED`, `PROPOSAL`, `WON`, `LOST`.
- **Kanban Implementation**: Use `@hello-pangea/dnd` for the drag-and-drop Kanban board since it's robust and standard in modern React apps.
- **UI Components**: Shadcn UI for cards (deal items), dialogs (deal forms), and forms.
- **Data Fetching**: TRPC routers (`dealsRouter`) for querying and mutating deals.

## Out of Scope
- Deal probability percentages (unless explicitly requested later).
- Multi-pipeline support (single pipeline for MVP).
