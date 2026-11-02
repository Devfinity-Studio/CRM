# Phase 51 Context: Dynamic Tax Engine, Interconnected Contacts, Deals, Quotes & Soft Inventory Holds

## Context & Objectives
Phase 51 bridges the sales CRM and financial billing modules by establishing deep data interconnection across contacts, deals, quotations, dynamic regional taxes, and warehouse inventory:
1. **Dynamic Regional Tax Engine**:
   - Multi-country & state taxation using `country-state-city`.
   - India GST: Split CGST/SGST for intra-state transactions, IGST for inter-state, Reverse Charge Mechanism (RCM), and export zero-rating.
   - UK & EU VAT: Standard/reduced VAT rates and B2B intra-community reverse charge.
   - US Sales Tax: Multi-state origin/destination taxation.
2. **Deal SKU Line Items & Soft Inventory Holds**:
   - Add SKU line items directly onto Deals (`dealProducts`).
   - Automated soft inventory reservation (`products.reservedQuantity`) when deals enter negotiation or won stages, preventing inventory overselling while preserving on-hand stock for final invoice fulfillment.
   - Automatically releases reservations if a deal is marked LOST.
3. **Quotation Builder with Digital E-Signatures**:
   - Digital signature signing flow using `react-signature-canvas` on public quote view (`/public/quote/[id]`).
   - Customer signs directly with stylus/mouse, records audit trail (signature data, signer name, email, IP, timestamp), marks quote as ACCEPTED, and auto-transitions connected Deal to WON.
4. **360° Unified Activity Timeline & Rich Notes**:
   - Unified chronological feed across Companies and Contacts merging activity notes, deal progressions, generated/signed quotes, and invoices.
   - Rich-text note composer powered by `@tiptap/react`.
   - Real-time customer Lifetime Value (LTV) calculation.

