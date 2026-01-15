# Lebanese Accounting SaaS - Updated Roadmap
## Post-Competitive Analysis Plan
### January 2026

---

# EXECUTIVE SUMMARY

Based on our competitive analysis of **Softwave C.S.** (30-year Lebanese ERP company with 1,000+ clients), we've identified that your system is at **64% feature parity** with their BMS. This document outlines a strategic plan to reach **90%+ parity** while maintaining your AI-powered advantages.

---

# 1. COMPETITIVE POSITION SUMMARY

## 1.1 Current Feature Coverage

| Category | Their Features | You Have | Coverage |
|----------|---------------|----------|----------|
| General Specifications | 13 | 10 | **77%** |
| Account Receivable (Sales) | 7 | 3 | **43%** |
| Account Payable (Purchases) | 8 | 5 | **63%** |
| Stock Adjustment | 5 | 3 | **60%** |
| General Ledgers | 6 | 4 | **67%** |
| **TOTAL** | **39** | **25** | **64%** |

## 1.2 Your Competitive Advantages (Moat)

| Advantage | Why It Matters | Can They Copy? |
|-----------|----------------|----------------|
| **AI OCR Invoice Scanning** | 10x faster data entry | Hard - requires ML expertise |
| **Offline-First Architecture** | True resilience for Lebanon | Hard - requires rewrite |
| **Cloud Native SaaS** | Modern, accessible anywhere | Hard - legacy desktop |
| **WhatsApp Integration** | Native to Lebanese business | Medium - API work |
| **Digital Daftar** | Cultural innovation | Medium |
| **Modern UI/UX** | 2025 vs 1990s interface | Hard - full redesign |
| **Arabic AI Chatbot** | Natural language queries | Hard |

---

# 2. CRITICAL GAPS TO CLOSE

## 2.1 High Priority (Must Have for Launch)

| Gap | Impact | Current Status | Target Phase |
|-----|--------|----------------|--------------|
| **Purchase Orders** | Can't track orders vs receipts | ❌ Missing | Phase 4B |
| **Sales Orders** | No order-to-invoice workflow | ❌ Missing | Phase 4B |
| **Customer Price Lists** | Can't do wholesale vs retail | ❌ Missing | Phase 4B |
| **Returns (proper flow)** | Half-baked returns | ⚠️ Partial | Phase 4A (POS) |
| **Debit/Credit Notes** | Accounting adjustments | ❌ Missing | Phase 4B |
| **Quotes/Pro-forma** | No quotation workflow | ❌ Missing | Phase 4B |
| **Barcode Label Printing** | Essential for retail | ❌ Missing | Phase 4A (POS) |

## 2.2 Medium Priority (Growth Features)

| Gap | Impact | Current Status | Target Phase |
|-----|--------|----------------|--------------|
| Sales Rep/Salesman tracking | No commission, no rep assignment | ❌ Missing | Phase 11 |
| Cost Centers | No department-level P&L | ❌ Missing | Phase 7 |
| Full Trial Balance | Accountants need this | ⚠️ Partial | Phase 4B |
| Full Balance Sheet | Professional accounting | ⚠️ Partial | Phase 4B |
| Multi-warehouse transfers | Single location only | 📋 Planned | Phase 7 |
| User activity logging | Audit trail incomplete | ⚠️ Partial | Ongoing |

---

# 3. REVISED PHASE STRUCTURE

## 3.1 Updated Phase Timeline

```
ORIGINAL PHASES:
├── Phase 1: Foundation ✅ COMPLETE
├── Phase 2: Invoicing & Payments ✅ COMPLETE  
├── Phase 3: Reports & Analytics ✅ COMPLETE
├── Phase 4: Export & POS ← IN PROGRESS (split into 4A/4B)
├── Phase 5: AI OCR
├── Phase 6: Digital Daftar
├── Phase 7: Advanced Inventory
├── Phase 8: Arabic RTL
├── Phase 9: Customer Portal
├── Phase 10: WhatsApp
├── Phase 11: Employee/Payroll
└── Phase 12: Multi-Location

REVISED PHASES:
├── Phase 1-3: ✅ COMPLETE
├── Phase 4A: POS System + Exports (6 weeks)
├── Phase 4B: Orders & Documents (NEW - 4 weeks) ← CRITICAL ADDITION
├── Phase 5: AI OCR (4-5 weeks)
├── Phase 6: Digital Daftar (3-4 weeks)
├── Phase 7: Advanced Inventory + Cost Centers (4 weeks)
├── Phase 8: Arabic RTL (2-3 weeks)
├── Phase 9: Customer Portal + Loyalty (4-5 weeks)
├── Phase 10: WhatsApp Integration (3-4 weeks)
├── Phase 11: Employee/Payroll + Sales Reps (5 weeks)
└── Phase 12: Multi-Location (5-6 weeks)
```

