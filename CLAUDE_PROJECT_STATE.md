# Lebanese Accounting SaaS - Project State

## Overview
A multi-tenant accounting SaaS application for Lebanese businesses (specifically minimarkets/supermarkets) with dual currency support (USD/LBP), built with a monorepo architecture.

## Tech Stack
- **Monorepo**: pnpm workspaces + Turborepo
- **Backend**: NestJS + Drizzle ORM + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + React + TailwindCSS + shadcn/ui
- **State**: Zustand (for POS), React Query (for API)
- **Auth**: JWT with refresh tokens
- **Database**: PostgreSQL (port 5433)

## Project Structure
```
~/git/accounting-saas/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── pos-core/     # POS system shared package (for PWA + future Electron)
```

## Completed Phases

### Phase 1: Foundation ✅
- Multi-tenant architecture with subdomain/header support
- User authentication (JWT + refresh tokens)
- Database schema (tenants, users, contacts, categories, products)
- CRUD for contacts, categories, products
- Dual currency support (USD/LBP)

### Phase 2: Invoicing & Payments ✅
- Purchase invoices (draft → confirmed → paid flow)
- Supplier payments with multiple payment methods
- Money accounts (cash registers, bank accounts)
- Account movements tracking
- Exchange rates management
- Auto-generated invoice/payment numbers (sequences)

### Phase 3: Reports & Analytics ✅
- Profit & Loss report
- Supplier balances
- Supplier statement
- Expenses by category
- Payments due
- Cash flow report
- Inventory value & low stock reports
- Dashboard with summary widgets

### Phase 4: POS System (In Progress) 🔄
**Completed:**
- `pos-core` shared package with:
  - Types: Cart, Sale, Session, Payment, POSProduct
  - Zustand stores: cart-store, session-store, products-store, sync-store
  - Hooks: useBarcodeScan (USB scanner support), useProductLookup, useCart, useSession
  - Components: POSLayout, ScanInput, CartPanel, CartItem, TotalDisplay, PaymentModal, SessionModal, ProductSearch, UnknownBarcodeModal
  - Utils: currency formatting, receipt formatter
- POS page at `/pos` in web app
- 35 demo products seeded with barcodes

**Pending:**
- IndexedDB integration for offline-first
- Background sync for offline sales
- Receipt printing
- POS API endpoints (sessions, sales)

## Database Tables
- tenants, users, refresh_tokens
- contacts (suppliers/customers)
- categories, products
- money_accounts, account_movements
- invoices, invoice_items
- payments
- exchange_rates
- sequences

## Demo Credentials
- **Email**: demo@example.com
- **Password**: demo123
- **Tenant**: Demo Minimarket (slug: demo-minimarket)

## Key Files Modified Recently
- `apps/api/src/common/middleware/tenant.middleware.ts` - Fixed subdomain parsing bug
- `apps/api/src/database/seed.ts` - Added comprehensive seed data
- `apps/web/src/app/(dashboard)/pos/page.tsx` - POS page with terminal config
- `packages/pos-core/src/*` - All POS core components

## Known Issues Fixed
1. **Tenant middleware bug**: Was incorrectly parsing `localhost:3001` as subdomain. Fixed to properly check host parts vs domain parts before extracting subdomain.

## Running the Project
```bash
cd ~/git/accounting-saas
pnpm install
pnpm dev           # Runs API + Web + packages in watch mode
pnpm dev:studio    # Runs dev + Drizzle Studio
```

## API Endpoints
All endpoints require JWT auth + X-Tenant-Slug header (or subdomain)
- POST /api/auth/login, /api/auth/register, /api/auth/refresh
- CRUD: /api/contacts, /api/categories, /api/products, /api/invoices, /api/payments
- GET /api/products/barcode/:barcode
- GET /api/exchange-rates/current
- GET /api/dashboard/summary, /api/reports/*

## Next Steps (POS Phase 4)
1. Add POS API endpoints:
   - POST /api/pos/sessions (open/close shift)
   - POST /api/pos/sales (record sale)
   - GET /api/pos/sessions/:id/summary
2. Implement IndexedDB for offline product cache
3. Add service worker for offline sales queue
4. Receipt printing integration
5. End-to-end POS testing

## Environment
- WSL2 Ubuntu with 12GB RAM, 4 CPUs
- PostgreSQL on port 5433
- Redis on port 6380
- Node.js v22.x
