# Lebanese Accounting SaaS
## Complete Project Roadmap & Vision Document

---

**Document Version:** 2.0  
**Last Updated:** January 2026  
**Author:** AbdulRahman / U-Manage Team  
**Status:** Active Development

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Project Vision & Mission](#2-project-vision--mission)
3. [Current State - Completed Phases](#3-current-state---completed-phases)
4. [Phase 4: Export & POS System](#4-phase-4-export--pos-system)
5. [Phase 5: AI OCR & Invoice Intelligence](#5-phase-5-ai-ocr--invoice-intelligence)
6. [Phase 6: Customer Credit System (Digital Daftar)](#6-phase-6-customer-credit-system-digital-daftar)
7. [Phase 7: Advanced Inventory Management](#7-phase-7-advanced-inventory-management)
8. [Phase 8: Arabic Localization & RTL](#8-phase-8-arabic-localization--rtl)
9. [Phase 9: Customer Portal & Loyalty](#9-phase-9-customer-portal--loyalty)
10. [Phase 10: WhatsApp & Communication Hub](#10-phase-10-whatsapp--communication-hub)
11. [Phase 11: Employee & Payroll](#11-phase-11-employee--payroll)
12. [Phase 12: Multi-Location & Franchise](#12-phase-12-multi-location--franchise)
13. [Future Vision - Long-term Features](#13-future-vision---long-term-features)
14. [Technical Architecture Summary](#14-technical-architecture-summary)
15. [Business Model & Monetization](#15-business-model--monetization)
16. [Go-to-Market Strategy](#16-go-to-market-strategy)
17. [Risk Assessment & Mitigation](#17-risk-assessment--mitigation)
18. [Success Metrics & KPIs](#18-success-metrics--kpis)
19. [Team & Resource Planning](#19-team--resource-planning)
20. [Appendix: Feature Priority Matrix](#20-appendix-feature-priority-matrix)

---

# 1. EXECUTIVE SUMMARY

## 1.1 What We're Building

A comprehensive accounting and point-of-sale SaaS platform specifically designed for Lebanese small and medium businesses. The platform addresses the unique challenges of operating in Lebanon: dual-currency chaos (USD/LBP), unreliable infrastructure (power outages, internet disruptions), paper-based operations, and the cultural tradition of customer credit ("daftar").

## 1.2 Why This Matters

Lebanese SMBs have no suitable software solution:
- International solutions don't support USD/LBP dual currency
- Local solutions are outdated desktop applications
- No solution handles offline operations properly
- Excel and paper remain the default, leading to errors and lost data

## 1.3 Our Differentiators

| Differentiator | Description |
|----------------|-------------|
| **Dual Currency Native** | Built from ground up for USD/LBP reality |
| **Offline-First** | True offline capability for Lebanese infrastructure |
| **Arabic-First AI** | OCR and chatbot that understand Arabic invoices |
| **Cultural Fit** | Digital daftar, WhatsApp integration, local workflows |
| **Simple UX** | Complex accounting hidden behind simple interfaces |
| **Modern Tech** | Cloud-native with desktop option where needed |

## 1.4 Current Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Invoicing & Payments | ✅ Complete | 100% |
| Phase 3: Reports & Analytics | ✅ Complete | 100% |
| Phase 4: Export & POS | 🔄 In Progress | 20% |
| Phases 5-12 | 📋 Planned | 0% |

---

# 2. PROJECT VISION & MISSION

## 2.1 Vision Statement

**"To become the operating system for Lebanese retail businesses, transforming how they manage money, inventory, and customers."**

## 2.2 Mission Statement

**"Empower Lebanese SMBs with modern, reliable, and culturally-adapted business software that works in their reality - not against it."**

## 2.3 Core Principles

### 2.3.1 Lebanese Reality First
Every feature decision asks: "Does this work during a power outage? Does this handle USD/LBP? Will a shop owner in Tripoli understand this?"

### 2.3.2 Simplicity Over Features
We hide complexity. A business owner shouldn't need to understand double-entry accounting to see their profit.

### 2.3.3 Offline is Not Optional
Unlike other SaaS products, offline capability is a core requirement, not an afterthought.

### 2.3.4 Trust Through Transparency
Show users their data clearly. Let them export everything. Never lock them in.

### 2.3.5 Grow With Customers
Start simple, add complexity only when the customer needs it. Don't overwhelm.

## 2.4 Target Market Segments

### Primary Targets (Phase 1-2 Focus)

| Segment | Size | Pain Points | Priority |
|---------|------|-------------|----------|
| **Mini Markets (Dekkaneh)** | ~15,000 | Inventory, customer credit, dual currency | HIGH |
| **Supermarkets** | ~2,000 | Multi-location, employee management, reporting | HIGH |
| **Retail Shops** | ~20,000 | Inventory, suppliers, customer management | MEDIUM |

### Secondary Targets (Phase 3+ Focus)

| Segment | Size | Pain Points | Priority |
|---------|------|-------------|----------|
| **Restaurants & Cafes** | ~8,000 | Menu management, kitchen orders, delivery | MEDIUM |
| **Pharmacies** | ~3,000 | Special regulations, expiry tracking | LOW |
| **Wholesale Distributors** | ~1,500 | Large inventory, B2B credit | LOW |

### Future Targets

| Segment | Opportunity |
|---------|-------------|
| **Lebanese Diaspora** | Businesses owned by Lebanese abroad |
| **Regional Expansion** | Syria, Jordan, Iraq - similar challenges |
| **Vertical SaaS** | Industry-specific solutions (pharmacy, restaurant) |

---

# 3. CURRENT STATE - COMPLETED PHASES

## 3.1 Phase 1: Foundation (Complete)

### Delivered Features

**Authentication & Multi-tenancy**
- User registration and login
- JWT access tokens (15 min) + refresh tokens (7 days)
- Multi-tenant architecture with row-level isolation
- Tenant identification via subdomain

**Contacts Management**
- Suppliers and customers CRUD
- Balance tracking (USD and LBP)
- Contact types: supplier, customer, both
- Payment terms configuration

**Product Catalog**
- Products with Arabic/English names
- Categories (hierarchical parent/child)
- Barcode and SKU support
- Cost price and selling price
- Stock tracking toggle

**Settings**
- Business profile management
- Exchange rate configuration
- Default accounts auto-creation

### Technical Foundation

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 + Drizzle ORM |
| Frontend | Next.js 14 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand + TanStack Query |
| Monorepo | Turborepo + pnpm |

## 3.2 Phase 2: Invoicing & Payments (Complete)

### Delivered Features

**Exchange Rates**
- Daily USD/LBP rate management
- Historical rate tracking
- Rate locked at transaction time

**Money Accounts**
- Cash accounts (USD, LBP)
- Bank accounts
- Account movements tracking
- Transfers between accounts
- Balance adjustments

**Purchase & Expense Invoices**
- Auto-numbering (PUR-2024-00001, EXP-2024-00001)
- Invoice lifecycle (draft → pending → partial → paid)
- Line items with quantity, price, discount
- Dual currency display (USD + LBP equivalent)
- Supplier balance auto-update
- Stock updates from purchases

**Payments**
- Payment recording to suppliers
- Multi-invoice allocation
- Multiple payment methods
- Payment lifecycle tracking
- Account balance deduction

**Dashboard**
- Cash position overview (USD + LBP)
- Pending payables summary
- Due this week alerts
- Recent activity feed

### Database Schema Highlights

| Table | Purpose |
|-------|---------|
| invoices | All invoice types with status workflow |
| invoice_items | Line items linked to products |
| payments | Payment records with allocation |
| money_accounts | Cash and bank accounts |
| account_movements | Transaction history |
| exchange_rates | Historical rates |
| sequences | Auto-numbering per type |

## 3.3 Phase 3: Reports & Analytics (Complete)

### Delivered Reports

| Report | Description |
|--------|-------------|
| **Profit & Loss** | Revenue minus expenses by period |
| **Supplier Balances** | Outstanding amounts per supplier |
| **Supplier Statement** | Transaction history per supplier |
| **Expenses by Category** | Breakdown with visual charts |
| **Payments Due** | Overdue, this week, upcoming |
| **Cash Flow** | Movements by account |
| **Inventory Value** | Stock valuation |
| **Low Stock Alerts** | Products below minimum |

### Report Features

- Date range picker with presets (Today, This Week, This Month, etc.)
- Shared date utilities across all reports
- Tabular and visual representations
- Real-time calculations

### Technical Notes

```
Key Schema References:
- invoices.amountPaid (NOT paidAmount)
- invoices.balance
- Invoice status: 'draft', 'pending', 'partial', 'paid', 'cancelled'
- Invoice type: 'purchase', 'expense', 'sale'
```

---

# 4. PHASE 4: EXPORT & POS SYSTEM

**Duration:** 6-8 weeks  
**Status:** 🔄 In Progress  
**Priority:** CRITICAL

## 4.1 Part A: Export Functionality (Week 1-2)

### Goals
- Professional PDF exports for all reports
- Excel exports for data analysis
- Reusable export components
- Arabic text support in exports

### PDF Templates Required

| Template | Purpose |
|----------|---------|
| Invoice PDF | Customer-facing invoice document |
| Supplier Statement | Transaction history for suppliers |
| P&L Report | Profit and loss summary |
| Cash Flow Report | Account movement summary |
| Inventory Report | Stock listing with values |
| Payment Receipt | Payment confirmation |

### PDF Features

- Business header (logo, name, address)
- Arabic + English content
- Dual currency display
- Professional formatting
- QR code for verification (future)

### Excel Export Features

- Raw data export for all reports
- Multi-sheet workbooks where appropriate
- Formatted headers
- Auto-column width
- Arabic text support

### Implementation Approach

| Technology | Purpose |
|------------|---------|
| @react-pdf/renderer | React-based PDF generation |
| xlsx (SheetJS) | Excel file generation |
| file-saver | Browser download triggering |

## 4.2 Part B: POS System (Week 3-8)

### Strategic Decision: Supermarket Focus

**Critical Insight:** Our POS is designed for supermarkets and mini-markets, NOT restaurants. This fundamentally changes the interface:

| Restaurant POS | Supermarket POS (Our Focus) |
|----------------|----------------------------|
| Touch-screen product grids | Barcode scanner primary input |
| Category browsing | Quick search/PLU code entry |
| Table management | No table concept |
| Kitchen orders | Receipt printing focus |
| Dine-in vs takeout | Cash drawer management |

### Architecture: Hybrid PWA + Electron

**Why Both:**
- PWA: Quick setup, works on any tablet, lower barrier
- Electron: True offline, hardware integration, professional installs

**Shared Code Strategy:**
- `packages/pos-core`: React components, Zustand stores, business logic
- `apps/pos-web`: PWA wrapper using pos-core
- `apps/pos-desktop`: Electron wrapper using pos-core

### POS Core Features

**Sales Operations**
- Barcode scanning (primary interface)
- Product search by name/PLU
- Cart management
- Price override (with permission)
- Line discounts
- Transaction hold/recall

**Payment Handling**
- Cash payments (USD and LBP separately)
- Mixed currency payments
- Split payments
- Change calculation with currency selection
- Customer credit (add to tab)

**Cash Drawer Management**
- Opening float entry
- Cash in/out tracking
- End of shift count
- Variance tracking
- Blind close option

**Receipt Printing**
- ESC/POS thermal printer support
- Customizable receipt template
- Arabic + English
- Dual currency totals

**Session Management**
- Open/close shift
- Shift reports (sales, payments, voids)
- Cashier assignment
- End-of-day summary

### Offline Architecture

**Local Storage Strategy**

| Data Type | PWA (IndexedDB) | Desktop (SQLite) |
|-----------|-----------------|------------------|
| Products | ✓ Synced | ✓ Synced |
| Categories | ✓ Synced | ✓ Synced |
| Customers | ✓ Synced | ✓ Synced |
| Sales | ✓ Queued | ✓ Queued |
| Cash movements | ✓ Queued | ✓ Queued |
| Sync queue | ✓ | ✓ |

**Sync Strategy**
- Pull: Products, prices, customers on startup + periodic refresh
- Push: Sales queued when offline, pushed when online
- Conflict resolution: Server wins for master data, client wins for sales

### Hardware Integration (Electron Only)

| Hardware | Integration |
|----------|-------------|
| Barcode Scanner | USB keyboard emulation |
| Receipt Printer | ESC/POS via node-escpos |
| Cash Drawer | Printer-connected kick signal |
| Weight Scale | Future: serial communication |

### POS User Interface Principles

**For Supermarket Context:**
- Large, prominent display of scanned product
- Running cart total always visible
- Quick number pad for PLU codes
- Minimal navigation - cashier shouldn't browse
- Clear USD/LBP breakdown
- Fast checkout flow

### Subscription Enforcement (Offline)

**Challenge:** How to enforce subscription when device is offline for days?

**Solution: Time-Based License Token**

The system issues a "license token" that includes:
- Subscription expiry date
- Allowed features
- Grace period (7-14 days for Lebanon reality)
- Cryptographic signature

When offline:
- POS checks local token
- If expired, shows warning but allows grace period
- After grace period, enters read-only mode
- Syncs new token when online

**Grace Period Rationale:**
- Lebanon has frequent, extended outages
- Business owner shouldn't be blocked during Ramadan rush
- Trust the customer, verify when possible

---

# 5. PHASE 5: AI OCR & INVOICE INTELLIGENCE

**Duration:** 4-5 weeks  
**Status:** 📋 Planned  
**Priority:** HIGH

## 5.1 Overview

AI-powered invoice scanning that extracts data from supplier invoices, learns from corrections, and dramatically reduces manual data entry.

## 5.2 The Lebanese Invoice Challenge

**Real-world complexity:**
- Handwritten invoices (still common)
- Arabic + English mixed
- Inconsistent formats per supplier
- No standardization
- Poor image quality (phone photos)
- Same product, many names

## 5.3 OCR Pipeline

### Stage 1: Image Capture & Preprocessing
- Camera capture (mobile-optimized)
- File upload
- Image quality assessment
- Auto-orientation
- Contrast enhancement
- Compression for storage

### Stage 2: Text Extraction
- Send to OCR engine
- Get raw text + layout information
- Arabic text normalization
- Number extraction

### Stage 3: Entity Parsing
- Identify vendor/supplier name
- Extract invoice number
- Parse date
- Identify line items (description, quantity, price)
- Calculate totals
- Detect currency

### Stage 4: Intelligent Matching

**Vendor Matching:**
- Exact alias lookup
- Fuzzy name search
- Phone number matching
- Return confidence score

**Product Matching:**
- Exact alias from this supplier
- Fuzzy search in product catalog
- Barcode extraction and lookup
- Historical purchase patterns

### Stage 5: Confidence Scoring

| Confidence | Action |
|------------|--------|
| 90%+ | Auto-match |
| 70-89% | Auto-match with review flag |
| 50-69% | Show candidates, user picks |
| <50% | No match, user creates |

### Stage 6: User Review Interface
- Side-by-side: image and extracted data
- Highlight uncertain fields
- Easy correction interface
- Product lookup/creation
- Vendor lookup/creation

### Stage 7: Learning System
- Store corrections as aliases
- Increment use count on successful matches
- Higher use count = higher priority in future
- Per-supplier product aliases

## 5.4 OCR Engine Options

| Engine | Pros | Cons | Cost |
|--------|------|------|------|
| GPT-4 Vision | Best understanding, handles poor images | Higher cost | ~$0.02-0.05/image |
| Google Document AI | Excellent accuracy, structured output | Per-page pricing | $1.50/1000 pages |
| Qwen2-VL | Good Arabic, self-hosted | Requires GPU server | ~$50-100/month server |
| Claude Vision | Good understanding | Token cost | Variable |

**Recommendation:** Start with GPT-4 Vision or Claude Vision for quality, migrate to self-hosted as volume grows.

## 5.5 Product Identity & Matching System

### The Multi-Name Problem

Same product appears as:
- "حليب نيدو 400غ"
- "نيدو 400"
- "NIDO 400G"
- "Nido Milk 400"
- "حليب نستله نيدو"

### Solution: Alias System

**Master Product:** Single source of truth
- Canonical name (English)
- Canonical name (Arabic)
- Brand, category, unit

**Product Aliases:** All known names
- Alias text
- Source (OCR, manual, import)
- Supplier (optional - supplier-specific aliases)
- Use count
- Verified flag

### Name Normalization Pipeline

```
Input: "  حَلِيب نِيدُو ٤٠٠ غرام  NIDO  "
↓
Step 1: Trim & collapse whitespace
Step 2: Remove Arabic diacritics
Step 3: Normalize Arabic numbers (٤٠٠ → 400)
Step 4: Normalize Arabic letters (أ إ آ → ا)
Step 5: Lowercase Latin
Step 6: Normalize units (غرام → g)
↓
Output: "حليب نيدو 400g nido"
```

## 5.6 Key Metrics

| Metric | Target |
|--------|--------|
| Extraction accuracy | >90% for clear invoices |
| Auto-match rate (Week 1) | ~40% |
| Auto-match rate (Week 8) | ~80% |
| Processing time | <30 seconds |
| User correction time | <2 minutes |

---

# 6. PHASE 6: CUSTOMER CREDIT SYSTEM (DIGITAL DAFTAR)

**Duration:** 3-4 weeks  
**Status:** 📋 Planned  
**Priority:** HIGH

## 6.1 Cultural Context

The "daftar" (دفتر) is a fundamental part of Lebanese retail culture. It's a paper notebook where shop owners track customer credit:

- Customer buys goods on credit
- Shop owner writes it down
- Customer pays when they can
- Often informal, trust-based
- Major source of business loss when mismanaged

## 6.2 Digital Daftar Features

### Customer Credit Management
- Credit limit per customer
- Current balance tracking (USD + LBP)
- Credit approval workflow
- Block sales if over limit
- Credit hold option

### Transaction Recording
- Sale on credit at POS
- Payment collection
- Partial payments
- Credit adjustments
- Transaction history

### Customer Communication
- Balance reminder (WhatsApp)
- Monthly statement
- Payment receipt
- Overdue alerts

### Aging Analysis
- 0-30 days
- 31-60 days
- 61-90 days
- 90+ days (high risk)

### Collection Tools
- Payment scheduling
- Promise-to-pay tracking
- Write-off workflow
- Collection notes

## 6.3 POS Integration

**At Checkout:**
- Link customer to transaction
- Show current balance
- Check credit limit
- Option: Cash, Credit, or Split
- Update balance immediately

**Customer Lookup:**
- Search by name/phone
- View balance
- View recent purchases
- Quick payment entry

## 6.4 Reports

| Report | Purpose |
|--------|---------|
| Credit Balances | All customers with outstanding credit |
| Aging Report | Breakdown by age bucket |
| Collection Report | Payments collected by period |
| At-Risk Customers | High balance, aging, no recent payment |
| Credit Usage | How much credit is being used |

## 6.5 Safeguards

- Maximum credit limit per customer type
- Alert when approaching limit
- Manager approval for limit increase
- Automatic hold after X days overdue
- Audit trail for all changes

---

# 7. PHASE 7: ADVANCED INVENTORY MANAGEMENT

**Duration:** 3-4 weeks  
**Status:** 📋 Planned  
**Priority:** MEDIUM

## 7.1 Current State

Basic inventory:
- Stock quantity per product
- Stock updates from purchases and sales
- Low stock alerts

## 7.2 Advanced Features

### Batch & Lot Tracking
- Batch number per receipt
- Expiry date per batch
- FIFO/FEFO allocation
- Batch-level stock

### Expiry Management
- Track expiry dates
- Expiry alerts (30 days, 7 days)
- FEFO (First Expiry, First Out) for sales
- Expired product handling
- Markdown suggestions

### Multi-Location Inventory
- Stock per location
- Inter-location transfers
- Location-specific reorder points
- Consolidated reporting

### Stock Movements
- Automatic: Sales, purchases, returns
- Manual: Adjustments, damages, gifts
- Transfers: Between locations
- Full audit trail with reasons

### Stock Count (Physical Inventory)
- Full inventory count
- Partial/cycle count
- Barcode scanning support
- Variance report
- Adjustment approval workflow

### Reordering
- Reorder point per product
- Economic Order Quantity suggestions
- AI-powered demand forecasting
- Auto-generate purchase orders
- Supplier recommendations

### Valuation Methods
- Weighted Average (default)
- FIFO (for costing)
- Stock value reports
- COGS calculation

## 7.3 Reports

| Report | Purpose |
|--------|---------|
| Stock on Hand | Current quantities |
| Stock Valuation | Total inventory value |
| Movement Report | All stock changes |
| Expiry Report | Products expiring soon |
| Turnover Analysis | How fast items sell |
| Shrinkage Report | Losses and adjustments |
| ABC Analysis | Product importance ranking |

---

# 8. PHASE 8: ARABIC LOCALIZATION & RTL

**Duration:** 2-3 weeks  
**Status:** 📋 Planned  
**Priority:** HIGH

## 8.1 Localization Strategy

### Language Support
- Arabic (primary)
- English (secondary)
- User preference per account
- Mixed content handling

### Arabic UI Requirements
- Full RTL layout
- Arabic font optimization
- Number formatting
- Date formatting (both calendars)
- Currency formatting

### Translation Scope

| Area | Items |
|------|-------|
| Navigation | All menu items, buttons |
| Forms | Labels, placeholders, validation |
| Tables | Headers, empty states |
| Reports | Titles, columns, summaries |
| Notifications | All alerts and messages |
| Help | Tooltips, documentation |

## 8.2 Technical Implementation

### RTL Support
- CSS logical properties
- Tailwind RTL plugin
- Component-level RTL awareness
- Chart RTL support

### Font Strategy
- Arabic: Noto Sans Arabic, Cairo
- English: Inter, system fonts
- Mixed: Proper font stack

### Content Strategy
- i18n library (next-intl or similar)
- Translation files per language
- Fallback to English
- Interpolation for dynamic content

## 8.3 Cultural Adaptations

- Lebanese-specific terminology
- Local date formats
- Currency display preferences
- Receipt formatting
- Invoice templates

---

# 9. PHASE 9: CUSTOMER PORTAL & LOYALTY

**Duration:** 4-5 weeks  
**Status:** 📋 Planned  
**Priority:** MEDIUM

## 9.1 Customer-Facing Features

### Store Portal (Web)
- Store branding (logo, colors, description)
- Product catalog browsing
- Current promotions and deals
- Store information (hours, location)
- Contact options

### Customer Account
- Registration via phone/email
- View purchase history
- Check loyalty points
- View credit balance
- Digital receipts

### Price Scanner
- In-store price lookup
- Barcode scanning via phone camera
- Product information display
- Check availability

## 9.2 Loyalty Program

### Points System
- Earn points on purchases
- Configurable earning rate (e.g., 1 point per $1)
- Redeem points for discounts
- Points expiry (optional)
- Bonus points campaigns

### Tier System (Optional)
- Bronze, Silver, Gold, Platinum
- Tier-based benefits
- Auto-upgrade based on spending
- Retention rules

### Rewards
- Point redemption rules
- Discount coupons
- Free products
- Special offers

## 9.3 Mobile PWA Features

- Install on home screen
- Show loyalty barcode
- View points balance
- Push notifications for deals
- Reorder from history

## 9.4 Business Benefits

| Benefit | Description |
|---------|-------------|
| Customer Retention | Points keep customers coming back |
| Data Collection | Purchase behavior insights |
| Marketing Channel | Direct communication with customers |
| Competitive Edge | Differentiate from paper-only stores |

---

# 10. PHASE 10: WHATSAPP & COMMUNICATION HUB

**Duration:** 3-4 weeks  
**Status:** 📋 Planned  
**Priority:** HIGH

## 10.1 Why WhatsApp?

WhatsApp is the primary business communication channel in Lebanon. Most business interactions happen via WhatsApp:
- Supplier orders
- Customer inquiries
- Payment reminders
- Delivery coordination

## 10.2 WhatsApp Business API Integration

### Outbound Messages

| Message Type | Use Case |
|--------------|----------|
| Invoice Delivery | Send PDF invoice via WhatsApp |
| Payment Reminder | Automated collection reminders |
| Order Confirmation | Confirm customer orders |
| Delivery Updates | Shipment status |
| Promotional | Deals and offers (with consent) |

### Template Messages
- Pre-approved templates
- Variable substitution
- Multilingual support
- Compliance with WhatsApp policies

### Interactive Messages
- Quick reply buttons
- List selections
- Call-to-action buttons

## 10.3 Communication Hub Features

### Unified Inbox
- All channels in one place
- Customer conversation history
- Team assignments
- Status tracking

### Automated Workflows
- Payment reminder sequences
- Thank you after purchase
- Follow-up after delivery
- Birthday/anniversary messages

### Templates Library
- Invoice sent
- Payment received
- Payment reminder
- Order confirmation
- Low stock alert (internal)

## 10.4 Additional Channels

| Channel | Priority |
|---------|----------|
| WhatsApp | HIGH |
| SMS | MEDIUM |
| Email | MEDIUM |
| Push Notifications | LOW |

---

# 11. PHASE 11: EMPLOYEE & PAYROLL

**Duration:** 4-5 weeks  
**Status:** 📋 Planned  
**Priority:** LOW

## 11.1 Employee Management

### Employee Profile
- Personal information
- Employment details (start date, position)
- Salary information
- NSSF number
- Bank account (for transfers)
- Emergency contact

### Attendance Tracking
- Clock in/out via POS
- Shift scheduling
- Overtime calculation
- Late arrival tracking
- Absence management

### Permissions & Access
- Role-based access
- POS terminal restrictions
- Report access
- Feature access

## 11.2 Payroll Processing

### Salary Types
- Monthly salary
- Daily wage
- Hourly wage
- Commission-based

### Deductions
- NSSF employee share (3%)
- Advances
- Loans
- Absences

### Employer Contributions
- NSSF employer share (21.5%)
- End of service accrual

### Payment Methods
- Cash (USD, LBP, or split)
- Bank transfer
- OMT

## 11.3 Reports

| Report | Purpose |
|--------|---------|
| Payroll Summary | Total costs by period |
| NSSF Report | Form generation for submission |
| End of Service | Liability calculation |
| Employee Cost | Total cost per employee |
| Attendance Summary | Hours worked analysis |

## 11.4 Lebanese-Specific

- NSSF form generation
- End of service calculation (Lebanese law)
- USD/LBP salary splits
- Informal payment tracking

---

# 12. PHASE 12: MULTI-LOCATION & FRANCHISE

**Duration:** 5-6 weeks  
**Status:** 📋 Planned  
**Priority:** LOW

## 12.1 Multi-Location Features

### Location Management
- Multiple branches per tenant
- Location-specific settings
- Location-specific pricing
- Location hierarchy

### Inventory Per Location
- Stock per location
- Inter-location transfers
- Consolidated reporting
- Location-specific reorder

### Sales Per Location
- Location-specific POS
- Location-based reports
- Performance comparison
- Location dashboards

### User Access
- Location-restricted users
- Multi-location managers
- Cross-location visibility

## 12.2 Franchise Features (Future)

### Franchisor Dashboard
- All franchisee overview
- Sales reporting
- Royalty calculation
- Brand compliance

### Franchisee Features
- Standard product catalog
- Pricing guidelines
- Brand assets
- Reporting to franchisor

### Royalty Management
- Percentage of sales
- Fixed fees
- Automatic calculation
- Payment tracking

---

# 13. FUTURE VISION - LONG-TERM FEATURES

## 13.1 AI & Intelligence (Year 2+)

### Arabic Business Chatbot
- Natural language queries
- "كم بعت اليوم؟" → Sales summary
- "شو خلص؟" → Low stock
- "مين ما دفع؟" → Overdue invoices

### Smart Reordering
- Demand forecasting
- Seasonal patterns (Ramadan, holidays)
- Weather impact (future)
- Auto-generate purchase orders

### Anomaly Detection
- Unusual refund patterns
- Cash drawer discrepancies
- Suspicious discounts
- Inventory shrinkage

### Cashflow Prediction
- 30-day forecast
- Predict low cash periods
- Payment recommendations
- Collection suggestions

## 13.2 E-Commerce Integration (Year 2+)

### Online Store
- Product catalog online
- Online ordering
- Delivery management
- Payment integration

### Platform Integration
- Instagram Shop
- Facebook Marketplace
- Multi-channel inventory

## 13.3 Supplier Marketplace (Year 3+)

### Concept
- Connect stores with suppliers
- Browse supplier catalogs
- Order from multiple suppliers
- Commission-based revenue

### Benefits
- New revenue stream
- Supplier acquisition tool
- Better prices for stores

## 13.4 Financial Services (Year 3+)

### Concept
- Working capital loans based on business data
- Invoice factoring
- Payment processing
- Insurance products

### Partnership Model
- Partner with banks/fintechs
- Use transaction data for underwriting
- Referral commission

## 13.5 Industry Verticals (Year 2+)

### Restaurant Module
- Digital menu (QR code)
- Kitchen display system
- Table management
- Recipe & ingredient management
- Food cost calculation

### Pharmacy Module
- Batch tracking with regulations
- Prescription management
- Drug interaction warnings
- Insurance integration

---

# 14. TECHNICAL ARCHITECTURE SUMMARY

## 14.1 Current Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10 + TypeScript |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Frontend** | Next.js 14 (App Router) |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **State Management** | Zustand + TanStack Query |
| **Monorepo** | Turborepo + pnpm workspaces |
| **POS (Web)** | PWA with IndexedDB (Dexie.js) |
| **POS (Desktop)** | Electron + SQLite |
| **Auth** | JWT + Refresh Tokens |
| **Cache** | Redis |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Queue** | BullMQ |

## 14.2 Package Structure

```
accounting-saas/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Next.js frontend
│   ├── pos-web/          # POS PWA
│   └── pos-desktop/      # POS Electron
├── packages/
│   ├── shared/           # Types, constants, utils
│   ├── pos-core/         # Shared POS components
│   └── ui/               # Shared UI components
└── docs/                 # Documentation
```

## 14.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Drizzle | Type-safe, SQL-like, SQLite support |
| Framework | NestJS | Scalable, modular, good for SaaS |
| POS Architecture | Hybrid PWA + Electron | PWA for accessibility, Electron for hardware |
| Multi-tenancy | Row-level isolation | Simple, efficient, secure |
| Offline Strategy | Queue-based sync | Reliable, handles conflicts |
| OCR Approach | API-first | Start fast, self-host later |

## 14.4 Security Architecture

### Authentication
- JWT access tokens (15 min)
- Refresh token rotation
- Secure cookie storage

### Authorization
- Role-based access control (RBAC)
- Permission matrix per role
- Resource-level permissions

### Data Security
- Row-level tenant isolation
- Encrypted sensitive data
- Audit logging
- HTTPS only

### POS Security
- Time-based license tokens
- Signed sync payloads
- Local data encryption (Electron)
- Tamper detection

---

# 15. BUSINESS MODEL & MONETIZATION

## 15.1 Pricing Strategy

### Tiered Subscription Model

| Plan | Target | Price | Features |
|------|--------|-------|----------|
| **Starter** | Tiny shops, testing | $9/month | 1 user, 100 products, basic POS |
| **Business** | Small grocery, retail | $29/month | 3 users, unlimited products, full POS, reports |
| **Professional** | Supermarkets, larger | $59/month | 10 users, 2 locations, advanced inventory, AI |
| **Enterprise** | Chains, franchises | Custom | Unlimited, API, custom integrations |

### Add-Ons

| Add-On | Price |
|--------|-------|
| Additional location | $15/month |
| Additional users | $5/user/month |
| Advanced AI features | $20/month |
| Customer app/portal | $25/month |
| WhatsApp integration | $15/month |

## 15.2 Revenue Streams

### Primary
- Monthly subscriptions (SaaS model)

### Secondary
- Transaction fees (if payment processing added)
- Hardware sales (POS terminals, printers, scanners)
- Implementation & training fees
- Custom development

### Future
- Supplier marketplace commission
- Financial services referrals
- Data insights (anonymized, opt-in)
- White-label licensing

## 15.3 Pricing Considerations for Lebanon

**Challenges:**
- USD/LBP volatility
- Payment collection infrastructure
- Price sensitivity

**Strategies:**
- Price in USD (stable reference)
- Accept LBP at market rate
- Flexible payment methods (OMT, Whish)
- Annual discount for prepayment
- Free tier for adoption

---

# 16. GO-TO-MARKET STRATEGY

## 16.1 Launch Strategy

### Phase 1: Validation (Now)
- 5-10 pilot customers
- Direct sales approach
- Intensive support
- Rapid feedback iteration

### Phase 2: Early Adoption
- 50-100 customers
- Referral program
- Case studies
- Word of mouth focus

### Phase 3: Growth
- 500+ customers
- Marketing campaigns
- Partner channel
- Self-serve signup

## 16.2 Customer Acquisition

### Direct Sales
- Visit target businesses
- Demo on-site
- Free trial setup
- Hand-holding onboarding

### Referral Program
- Existing customer referrals
- Reward: Month free
- Network effects in neighborhoods

### Content Marketing
- Arabic business content
- YouTube tutorials
- Social media presence
- SEO for Arabic searches

### Partnerships
- Accountant partnerships (referral fee)
- Hardware suppliers
- Business associations
- Banks (potential future)

## 16.3 Customer Success

### Onboarding
- Data migration assistance
- Initial setup support
- Training sessions
- Arabic documentation

### Support
- WhatsApp support (primary)
- Phone support
- In-app chat
- Knowledge base

### Retention
- Regular check-ins
- Feature education
- Success reviews
- Upgrade paths

---

# 17. RISK ASSESSMENT & MITIGATION

## 17.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OCR accuracy issues | HIGH | MEDIUM | Multi-engine fallback, learning system |
| Offline sync conflicts | MEDIUM | HIGH | Clear conflict resolution rules, user notification |
| Scale bottlenecks | HIGH | LOW | Architecture review, load testing |
| Security breach | CRITICAL | LOW | Regular audits, encryption, monitoring |

## 17.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption | CRITICAL | MEDIUM | Aggressive onboarding support, free tier |
| Payment collection | HIGH | HIGH | Multiple payment methods, prepayment incentives |
| Competition | MEDIUM | MEDIUM | Feature differentiation, customer relationships |
| Economic conditions | HIGH | HIGH | Flexible pricing, essential features focus |

## 17.3 Market Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Currency volatility | MEDIUM | CERTAIN | USD pricing, auto-rate updates |
| Infrastructure issues | MEDIUM | CERTAIN | Offline-first architecture |
| Regulatory changes | LOW | LOW | Monitor, adapt quickly |
| Team capacity | HIGH | MEDIUM | Prioritization, AI assistance |

## 17.4 Mitigation Strategies

**For Adoption Risk:**
- Free tier to lower barrier
- Exceptional onboarding support
- Quick wins for new users
- Referral incentives

**For Payment Collection:**
- Multiple payment methods
- Annual prepayment discount
- Grace periods
- Relationship-based collection

**For Competition:**
- Deep Lebanese market understanding
- Features competitors can't easily copy
- Strong customer relationships
- Rapid iteration based on feedback

---

# 18. SUCCESS METRICS & KPIS

## 18.1 Business Metrics

### Acquisition
| Metric | Target (Year 1) |
|--------|-----------------|
| New signups/month | 50+ |
| Trial to paid conversion | >20% |
| Customer acquisition cost | <$50 |

### Engagement
| Metric | Target |
|--------|--------|
| Daily active users | >60% of paid |
| Transactions/day/user | >10 |
| Feature adoption rate | >50% |

### Retention
| Metric | Target |
|--------|--------|
| Monthly churn rate | <5% |
| Net revenue retention | >100% |
| Customer lifetime value | >$500 |

### Revenue
| Metric | Target (Year 1) |
|--------|-----------------|
| Monthly recurring revenue | $5,000+ |
| Average revenue per user | $25+ |
| Upgrade rate | >10%/quarter |

## 18.2 Product Metrics

### POS
| Metric | Target |
|--------|--------|
| Transaction completion rate | >99% |
| Average checkout time | <30 seconds |
| Offline transactions synced | 100% |

### OCR
| Metric | Target (After learning) |
|--------|------------------------|
| Auto-match rate | >80% |
| Extraction accuracy | >90% |
| Processing time | <30 seconds |

### General
| Metric | Target |
|--------|--------|
| Page load time | <2 seconds |
| API response time | <200ms |
| Error rate | <0.1% |
| Uptime | >99.9% |

## 18.3 Customer Satisfaction

| Metric | Target |
|--------|--------|
| Net Promoter Score (NPS) | >40 |
| Support ticket resolution | <24 hours |
| Customer satisfaction score | >4.5/5 |

---

# 19. TEAM & RESOURCE PLANNING

## 19.1 Current Team

| Role | Count | Focus |
|------|-------|-------|
| Founder/PM | 1 | Strategy, product, sales |
| Full-stack Developer | 1-2 | Core development |
| AI Assistant | 1 | Claude Code Opus 4.5 |

## 19.2 Recommended Additions (As Revenue Grows)

### Phase 1 (First 50 Customers)
- Customer Success (part-time)
- Arabic content creator (part-time)

### Phase 2 (50-200 Customers)
- Full-time customer success
- Sales/BD person
- Additional developer

### Phase 3 (200+ Customers)
- Support team
- Marketing
- Finance/Operations

## 19.3 Development Velocity

With AI-assisted development (Claude Code Opus 4.5):
- Boilerplate generation: 10x faster
- Code quality maintained
- Architecture decisions still human
- Testing and edge cases require attention

**Estimated Timeline:**

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 4: Export & POS | 6-8 weeks | In Progress |
| Phase 5: AI OCR | 4-5 weeks | Planned |
| Phase 6: Digital Daftar | 3-4 weeks | Planned |
| Phase 7: Advanced Inventory | 3-4 weeks | Planned |
| Phase 8: Arabic/RTL | 2-3 weeks | Planned |
| Phase 9: Customer Portal | 4-5 weeks | Planned |
| Phase 10: WhatsApp | 3-4 weeks | Planned |
| Phase 11: Employee/Payroll | 4-5 weeks | Future |
| Phase 12: Multi-Location | 5-6 weeks | Future |

**Total to Full Product:** ~35-45 weeks from now

---

# 20. APPENDIX: FEATURE PRIORITY MATRIX

## 20.1 Priority Framework

**Priority Scoring:**
- Business Impact (1-5)
- Customer Demand (1-5)
- Development Effort (1-5, lower is better)
- Strategic Alignment (1-5)

**Priority = (Impact + Demand + Alignment) / Effort**

## 20.2 Feature Priority List

### MUST HAVE (Phase 4-6)

| Feature | Impact | Demand | Effort | Alignment | Score | Phase |
|---------|--------|--------|--------|-----------|-------|-------|
| POS System | 5 | 5 | 4 | 5 | 3.75 | 4 |
| Export (PDF/Excel) | 4 | 5 | 2 | 4 | 6.5 | 4 |
| AI OCR | 5 | 5 | 4 | 5 | 3.75 | 5 |
| Customer Credit | 5 | 5 | 3 | 5 | 5.0 | 6 |
| Arabic RTL | 4 | 5 | 2 | 5 | 7.0 | 8 |

### SHOULD HAVE (Phase 7-9)

| Feature | Impact | Demand | Effort | Alignment | Score | Phase |
|---------|--------|--------|--------|-----------|-------|-------|
| Advanced Inventory | 4 | 4 | 3 | 4 | 4.0 | 7 |
| WhatsApp Integration | 4 | 5 | 3 | 4 | 4.3 | 10 |
| Customer Portal | 3 | 3 | 4 | 4 | 2.5 | 9 |
| Loyalty Program | 3 | 3 | 3 | 3 | 3.0 | 9 |

### NICE TO HAVE (Phase 10-12)

| Feature | Impact | Demand | Effort | Alignment | Score | Phase |
|---------|--------|--------|--------|-----------|-------|-------|
| Employee/Payroll | 3 | 2 | 4 | 3 | 2.0 | 11 |
| Multi-Location | 3 | 2 | 4 | 3 | 2.0 | 12 |
| Franchise Features | 2 | 1 | 5 | 3 | 1.2 | 12 |

### FUTURE VISION

| Feature | Notes |
|---------|-------|
| Arabic AI Chatbot | After OCR learning matures |
| E-commerce | After core stable |
| Supplier Marketplace | After scale |
| Financial Services | Partnership opportunity |

---

# CONCLUSION

This document represents the complete roadmap for the Lebanese Accounting SaaS platform. The vision is clear: become the operating system for Lebanese retail businesses.

**Key Success Factors:**
1. Execute Phase 4-6 flawlessly (POS, OCR, Credit)
2. Acquire 50+ paying customers in Year 1
3. Maintain relentless focus on Lebanese market reality
4. Use AI assistance effectively to move fast
5. Build strong customer relationships

**Next Immediate Actions:**
1. Complete Export functionality (Week 1-2)
2. Complete POS system with proper supermarket focus (Week 3-8)
3. Begin OCR development
4. Validate with pilot customers continuously

The market is waiting. The architecture is solid. The path is clear.

**Let's build.**

---

*Document Version: 2.0*  
*Last Updated: January 2026*  
*Next Review: After Phase 4 Completion*

---

# DOCUMENT CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial architecture documents |
| 2.0 | Jan 2026 | Complete roadmap with all phases, post Phase 1-3 completion |