---

# 4. PHASE 4A: POS SYSTEM + EXPORTS (6 weeks)

## 4.1 Part A: Export Functionality (Week 1-2)

### PDF Templates
- [ ] Invoice PDF (customer-facing)
- [ ] Supplier Statement PDF
- [ ] P&L Report PDF
- [ ] Cash Flow Report PDF
- [ ] Inventory Report PDF
- [ ] Payment Receipt PDF

### Excel Exports
- [ ] All reports exportable to Excel
- [ ] Raw data exports
- [ ] Multi-sheet workbooks
- [ ] Arabic text support

### Tech Stack
- @react-pdf/renderer for PDFs
- xlsx (SheetJS) for Excel
- file-saver for downloads

## 4.2 Part B: POS System (Week 3-8)

### Core POS Features
- [ ] Barcode scanner primary interface (supermarket focus)
- [ ] Product search by name/PLU
- [ ] Cart management
- [ ] Multi-currency payments (USD + LBP)
- [ ] Mixed currency payments
- [ ] Cash drawer management
- [ ] Session/shift management
- [ ] Receipt printing (ESC/POS)
- [ ] Daily X/Z reports

### Offline Architecture
- [ ] PWA with IndexedDB (Dexie.js)
- [ ] Electron desktop with SQLite
- [ ] Shared pos-core package
- [ ] Queue-based sync
- [ ] Time-based license tokens

### Returns & Refunds (Gap Closure)
- [ ] Return with original receipt
- [ ] Return without receipt (approval required)
- [ ] Exchange workflow
- [ ] Refund to original payment method
- [ ] Return to inventory tracking
- [ ] Credit note generation on return

### Barcode Label Printing (Gap Closure)
- [ ] Product label design
- [ ] Shelf label design
- [ ] Batch label printing
- [ ] Thermal label printer support

---

# 5. PHASE 4B: ORDERS & DOCUMENTS (NEW - 4 weeks)

**This is a NEW phase to close critical competitive gaps.**

## 5.1 Purchase Orders (Week 1)

### Database Schema
```sql
purchase_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  number VARCHAR -- PO-2024-00001
  supplier_id UUID,
  date DATE,
  expected_delivery_date DATE,
  status ENUM('draft', 'sent', 'partial', 'received', 'cancelled'),
  currency ENUM('USD', 'LBP'),
  exchange_rate DECIMAL,
  subtotal DECIMAL,
  tax_amount DECIMAL,
  total DECIMAL,
  notes TEXT,
  created_by UUID,
  ...
)

purchase_order_items (
  id UUID PRIMARY KEY,
  purchase_order_id UUID,
  product_id UUID,
  description VARCHAR,
  quantity_ordered DECIMAL,
  quantity_received DECIMAL,
  unit_price DECIMAL,
  line_total DECIMAL,
  ...
)
```

### Features
- [ ] Create PO manually
- [ ] Create PO from low stock suggestions
- [ ] Send PO via email/WhatsApp
- [ ] Track PO status
- [ ] Receive goods (partial or full)
- [ ] Convert PO to Purchase Invoice
- [ ] Three-way matching (PO vs Receipt vs Invoice)
- [ ] PO reports

### Workflow
```
Create PO → Send to Supplier → Receive Goods → Match to Invoice → Pay
   ↓              ↓                 ↓               ↓           ↓
 Draft         Sent            Partial          Matched       Paid
                               Received
```

## 5.2 Sales Orders (Week 2)

