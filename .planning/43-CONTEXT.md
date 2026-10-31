# Phase 43: CRM Client Profiles 2-Column Overhaul - Context

## Overview
Phase 43 transforms the CRM Client Profile page (`src/app/clients/[id]/page.tsx`) into the Stitch MCP 2-column layout (Primary Client Details & Deal History on Left, Interactive Chronological Activity Timeline on Right), with enriched deal history and contact qualification badges.

## User Decisions & Preferences
1. **Tab Structure & Layout Division**:
   - Retain the top tab navigation (`Overview` vs `Ledger & Statements`) so financial ledgers remain fully accessible without cluttering the primary view.
   - On the `Overview` tab, implement the Stitch 2-column layout:
     - **Left Column (Primary ~60-65% width)**:
       - Client Header Card with large logo/initials avatar, company metrics (Total Deals, Open Value, Won Value), contact information, and Tax & Financial identifiers (GSTIN, Business PAN).
       - Points of Contact (POCs) section displaying contact cards with Lead Scores and Qualification status pills (SQL, MQL, etc.).
       - Deal History section (REQ-43-03) showing active and closed deals with stage pills, expected close dates, and values.
     - **Right Column (Secondary ~35-40% width)**:
       - Sticky/Interactive `ActivityTimeline` (REQ-43-02) with segmented quick-add form (Note, Call, Email, Meeting) and chronological feed.
2. **POC Management**:
   - Provide both: in-context quick modal (`AddPocDialog`) for instant contact creation pre-linked to the client, plus an external link to the full `/contacts/new` form.
3. **Design System & Styling**:
   - Stitch glassmorphic styling (`bg-card/75 backdrop-blur-md border border-border/70 rounded-2xl`).
   - Theme tokens aligned with DevCRM Premium Indigo theme.
