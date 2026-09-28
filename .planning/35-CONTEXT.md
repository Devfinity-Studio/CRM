# Phase 35: Lead Scoring & Qualification - Context

## Scope
Introduce a basic lead scoring and qualification mechanism. This will allow sales teams to prioritize high-value prospects visually.

## Decisions Made
- **Database Schema**: Add `leadScore` (integer) and `qualificationStatus` (enum: `NONE`, `MQL`, `SQL`, `DISQUALIFIED`) to the `contacts` table. (MQL = Marketing Qualified Lead, SQL = Sales Qualified Lead).
- **Scoring Engine (MVP)**: Provide a manual input field for `leadScore` in the Contact edit form. Automated engagement-based scoring is out of scope for MVP.
- **Visual Indicators**: Display the `leadScore` and a color-coded `qualificationStatus` badge on the Contact List page and Deal Kanban board (if contact is linked).

## Out of Scope
- Automated engagement scoring (e.g., +5 points for opening an email).
- Machine learning/AI predictive scoring.