### Database Schema
```sql
sales_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  number VARCHAR, -- SO-2024-00001
  customer_id UUID,
  date DATE,
  expected_delivery_date DATE,
  status ENUM('draft', 'confirmed', 'partial', 'fulfilled', 'cancelled'),
  currency ENUM('USD', 'LBP'),
  exchange_rate DECIMAL,
  subtotal DECIMAL,
  discount_amount DECIMAL,
  tax_amount DECIMAL,
  total DECIMAL,
  price_list_id UUID, -- Link to customer price list
  sales_rep_id UUID, -- Future: salesman assignment
  notes TEXT,
  created_by UUID,
  ...
)

sales_order_items (
  id UUID PRIMARY KEY,
  sales_order_id UUID,
  product_id UUID,
  description VARCHAR,
  quantity_ordered DECIMAL,
  quantity_delivered DECIMAL,
  unit_price DECIMAL,
  discount_percent DECIMAL,
  line_total DECIMAL,
  ...
)
```

### Features
- [ ] Create sales order
- [ ] Reserve inventory for order
- [ ] Deliver goods (partial or full)
- [ ] Convert SO to Sales Invoice
- [ ] Track order status
- [ ] Order reports

### Workflow
```
Create SO → Confirm → Pick/Pack → Deliver → Invoice → Collect Payment
   ↓           ↓         ↓          ↓          ↓            ↓
 Draft     Confirmed   Picking   Partial   Invoiced       Paid
                                Fulfilled
```

## 5.3 Customer Price Lists (Week 2-3)

### Database Schema
```sql
price_lists (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  name VARCHAR, -- "Retail", "Wholesale", "VIP"
  currency ENUM('USD', 'LBP'),
  is_default BOOLEAN,
  is_active BOOLEAN,
  ...
)

price_list_items (
  id UUID PRIMARY KEY,
  price_list_id UUID,
  product_id UUID,
  price DECIMAL,
  min_quantity DECIMAL, -- Quantity-based pricing
  ...
)

-- Link customers to price lists
customer_price_lists (
  id UUID PRIMARY KEY,
  customer_id UUID,
  price_list_id UUID,
  priority INT, -- If multiple, which takes precedence
  ...
)
```

### Features
- [ ] Create multiple price lists
- [ ] Assign products to price lists
- [ ] Assign customers to price lists
- [ ] Quantity-based pricing (buy 10+ get discount)
- [ ] Price list effective dates
- [ ] Auto-apply in POS and invoicing

## 5.4 Quotes / Pro-forma Invoices (Week 3)

### Database Schema
```sql
quotes (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  number VARCHAR, -- QUO-2024-00001
  customer_id UUID,
  date DATE,
  valid_until DATE,
  status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'),
  currency ENUM('USD', 'LBP'),
  exchange_rate DECIMAL,
  subtotal DECIMAL,
  discount_amount DECIMAL,
  tax_amount DECIMAL,
  total DECIMAL,
  terms TEXT,
  notes TEXT,
  created_by UUID,
  ...
)

quote_items (
  id UUID PRIMARY KEY,
  quote_id UUID,
  product_id UUID,
  description VARCHAR,
  quantity DECIMAL,
  unit_price DECIMAL,
  discount_percent DECIMAL,
  line_total DECIMAL,
  ...
)
```

### Features
- [ ] Create quote
- [ ] Send quote via email/WhatsApp
- [ ] Track quote status
- [ ] Convert quote to Sales Order
- [ ] Convert quote to Sales Invoice
- [ ] Quote expiry alerts
- [ ] Quote reports (win rate, etc.)

### Workflow
```
Create Quote → Send → Customer Reviews → Accept/Reject
      ↓           ↓           ↓              ↓
    Draft       Sent       Pending       Accepted → SO/Invoice
                                        Rejected
```

## 5.5 Debit & Credit Notes (Week 4)

### Database Schema
```sql
-- Reuse invoices table with new types
invoices.type ENUM('purchase', 'expense', 'sale', 'credit_note', 'debit_note')

-- Credit Note: You owe customer less (reduces receivable)
-- Debit Note: Customer owes you more (increases receivable)

credit_notes (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  number VARCHAR, -- CN-2024-00001
  customer_id UUID, -- Or supplier_id
  original_invoice_id UUID, -- The invoice being adjusted
  date DATE,
  reason VARCHAR,
  currency ENUM('USD', 'LBP'),
  exchange_rate DECIMAL,
  subtotal DECIMAL,
  tax_amount DECIMAL,
  total DECIMAL,
  status ENUM('draft', 'issued', 'applied'),
  notes TEXT,
  created_by UUID,
  ...
)
```

### Credit Note Features
- [ ] Create credit note from return
- [ ] Create manual credit note
- [ ] Apply credit note to invoices
- [ ] Track unapplied credit notes
- [ ] Credit note PDF

### Debit Note Features
- [ ] Create debit note for additional charges
- [ ] Link to original invoice
- [ ] Customer notification
- [ ] Debit note PDF

## 5.6 Enhanced Financial Reports (Week 4)

### Trial Balance
- [ ] Full trial balance report
- [ ] By date range
- [ ] Debit/credit columns
- [ ] Opening + movements + closing
- [ ] Export to Excel

### Balance Sheet
- [ ] Full balance sheet
- [ ] Assets, Liabilities, Equity
- [ ] Comparative (vs previous period)
- [ ] By currency

---

# 6. UPDATED FULL TIMELINE

## 6.1 Revised Development Schedule

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1-3 | - | - | Done | ✅ Complete |
| **Phase 4A: POS + Exports** | 6 weeks | Week 1 | Week 6 | 🔄 In Progress |
| **Phase 4B: Orders & Documents** | 4 weeks | Week 7 | Week 10 | 📋 NEW |
| Phase 5: AI OCR | 4 weeks | Week 11 | Week 14 | 📋 Planned |
| Phase 6: Digital Daftar | 3 weeks | Week 15 | Week 17 | 📋 Planned |
| Phase 7: Advanced Inventory | 4 weeks | Week 18 | Week 21 | 📋 Planned |
| Phase 8: Arabic RTL | 2 weeks | Week 22 | Week 23 | 📋 Planned |
| Phase 9: Customer Portal | 4 weeks | Week 24 | Week 27 | 📋 Planned |
| Phase 10: WhatsApp | 3 weeks | Week 28 | Week 30 | 📋 Planned |
| Phase 11: Employee/Payroll | 5 weeks | Week 31 | Week 35 | 📋 Planned |
| Phase 12: Multi-Location | 5 weeks | Week 36 | Week 40 | 📋 Planned |

**Total Estimated Time: ~40 weeks (10 months)**

## 6.2 Feature Parity Progress

| After Phase | Feature Parity | Key Additions |
|-------------|----------------|---------------|
| Phase 4A Complete | ~70% | POS, Returns, Label Printing |
| Phase 4B Complete | **~90%** | Orders, Price Lists, Notes |
| Phase 5 Complete | ~90% + AI | OCR (competitive advantage) |
| Phase 6 Complete | ~92% | Digital Daftar (unique) |
| Phase 7 Complete | ~95% | Cost Centers, Advanced Inventory |

---

# 7. IMPLEMENTATION PRIORITY MATRIX

## 7.1 Phase 4B Task Priority

| Task | Priority | Effort | Dependencies | Order |
|------|----------|--------|--------------|-------|
| Purchase Orders | HIGH | 3 days | None | 1 |
| Receive Goods (PO) | HIGH | 2 days | Purchase Orders | 2 |
| PO to Invoice | HIGH | 2 days | Receive Goods | 3 |
| Sales Orders | HIGH | 3 days | None | 4 |
| SO to Invoice | HIGH | 2 days | Sales Orders | 5 |
| Customer Price Lists | HIGH | 3 days | None | 6 |
| Quotes | MEDIUM | 2 days | Price Lists | 7 |
| Credit Notes | HIGH | 2 days | Returns (4A) | 8 |
| Debit Notes | MEDIUM | 1 day | Credit Notes | 9 |
| Trial Balance | MEDIUM | 1 day | None | 10 |
| Balance Sheet | MEDIUM | 1 day | Trial Balance | 11 |

## 7.2 Database Schema Additions Summary

### New Tables Required
```
purchase_orders           -- Track orders to suppliers
purchase_order_items      -- PO line items
sales_orders              -- Track orders from customers  
sales_order_items         -- SO line items
price_lists               -- Multiple price lists
price_list_items          -- Product prices per list
customer_price_lists      -- Assign customers to lists
quotes                    -- Quotations/pro-forma
quote_items               -- Quote line items
```

### Invoice Type Extensions
```sql
-- Add to invoices.type enum:
'credit_note'  -- Customer credit adjustment
'debit_note'   -- Customer debit adjustment
```

### New Sequences
```
PO-2024-00001   -- Purchase Orders
SO-2024-00001   -- Sales Orders  
QUO-2024-00001  -- Quotes
CN-2024-00001   -- Credit Notes
DN-2024-00001   -- Debit Notes
```

---

# 8. COMPETITIVE POSITIONING SUMMARY

## 8.1 After Phase 4B Implementation

| Category | Their Features | You Have | Coverage |
|----------|---------------|----------|----------|
| General Specifications | 13 | 12 | **92%** |
| Account Receivable | 7 | 7 | **100%** |
| Account Payable | 8 | 8 | **100%** |
| Stock Adjustment | 5 | 4 | **80%** |
| General Ledgers | 6 | 6 | **100%** |
| **TOTAL** | **39** | **37** | **~95%** |

## 8.2 Your Unique Advantages (Post-Implementation)

| Feature | Softwave | You |
|---------|----------|-----|
| AI OCR Invoice Scanning | ❌ | ✅ |
| Offline-First POS | Basic | ✅ Advanced |
| Cloud Native | ❌ Desktop | ✅ |
| WhatsApp Native | ❌ | ✅ |
| Digital Daftar | ❌ | ✅ |
| Modern UI/UX | 1990s | ✅ 2025 |
| Arabic AI Chatbot | ❌ | ✅ |
| Mobile Apps | ❌ | ✅ |
| Multi-Currency Native | Basic | ✅ Deep |

---

# 9. RISK ASSESSMENT

## 9.1 Phase 4B Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | HIGH | MEDIUM | Strict feature freeze |
| Complex PO matching | MEDIUM | HIGH | Simplify 3-way matching |
| Price list complexity | MEDIUM | MEDIUM | Start with simple pricing |
| Integration testing | HIGH | MEDIUM | Dedicated test week |

## 9.2 Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Phase 4B delays 4A | HIGH | Parallel development where possible |
| OCR phase delayed | MEDIUM | OCR is value-add, not blocker |
| Market window | HIGH | Focus on MVP features first |

---

# 10. NEXT STEPS

## 10.1 Immediate Actions (This Week)

1. **Finalize Phase 4A scope** - Confirm POS features list
2. **Design Phase 4B schemas** - Get database design reviewed
3. **Prioritize within Phase 4B** - Purchase Orders first
4. **Setup project tracking** - Track progress against timeline

## 10.2 Phase 4B Development Order

```
Week 7:  Purchase Orders (create, send)
Week 7:  Receive Goods workflow
Week 8:  Sales Orders (create, confirm)
Week 8:  Customer Price Lists
Week 9:  Quotes/Pro-forma
Week 9:  Credit Notes
Week 10: Debit Notes
Week 10: Trial Balance & Balance Sheet
Week 10: Testing & Integration
```

---

# APPENDIX A: DOCUMENT WORKFLOWS

## A.1 Complete Purchase Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PURCHASE WORKFLOW                                     │
└─────────────────────────────────────────────────────────────────────────┘

 Low Stock Alert
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Create     │ ──▶  │    Send      │ ──▶  │   Supplier   │
│ Purchase     │      │      PO      │      │   Receives   │
│    Order     │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │                                           │
       │ Status: Draft                             │
       ▼                                           ▼
┌──────────────┐                           ┌──────────────┐
│   PO Sent    │                           │   Supplier   │
│   Status:    │                           │    Ships     │
│    Sent      │                           │    Goods     │
└──────────────┘                           └──────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────┐
                    │           RECEIVE GOODS                   │
                    │                                           │
                    │  ┌─────────────┐    ┌─────────────┐     │
                    │  │   Partial   │    │    Full     │     │
                    │  │   Receipt   │    │   Receipt   │     │
                    │  │             │    │             │     │
                    │  │ Status:     │    │ Status:     │     │
                    │  │  Partial    │    │  Received   │     │
                    │  └─────────────┘    └─────────────┘     │
                    └──────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │       SUPPLIER SENDS INVOICE              │
                    │                                           │
                    │  ┌─────────────────────────────────────┐ │
                    │  │     THREE-WAY MATCHING               │ │
                    │  │                                      │ │
                    │  │  PO Qty  vs  Receipt Qty  vs  Inv   │ │
                    │  │  PO Price vs              vs  Inv   │ │
                    │  └─────────────────────────────────────┘ │
                    └──────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │        CREATE PURCHASE INVOICE            │
                    │                                           │
                    │  • Auto-fill from PO + Receipt           │
                    │  • Handle price variances                │
                    │  • Update supplier balance               │
                    │  • Update stock                          │
                    │  • Generate journal entry                │
                    └──────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │          PAY SUPPLIER                     │
                    │                                           │
                    │  • Record payment                        │
                    │  • Allocate to invoice                   │
                    │  • Update supplier balance               │
                    │  • Update cash account                   │
                    └──────────────────────────────────────────┘
```

## A.2 Complete Sales Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SALES WORKFLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

 Customer Request
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Create     │ ──▶  │    Send      │ ──▶  │   Customer   │
│    Quote     │      │    Quote     │      │   Reviews    │
│              │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │                                           │
       │ Status: Draft                             │
       ▼                                           ▼
                               ┌──────────┴──────────┐
                               │                     │
                           Accepted              Rejected
                               │                     │
                               ▼                     ▼
                        ┌──────────────┐      ┌──────────────┐
                        │   Convert    │      │   Archive    │
                        │    to SO     │      │    Quote     │
                        │              │      │              │
                        └──────────────┘      └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Sales      │
                        │   Order      │
                        │              │
                        │ Status:      │
                        │  Confirmed   │
                        └──────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────────────┐
                    │            FULFILL ORDER                  │
                    │                                           │
                    │  ┌─────────────┐    ┌─────────────┐     │
                    │  │   Partial   │    │    Full     │     │
                    │  │  Delivery   │    │  Delivery   │     │
                    │  │             │    │             │     │
                    │  │ Status:     │    │ Status:     │     │
                    │  │  Partial    │    │  Fulfilled  │     │
                    │  └─────────────┘    └─────────────┘     │
                    │                                          │
                    │  • Update stock                         │
                    │  • Generate delivery note               │
                    └──────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │        CREATE SALES INVOICE              │
                    │                                           │
                    │  • Auto-fill from SO                     │
                    │  • Apply customer price list             │
                    │  • Calculate tax                         │
                    │  • Update customer balance               │
                    │  • Generate journal entry                │
                    └──────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │        COLLECT PAYMENT                    │
                    │                                           │
                    │  • Record receipt                        │
                    │  • Allocate to invoice                   │
                    │  • Update customer balance               │
                    │  • Update cash account                   │
                    └──────────────────────────────────────────┘
```

---

# APPENDIX B: UI MOCKUPS

## B.1 Purchase Order List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Purchase Orders                                    [+ New Order]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [All] [Draft] [Sent] [Partial] [Received]    🔍 Search...             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ # PO Number    │ Supplier        │ Date     │ Total    │ Status   ││
│  │───────────────────────────────────────────────────────────────────-││
│  │ PO-2024-00042 │ ABC Trading     │ Jan 15   │ $1,250   │ 🟡 Sent   ││
│  │ PO-2024-00041 │ Delta Foods     │ Jan 14   │ $890     │ 🟢 Received││
│  │ PO-2024-00040 │ Golden Supplies │ Jan 12   │ $2,100   │ 🟠 Partial ││
│  │ PO-2024-00039 │ ABC Trading     │ Jan 10   │ $650     │ ⚪ Draft  ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Showing 1-10 of 42                              [← Prev] [Next →]     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## B.2 Price List Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Price Lists                                       [+ New Price List]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │                                                                    ││
│  │  📋 Retail (Default)                                              ││
│  │     128 products • USD                                            ││
│  │     [Edit] [View Products] [Assign Customers]                     ││
│  │                                                                    ││
│  │  📋 Wholesale                                                      ││
│  │     128 products • USD • 15% off retail                           ││
│  │     [Edit] [View Products] [Assign Customers]                     ││
│  │                                                                    ││
│  │  📋 VIP Customers                                                  ││
│  │     45 products • USD • Custom prices                             ││
│  │     [Edit] [View Products] [Assign Customers]                     ││
│  │                                                                    ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*Document Version: 2.1*  
*Created: January 15, 2026*  
*Based on Softwave C.S. Competitive Analysis*
