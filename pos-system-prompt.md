# POS System Implementation - Supermarket/Minimarket Focus
## Claude Code Prompt - Phase 4

---

## Context

This is for a Lebanese Accounting SaaS. The POS system is for **supermarkets and minimarkets** (NOT restaurants).

**Key Differences from Restaurant POS:**
- Primary input: **Barcode Scanner** (not touch grid)
- Products: 500-10,000+ items (impossible to browse)
- Speed: Scan → Add → Scan → Add → Pay
- No menu customization, no kitchen display

**Lebanese Reality:**
- Frequent power outages (need true offline)
- Unreliable internet (need local database)
- Dual currency: USD and LBP
- USB barcode scanners (keyboard emulation)
- Thermal receipt printers (ESC/POS)

---

## Architecture: Shared Code + Two Deployments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE OVERVIEW                                │
└─────────────────────────────────────────────────────────────────────────────┘

packages/
└── pos-core/                    # SHARED CODE (used by both)
    ├── stores/                  # Zustand stores (cart, session, sync)
    ├── hooks/                   # Shared React hooks
    ├── components/              # POS UI components
    ├── services/                # Business logic (sale, payment, sync)
    ├── types/                   # TypeScript types
    └── utils/                   # Utilities (currency, receipt format)

apps/
├── web/                         # Existing Next.js app
│   └── app/(dashboard)/pos/     # PWA POS (for testing/light use)
│
└── pos-desktop/                 # NEW: Electron app
    ├── main/                    # Electron main process
    │   ├── index.ts             # App entry
    │   ├── database.ts          # SQLite connection
    │   ├── sync.ts              # Background sync service
    │   ├── printer.ts           # ESC/POS printer service
    │   └── ipc-handlers.ts      # IPC handlers
    ├── preload/                 # Preload scripts
    │   └── index.ts             # Expose APIs to renderer
    ├── renderer/                # Uses shared pos-core
    │   └── index.html           # Entry point
    └── package.json
```

---

## Part A: Shared POS Core Package

### A1. Package Setup

```
packages/pos-core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # Export all
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── product.ts           # Product, Category types
│   │   ├── sale.ts              # Sale, SaleItem, Payment types
│   │   ├── session.ts           # Session, CashMovement types
│   │   └── sync.ts              # SyncQueue, SyncStatus types
│   │
│   ├── stores/
│   │   ├── index.ts
│   │   ├── cart-store.ts        # Cart state (items, customer, discount)
│   │   ├── session-store.ts     # Current session state
│   │   ├── products-store.ts    # Local products cache
│   │   └── sync-store.ts        # Sync queue state
│   │
│   ├── services/
│   │   ├── index.ts
│   │   ├── sale-service.ts      # Create sale, void, return
│   │   ├── payment-service.ts   # Payment calculation, change
│   │   ├── receipt-service.ts   # Format receipt data
│   │   └── sync-service.ts      # Sync logic (abstract)
│   │
│   ├── components/
│   │   ├── index.ts
│   │   ├── POSLayout.tsx        # Main POS layout
│   │   ├── ScanInput.tsx        # Barcode/PLU input field
│   │   ├── CartPanel.tsx        # Cart items list
│   │   ├── CartItem.tsx         # Single cart item row
│   │   ├── TotalDisplay.tsx     # Subtotal, tax, total (USD + LBP)
│   │   ├── PaymentModal.tsx     # Payment dialog
│   │   ├── CashPayment.tsx      # Cash payment with change calc
│   │   ├── SessionModal.tsx     # Open/close session
│   │   ├── UnknownBarcodeModal.tsx  # Link unknown barcode
│   │   ├── ProductSearch.tsx    # Search for PLU/unknown
│   │   ├── QuantityModal.tsx    # Adjust quantity
│   │   ├── DiscountModal.tsx    # Apply discount
│   │   ├── VoidModal.tsx        # Void item/sale
│   │   ├── CustomerDisplay.tsx  # What customer sees
│   │   └── ReceiptPreview.tsx   # Receipt before print
│   │
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useBarcodeScan.ts    # Listen for scanner input
│   │   ├── useProductLookup.ts  # Find product by barcode/PLU
│   │   ├── useCart.ts           # Cart operations
│   │   ├── usePayment.ts        # Payment flow
│   │   ├── useSession.ts        # Session management
│   │   └── useOfflineStatus.ts  # Online/offline detection
│   │
│   └── utils/
│       ├── index.ts
│       ├── currency.ts          # USD/LBP conversion, formatting
│       ├── receipt-formatter.ts # Format receipt text
│       ├── barcode-parser.ts    # Parse barcode types
│       └── sound.ts             # Beep sounds (success/error)
```

### A2. Core Types

```typescript
// packages/pos-core/src/types/sale.ts

export interface CartItem {
  id: string;                    // Unique cart line ID
  productId: string;
  barcode: string | null;
  name: string;
  nameAr: string | null;
  quantity: number;
  unitPrice: number;             // In sale currency
  currency: 'USD' | 'LBP';
  discountPercent: number;
  lineTotal: number;
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  discountPercent: number;       // Order-level discount
  discountAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;          // LBP per USD
  totalLBP: number;              // Always show LBP equivalent
}

export interface Payment {
  method: 'cash_usd' | 'cash_lbp' | 'card' | 'mixed';
  amountUSD: number;
  amountLBP: number;
  cashReceivedUSD: number;
  cashReceivedLBP: number;
  changeUSD: number;
  changeLBP: number;
  exchangeRate: number;
}

export interface Sale {
  id: string;
  localId: string;               // Client-generated UUID
  receiptNumber: string;
  terminalId: string;
  sessionId: string;
  
  items: SaleItem[];
  
  customerId: string | null;
  
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  totalLBP: number;
  
  payment: Payment;
  
  status: 'completed' | 'voided' | 'returned';
  voidReason: string | null;
  
  cashierId: string;
  cashierName: string;
  
  createdAt: Date;
  syncedAt: Date | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SaleItem {
  id: string;
  productId: string;
  barcode: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}
```

```typescript
// packages/pos-core/src/types/session.ts

export interface POSSession {
  id: string;
  localId: string;
  terminalId: string;
  terminalCode: string;
  
  cashierId: string;
  cashierName: string;
  
  openedAt: Date;
  closedAt: Date | null;
  
  // Opening cash counts
  openingCashUSD: number;
  openingCashLBP: number;
  
  // Closing cash counts (filled when closing)
  closingCashUSD: number | null;
  closingCashLBP: number | null;
  
  // Expected (calculated from sales)
  expectedCashUSD: number;
  expectedCashLBP: number;
  
  // Difference
  differenceUSD: number | null;
  differenceLBP: number | null;
  
  // Totals
  totalSales: number;
  totalReturns: number;
  totalTransactions: number;
  
  status: 'open' | 'closed';
  
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface CashMovement {
  id: string;
  localId: string;
  sessionId: string;
  type: 'cash_in' | 'cash_out';
  amountUSD: number;
  amountLBP: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}
```

### A3. Cart Store (Zustand)

```typescript
// packages/pos-core/src/stores/cart-store.ts

import { create } from 'zustand';
import { CartItem, Cart, Payment } from '../types';
import { calculateTotals, convertToLBP } from '../utils/currency';

interface CartState {
  cart: Cart;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemDiscount: (itemId: string, percent: number) => void;
  setOrderDiscount: (percent: number) => void;
  setCustomer: (customerId: string | null, name: string | null) => void;
  setExchangeRate: (rate: number) => void;
  clearCart: () => void;
  
  // Computed
  getItemCount: () => number;
  isEmpty: () => boolean;
}

const initialCart: Cart = {
  items: [],
  customerId: null,
  customerName: null,
  discountPercent: 0,
  discountAmount: 0,
  subtotal: 0,
  taxRate: 0,         // Lebanon: usually 11% TVA, but many small shops don't charge
  taxAmount: 0,
  total: 0,
  currency: 'USD',
  exchangeRate: 89500, // Default, should be fetched
  totalLBP: 0,
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: initialCart,
  
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.productId === product.id
      );
      
      let newItems: CartItem[];
      
      if (existingItem) {
        // Increase quantity
        newItems = state.cart.items.map((item) =>
          item.productId === product.id
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                lineTotal: (item.quantity + quantity) * item.unitPrice * (1 - item.discountPercent / 100)
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          nameAr: product.nameAr,
          quantity,
          unitPrice: product.sellingPrice,
          currency: product.sellingCurrency || 'USD',
          discountPercent: 0,
          lineTotal: quantity * product.sellingPrice,
          addedAt: new Date(),
        };
        newItems = [...state.cart.items, newItem];
      }
      
      return {
        cart: calculateTotals({ ...state.cart, items: newItems }),
      };
    });
  },
  
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    
    set((state) => {
      const newItems = state.cart.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice * (1 - item.discountPercent / 100),
            }
          : item
      );
      
      return {
        cart: calculateTotals({ ...state.cart, items: newItems }),
      };
    });
  },
  
  removeItem: (itemId) => {
    set((state) => {
      const newItems = state.cart.items.filter((item) => item.id !== itemId);
      return {
        cart: calculateTotals({ ...state.cart, items: newItems }),
      };
    });
  },
  
  setItemDiscount: (itemId, percent) => {
    set((state) => {
      const newItems = state.cart.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              discountPercent: percent,
              lineTotal: item.quantity * item.unitPrice * (1 - percent / 100),
            }
          : item
      );
      
      return {
        cart: calculateTotals({ ...state.cart, items: newItems }),
      };
    });
  },
  
  setOrderDiscount: (percent) => {
    set((state) => ({
      cart: calculateTotals({ ...state.cart, discountPercent: percent }),
    }));
  },
  
  setCustomer: (customerId, name) => {
    set((state) => ({
      cart: { ...state.cart, customerId, customerName: name },
    }));
  },
  
  setExchangeRate: (rate) => {
    set((state) => ({
      cart: calculateTotals({ ...state.cart, exchangeRate: rate }),
    }));
  },
  
  clearCart: () => {
    set({ cart: initialCart });
  },
  
  getItemCount: () => {
    return get().cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
  
  isEmpty: () => {
    return get().cart.items.length === 0;
  },
}));
```

### A4. Barcode Scanner Hook

```typescript
// packages/pos-core/src/hooks/useBarcodeScan.ts

import { useEffect, useCallback, useRef } from 'react';

interface UseBarcodeScanOptions {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  minLength?: number;        // Minimum barcode length (default: 4)
  maxDelay?: number;         // Max ms between keystrokes (default: 50)
  enabled?: boolean;
}

/**
 * USB Barcode Scanner Hook
 * 
 * USB barcode scanners work as keyboard emulation.
 * They type the barcode very fast and press Enter at the end.
 * 
 * This hook detects rapid keystrokes followed by Enter.
 */
export function useBarcodeScan({
  onScan,
  onError,
  minLength = 4,
  maxDelay = 50,
  enabled = true,
}: UseBarcodeScanOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Ignore if focus is on an input field (let user type normally)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: if it's our scan input, let it through
        if (!target.dataset.scanInput) {
          return;
        }
      }
      
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      
      // If too much time passed, reset buffer
      if (timeDiff > maxDelay && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }
      
      lastKeyTimeRef.current = now;
      
      // Handle Enter key
      if (event.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          // Valid barcode!
          event.preventDefault();
          onScan(bufferRef.current);
        }
        bufferRef.current = '';
        return;
      }
      
      // Handle regular characters
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        bufferRef.current += event.key;
        
        // Prevent buffer from growing too large
        if (bufferRef.current.length > 50) {
          bufferRef.current = bufferRef.current.slice(-50);
        }
      }
    },
    [enabled, minLength, maxDelay, onScan]
  );
  
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
  
  // Manual scan function (for on-screen input)
  const manualScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength) {
        onScan(barcode);
      } else {
        onError?.(`Barcode too short (minimum ${minLength} characters)`);
      }
    },
    [minLength, onScan, onError]
  );
  
  return { manualScan };
}
```

### A5. Main POS Components

```typescript
// packages/pos-core/src/components/POSLayout.tsx

import React, { useState, useCallback } from 'react';
import { useCartStore } from '../stores/cart-store';
import { useSessionStore } from '../stores/session-store';
import { useBarcodeScan } from '../hooks/useBarcodeScan';
import { useProductLookup } from '../hooks/useProductLookup';
import { ScanInput } from './ScanInput';
import { CartPanel } from './CartPanel';
import { TotalDisplay } from './TotalDisplay';
import { PaymentModal } from './PaymentModal';
import { UnknownBarcodeModal } from './UnknownBarcodeModal';
import { SessionModal } from './SessionModal';
import { playSound } from '../utils/sound';

interface POSLayoutProps {
  // Platform-specific handlers
  onPrint?: (receiptData: ReceiptData) => Promise<void>;
  onOpenCashDrawer?: () => Promise<void>;
  onSync?: () => Promise<void>;
  
  // Platform info
  isElectron?: boolean;
  isOnline?: boolean;
}

export function POSLayout({
  onPrint,
  onOpenCashDrawer,
  onSync,
  isElectron = false,
  isOnline = true,
}: POSLayoutProps) {
  const { cart, addItem, clearCart } = useCartStore();
  const { session } = useSessionStore();
  
  const [showPayment, setShowPayment] = useState(false);
  const [showUnknownBarcode, setShowUnknownBarcode] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showSession, setShowSession] = useState(false);
  
  const { lookupProduct, isLoading } = useProductLookup();
  
  // Handle barcode scan
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      // Check if session is open
      if (!session || session.status !== 'open') {
        playSound('error');
        setShowSession(true);
        return;
      }
      
      const result = await lookupProduct(barcode);
      
      if (result.found) {
        // Product found - add to cart
        addItem(result.product);
        playSound('success');
      } else if (result.pendingLink) {
        // Barcode has pending link - use it but show warning
        addItem(result.product);
        playSound('warning');
        // Could show a subtle indicator
      } else {
        // Unknown barcode
        playSound('error');
        setUnknownBarcode(barcode);
        setShowUnknownBarcode(true);
      }
    },
    [session, lookupProduct, addItem]
  );
  
  // Listen for scanner input
  useBarcodeScan({
    onScan: handleBarcodeScan,
    enabled: !showPayment && !showUnknownBarcode && !showSession,
  });
  
  // Handle payment completion
  const handlePaymentComplete = useCallback(
    async (payment: Payment) => {
      // Create sale, print receipt, etc.
      // This will be handled by the platform-specific implementation
      setShowPayment(false);
      clearCart();
      
      if (onOpenCashDrawer) {
        await onOpenCashDrawer();
      }
    },
    [clearCart, onOpenCashDrawer]
  );
  
  // Handle unknown barcode linked
  const handleBarcodeLinked = useCallback(
    (product: Product) => {
      addItem(product);
      setShowUnknownBarcode(false);
      setUnknownBarcode(null);
      playSound('success');
    },
    [addItem]
  );
  
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">POS</h1>
          {session && (
            <span className="text-sm text-gray-600">
              {session.terminalCode} | {session.cashierName}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sync status */}
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          
          {/* Session button */}
          <button
            onClick={() => setShowSession(true)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            {session?.status === 'open' ? 'Close Shift' : 'Open Shift'}
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Scan Input Area */}
        <div className="flex-1 flex flex-col p-4">
          {/* Large Scan Input */}
          <ScanInput
            onSubmit={handleBarcodeScan}
            disabled={!session || session.status !== 'open'}
            placeholder="Scan barcode or enter PLU..."
            autoFocus
          />
          
          {/* Instructions */}
          <div className="mt-4 text-center text-gray-500">
            <p className="text-lg">Scan product barcode</p>
            <p className="text-sm mt-2">
              Or type PLU code and press Enter
            </p>
          </div>
          
          {/* Keyboard shortcuts */}
          <div className="mt-auto text-sm text-gray-400">
            <p><kbd className="px-1 border rounded">F2</kbd> Search Product</p>
            <p><kbd className="px-1 border rounded">F4</kbd> Hold Sale</p>
            <p><kbd className="px-1 border rounded">F8</kbd> Void Last Item</p>
            <p><kbd className="px-1 border rounded">F12</kbd> Pay</p>
          </div>
        </div>
        
        {/* Right: Cart Panel */}
        <div className="w-96 bg-white border-l flex flex-col">
          <CartPanel />
          
          <div className="border-t p-4">
            <TotalDisplay
              subtotal={cart.subtotal}
              discount={cart.discountAmount}
              tax={cart.taxAmount}
              total={cart.total}
              totalLBP={cart.totalLBP}
              currency={cart.currency}
            />
            
            {/* Pay Button */}
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.items.length === 0 || !session || session.status !== 'open'}
              className="w-full mt-4 py-4 bg-green-600 text-white text-xl font-bold rounded-lg
                         hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              PAY ${cart.total.toFixed(2)}
            </button>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          onComplete={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
        />
      )}
      
      {showUnknownBarcode && unknownBarcode && (
        <UnknownBarcodeModal
          barcode={unknownBarcode}
          onLink={handleBarcodeLinked}
          onCancel={() => {
            setShowUnknownBarcode(false);
            setUnknownBarcode(null);
          }}
        />
      )}
      
      {showSession && (
        <SessionModal
          currentSession={session}
          onClose={() => setShowSession(false)}
        />
      )}
    </div>
  );
}
```

```typescript
// packages/pos-core/src/components/ScanInput.tsx

import React, { useRef, useEffect } from 'react';

interface ScanInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ScanInput({
  onSubmit,
  disabled = false,
  placeholder = 'Scan barcode...',
  autoFocus = true,
}: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keep focus on input
  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);
  
  // Refocus when clicking anywhere (supermarket POS behavior)
  useEffect(() => {
    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [disabled]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim();
      if (value) {
        onSubmit(value);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }
  };
  
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        data-scan-input="true"
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-4 text-2xl border-2 border-blue-500 rounded-lg
                   focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200
                   disabled:bg-gray-100 disabled:border-gray-300"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </div>
    </div>
  );
}
```

```typescript
// packages/pos-core/src/components/CartPanel.tsx

import React from 'react';
import { useCartStore } from '../stores/cart-store';
import { CartItem } from './CartItem';
import { formatCurrency } from '../utils/currency';

export function CartPanel() {
  const { cart, updateQuantity, removeItem, setItemDiscount } = useCartStore();
  
  if (cart.items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Cart is empty</p>
          <p className="text-sm">Scan items to add</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-2">
        <div className="text-sm text-gray-500 mb-2">
          {cart.items.length} item(s)
        </div>
        
        {cart.items.map((item, index) => (
          <CartItem
            key={item.id}
            item={item}
            index={index + 1}
            onQuantityChange={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
            onDiscountChange={(pct) => setItemDiscount(item.id, pct)}
          />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// packages/pos-core/src/components/CartItem.tsx

import React from 'react';
import { CartItem as CartItemType } from '../types';
import { formatCurrency } from '../utils/currency';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onDiscountChange: (percent: number) => void;
}

export function CartItem({
  item,
  index,
  onQuantityChange,
  onRemove,
  onDiscountChange,
}: CartItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-1 hover:bg-gray-100">
      {/* Index */}
      <span className="w-6 text-center text-sm text-gray-400">{index}</span>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {item.nameAr && (
          <div className="text-sm text-gray-500 truncate" dir="rtl">{item.nameAr}</div>
        )}
        <div className="text-sm text-gray-500">
          {formatCurrency(item.unitPrice, item.currency)} × {item.quantity}
          {item.discountPercent > 0 && (
            <span className="text-red-500 ml-2">-{item.discountPercent}%</span>
          )}
        </div>
      </div>
      
      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(item.quantity - 1)}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
        >
          −
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
        >
          +
        </button>
      </div>
      
      {/* Line Total */}
      <div className="w-20 text-right font-bold">
        {formatCurrency(item.lineTotal, item.currency)}
      </div>
      
      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
      >
        ×
      </button>
    </div>
  );
}
```

```typescript
// packages/pos-core/src/components/PaymentModal.tsx

import React, { useState, useEffect } from 'react';
import { Cart, Payment } from '../types';
import { formatCurrency, calculateChange } from '../utils/currency';

interface PaymentModalProps {
  cart: Cart;
  onComplete: (payment: Payment) => void;
  onCancel: () => void;
}

export function PaymentModal({ cart, onComplete, onCancel }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash_usd' | 'cash_lbp' | 'mixed'>('cash_usd');
  const [cashReceivedUSD, setCashReceivedUSD] = useState<string>('');
  const [cashReceivedLBP, setCashReceivedLBP] = useState<string>('');
  
  // Quick cash buttons
  const quickAmountsUSD = [5, 10, 20, 50, 100];
  const quickAmountsLBP = [100000, 500000, 1000000, 2000000, 5000000];
  
  // Calculate change
  const receivedUSD = parseFloat(cashReceivedUSD) || 0;
  const receivedLBP = parseFloat(cashReceivedLBP) || 0;
  
  const change = calculateChange({
    totalUSD: cart.total,
    totalLBP: cart.totalLBP,
    receivedUSD,
    receivedLBP,
    exchangeRate: cart.exchangeRate,
    preferredChangeCurrency: 'LBP', // Lebanese preference
  });
  
  const canComplete = change.totalReceivedUSD >= cart.total;
  
  const handleComplete = () => {
    if (!canComplete) return;
    
    const payment: Payment = {
      method: paymentMethod,
      amountUSD: cart.total,
      amountLBP: cart.totalLBP,
      cashReceivedUSD: receivedUSD,
      cashReceivedLBP: receivedLBP,
      changeUSD: change.changeUSD,
      changeLBP: change.changeLBP,
      exchangeRate: cart.exchangeRate,
    };
    
    onComplete(payment);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && canComplete) {
        handleComplete();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canComplete, onCancel]);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Payment</h2>
        </div>
        
        {/* Total */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(cart.total, 'USD')}
            </div>
            <div className="text-lg text-gray-600">
              {formatCurrency(cart.totalLBP, 'LBP')}
            </div>
          </div>
        </div>
        
        {/* Payment Method */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('cash_usd')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'cash_usd' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              Cash USD
            </button>
            <button
              onClick={() => setPaymentMethod('cash_lbp')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'cash_lbp' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              Cash LBP
            </button>
            <button
              onClick={() => setPaymentMethod('mixed')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'mixed' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              Mixed
            </button>
          </div>
        </div>
        
        {/* Cash Input */}
        <div className="p-4 space-y-4">
          {/* USD Input */}
          {(paymentMethod === 'cash_usd' || paymentMethod === 'mixed') && (
            <div>
              <label className="block text-sm font-medium mb-1">Cash Received (USD)</label>
              <input
                type="number"
                value={cashReceivedUSD}
                onChange={(e) => setCashReceivedUSD(e.target.value)}
                className="w-full px-3 py-2 border rounded text-lg"
                placeholder="0.00"
                autoFocus={paymentMethod === 'cash_usd'}
              />
              <div className="flex gap-2 mt-2">
                {quickAmountsUSD.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceivedUSD(amount.toString())}
                    className="flex-1 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  onClick={() => setCashReceivedUSD(cart.total.toFixed(2))}
                  className="flex-1 py-1 text-sm border rounded bg-green-50 hover:bg-green-100 text-green-700"
                >
                  Exact
                </button>
              </div>
            </div>
          )}
          
          {/* LBP Input */}
          {(paymentMethod === 'cash_lbp' || paymentMethod === 'mixed') && (
            <div>
              <label className="block text-sm font-medium mb-1">Cash Received (LBP)</label>
              <input
                type="number"
                value={cashReceivedLBP}
                onChange={(e) => setCashReceivedLBP(e.target.value)}
                className="w-full px-3 py-2 border rounded text-lg"
                placeholder="0"
                autoFocus={paymentMethod === 'cash_lbp'}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {quickAmountsLBP.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceivedLBP(amount.toString())}
                    className="py-1 px-2 text-sm border rounded hover:bg-gray-50"
                  >
                    {(amount / 1000).toFixed(0)}K
                  </button>
                ))}
                <button
                  onClick={() => setCashReceivedLBP(Math.ceil(cart.totalLBP / 1000) * 1000 + '')}
                  className="py-1 px-2 text-sm border rounded bg-green-50 hover:bg-green-100 text-green-700"
                >
                  Round Up
                </button>
              </div>
            </div>
          )}
          
          {/* Change Display */}
          <div className={`p-4 rounded-lg ${canComplete ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-sm text-gray-600 mb-1">
              {canComplete ? 'Change Due:' : 'Amount Due:'}
            </div>
            <div className="text-2xl font-bold">
              {canComplete ? (
                <>
                  {change.changeUSD > 0 && (
                    <span className="text-green-600 mr-2">
                      {formatCurrency(change.changeUSD, 'USD')}
                    </span>
                  )}
                  {change.changeLBP > 0 && (
                    <span className="text-green-600">
                      {formatCurrency(change.changeLBP, 'LBP')}
                    </span>
                  )}
                  {change.changeUSD === 0 && change.changeLBP === 0 && (
                    <span className="text-green-600">Exact Amount</span>
                  )}
                </>
              ) : (
                <span className="text-red-600">
                  {formatCurrency(cart.total - change.totalReceivedUSD, 'USD')} remaining
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel (Esc)
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold
                       hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Complete (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// packages/pos-core/src/components/UnknownBarcodeModal.tsx

import React, { useState } from 'react';
import { Product } from '../types';
import { ProductSearch } from './ProductSearch';

interface UnknownBarcodeModalProps {
  barcode: string;
  onLink: (product: Product) => void;
  onCancel: () => void;
}

export function UnknownBarcodeModal({ barcode, onLink, onCancel }: UnknownBarcodeModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const handleLink = () => {
    if (!selectedProduct) return;
    
    // This will create a pending barcode link
    // The barcode will be linked to this product (pending manager verification)
    onLink(selectedProduct);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold">Unknown Barcode</h2>
          </div>
        </div>
        
        {/* Barcode Display */}
        <div className="p-4 border-b">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Scanned Barcode:</div>
            <div className="text-2xl font-mono font-bold">{barcode}</div>
          </div>
        </div>
        
        {/* Product Search */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Search for the product to link this barcode. The link will be saved for future scans.
          </p>
          
          <ProductSearch
            onSelect={setSelectedProduct}
            selectedProduct={selectedProduct}
          />
          
          {selectedProduct && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="font-medium">{selectedProduct.name}</div>
              {selectedProduct.nameAr && (
                <div className="text-sm text-gray-600" dir="rtl">{selectedProduct.nameAr}</div>
              )}
              <div className="text-sm text-gray-600">
                Price: ${selectedProduct.sellingPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>
        
        {/* Note about verification */}
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            ⚠️ This link will be pending manager verification. The sale will continue normally.
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedProduct}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold
                       hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Link & Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Part B: PWA Version (apps/web)

### B1. PWA POS Page

```typescript
// apps/web/app/(dashboard)/pos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { POSLayout } from '@accounting/pos-core';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function POSPage() {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading POS...</div>;
  }
  
  return (
    <POSLayout
      isElectron={false}
      isOnline={isOnline}
      onPrint={async (receiptData) => {
        // PWA: Open print dialog or send to print server
        window.print();
      }}
      onOpenCashDrawer={async () => {
        // PWA: May not be able to open cash drawer
        console.log('Cash drawer not available in PWA mode');
      }}
      onSync={async () => {
        // PWA: Sync via API
      }}
    />
  );
}
```

### B2. PWA Local Database (IndexedDB)

```typescript
// apps/web/lib/pos-db.ts

import Dexie, { Table } from 'dexie';

interface LocalProduct {
  id: string;
  barcode: string | null;
  name: string;
  nameAr: string | null;
  sellingPrice: number;
  sellingCurrency: string;
  categoryId: string | null;
  syncedAt: Date;
}

interface LocalSale {
  id: string;
  localId: string;
  data: any; // Full sale object
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  syncedAt: Date | null;
}

interface LocalSession {
  id: string;
  localId: string;
  data: any;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
}

interface PendingBarcodeLink {
  barcode: string;
  productId: string;
  linkedAt: Date;
  syncStatus: 'pending' | 'synced';
}

class POSDatabase extends Dexie {
  products!: Table<LocalProduct>;
  sales!: Table<LocalSale>;
  sessions!: Table<LocalSession>;
  pendingBarcodeLinks!: Table<PendingBarcodeLink>;
  
  constructor() {
    super('pos-db');
    
    this.version(1).stores({
      products: 'id, barcode, name, categoryId',
      sales: 'id, localId, syncStatus, createdAt',
      sessions: 'id, localId, syncStatus',
      pendingBarcodeLinks: 'barcode, productId, syncStatus',
    });
  }
}

export const posDb = new POSDatabase();

// Sync products from server
export async function syncProducts(apiProducts: any[]) {
  await posDb.products.clear();
  await posDb.products.bulkAdd(
    apiProducts.map((p) => ({
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      nameAr: p.nameAr,
      sellingPrice: p.sellingPrice,
      sellingCurrency: p.sellingCurrency,
      categoryId: p.categoryId,
      syncedAt: new Date(),
    }))
  );
}

// Lookup product by barcode
export async function lookupProductByBarcode(barcode: string) {
  // First check approved barcodes
  const product = await posDb.products.where('barcode').equals(barcode).first();
  if (product) {
    return { found: true, product, pendingLink: false };
  }
  
  // Check pending barcode links
  const pendingLink = await posDb.pendingBarcodeLinks
    .where('barcode')
    .equals(barcode)
    .first();
  
  if (pendingLink) {
    const linkedProduct = await posDb.products.get(pendingLink.productId);
    if (linkedProduct) {
      return { found: true, product: linkedProduct, pendingLink: true };
    }
  }
  
  return { found: false, product: null, pendingLink: false };
}

// Save pending barcode link
export async function savePendingBarcodeLink(barcode: string, productId: string) {
  await posDb.pendingBarcodeLinks.put({
    barcode,
    productId,
    linkedAt: new Date(),
    syncStatus: 'pending',
  });
}

// Queue sale for sync
export async function queueSale(sale: any) {
  await posDb.sales.add({
    id: sale.id,
    localId: sale.localId,
    data: sale,
    syncStatus: 'pending',
    createdAt: new Date(),
    syncedAt: null,
  });
}

// Get pending sales to sync
export async function getPendingSales() {
  return posDb.sales.where('syncStatus').equals('pending').toArray();
}

// Mark sale as synced
export async function markSaleSynced(localId: string, serverId: string) {
  await posDb.sales.where('localId').equals(localId).modify({
    id: serverId,
    syncStatus: 'synced',
    syncedAt: new Date(),
  });
}
```

---

## Part C: Electron Desktop App

### C1. Electron Project Structure

```
apps/pos-desktop/
├── package.json
├── tsconfig.json
├── electron-builder.json
│
├── main/                        # Main process (Node.js)
│   ├── index.ts                 # Entry point
│   ├── window.ts                # Window management
│   ├── database.ts              # SQLite database
│   ├── sync-service.ts          # Background sync
│   ├── printer-service.ts       # ESC/POS printing
│   ├── hardware-service.ts      # Cash drawer, etc.
│   └── ipc-handlers.ts          # IPC communication
│
├── preload/
│   └── index.ts                 # Bridge between main and renderer
│
├── renderer/                    # Renderer process (React)
│   ├── index.html
│   ├── index.tsx
│   └── App.tsx                  # Uses @accounting/pos-core
│
└── resources/                   # Icons, etc.
```

### C2. Package.json

```json
{
  "name": "@accounting/pos-desktop",
  "version": "1.0.0",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "tsc -p tsconfig.main.json --watch",
    "dev:renderer": "vite",
    "build": "npm run build:main && npm run build:renderer",
    "build:main": "tsc -p tsconfig.main.json",
    "build:renderer": "vite build",
    "package": "electron-builder",
    "start": "electron ."
  },
  "dependencies": {
    "@accounting/pos-core": "workspace:*",
    "@accounting/shared": "workspace:*",
    "better-sqlite3": "^9.0.0",
    "electron-store": "^8.1.0",
    "escpos": "^3.0.0-alpha.6",
    "escpos-usb": "^3.0.0-alpha.4"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "concurrently": "^8.2.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### C3. Main Process - Entry

```typescript
// apps/pos-desktop/main/index.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, getDatabase } from './database';
import { initSyncService } from './sync-service';
import { initPrinterService } from './printer-service';
import { registerIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Fullscreen for POS
    fullscreen: false, // Set true for production
    autoHideMenuBar: true,
  });
  
  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

async function initialize() {
  // Initialize SQLite database
  await initDatabase();
  
  // Initialize background sync
  await initSyncService();
  
  // Initialize printer service
  await initPrinterService();
  
  // Register IPC handlers
  registerIpcHandlers();
}

app.whenReady().then(async () => {
  await initialize();
  await createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### C4. SQLite Database

```typescript
// apps/pos-desktop/main/database.ts

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'pos.db');
  db = new Database(dbPath);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    -- Products (synced from server)
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      barcode TEXT,
      name TEXT NOT NULL,
      name_ar TEXT,
      selling_price REAL NOT NULL,
      selling_currency TEXT DEFAULT 'USD',
      category_id TEXT,
      cost_price REAL,
      current_stock REAL,
      synced_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    
    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      parent_id TEXT,
      synced_at TEXT NOT NULL
    );
    
    -- Pending barcode links
    CREATE TABLE IF NOT EXISTS pending_barcode_links (
      barcode TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      linked_by TEXT,
      linked_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      synced_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    
    -- Sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE NOT NULL,
      terminal_id TEXT NOT NULL,
      terminal_code TEXT,
      cashier_id TEXT NOT NULL,
      cashier_name TEXT,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_cash_usd REAL DEFAULT 0,
      opening_cash_lbp REAL DEFAULT 0,
      closing_cash_usd REAL,
      closing_cash_lbp REAL,
      expected_cash_usd REAL DEFAULT 0,
      expected_cash_lbp REAL DEFAULT 0,
      total_sales REAL DEFAULT 0,
      total_returns REAL DEFAULT 0,
      total_transactions INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      sync_status TEXT DEFAULT 'pending',
      synced_at TEXT
    );
    
    -- Sales
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE NOT NULL,
      receipt_number TEXT NOT NULL,
      session_id TEXT NOT NULL,
      data TEXT NOT NULL,  -- JSON blob
      status TEXT DEFAULT 'completed',
      sync_status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      synced_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales(sync_status);
    CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(session_id);
    
    -- Cash movements
    CREATE TABLE IF NOT EXISTS cash_movements (
      id TEXT PRIMARY KEY,
      local_id TEXT UNIQUE NOT NULL,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount_usd REAL DEFAULT 0,
      amount_lbp REAL DEFAULT 0,
      reason TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT,
      sync_status TEXT DEFAULT 'pending',
      synced_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    
    -- Sync queue (for any pending operations)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      last_attempt TEXT,
      status TEXT DEFAULT 'pending',
      error TEXT,
      created_at TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    
    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    -- Terminal info
    CREATE TABLE IF NOT EXISTS terminal (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT,
      location TEXT,
      current_sequence INTEGER DEFAULT 0,
      last_sync TEXT,
      settings TEXT
    );
  `);
  
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Product operations
export function syncProducts(products: any[]) {
  const db = getDatabase();
  
  const insert = db.prepare(`
    INSERT OR REPLACE INTO products 
    (id, barcode, name, name_ar, selling_price, selling_currency, category_id, cost_price, current_stock, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const syncTransaction = db.transaction((products: any[]) => {
    for (const p of products) {
      insert.run(
        p.id,
        p.barcode,
        p.name,
        p.nameAr,
        p.sellingPrice,
        p.sellingCurrency || 'USD',
        p.categoryId,
        p.costPrice,
        p.currentStock,
        new Date().toISOString()
      );
    }
  });
  
  syncTransaction(products);
}

export function lookupProductByBarcode(barcode: string) {
  const db = getDatabase();
  
  // First check products table
  const product = db.prepare(`
    SELECT * FROM products WHERE barcode = ?
  `).get(barcode);
  
  if (product) {
    return { found: true, product: formatProduct(product), pendingLink: false };
  }
  
  // Check pending barcode links
  const link = db.prepare(`
    SELECT pbl.*, p.* 
    FROM pending_barcode_links pbl
    JOIN products p ON p.id = pbl.product_id
    WHERE pbl.barcode = ?
  `).get(barcode);
  
  if (link) {
    return { found: true, product: formatProduct(link), pendingLink: true };
  }
  
  return { found: false, product: null, pendingLink: false };
}

function formatProduct(row: any) {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    nameAr: row.name_ar,
    sellingPrice: row.selling_price,
    sellingCurrency: row.selling_currency,
    categoryId: row.category_id,
    costPrice: row.cost_price,
    currentStock: row.current_stock,
  };
}

export function searchProducts(query: string, limit = 20) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM products 
    WHERE name LIKE ? OR name_ar LIKE ? OR barcode LIKE ?
    LIMIT ?
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, limit).map(formatProduct);
}

export function saveSale(sale: any) {
  const db = getDatabase();
  
  db.prepare(`
    INSERT INTO sales (id, local_id, receipt_number, session_id, data, status, sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    sale.id,
    sale.localId,
    sale.receiptNumber,
    sale.sessionId,
    JSON.stringify(sale),
    sale.status,
    sale.createdAt
  );
  
  // Add to sync queue
  addToSyncQueue('sale', sale.localId, 'create', sale);
}

export function addToSyncQueue(entityType: string, entityId: string, action: string, payload: any) {
  const db = getDatabase();
  
  db.prepare(`
    INSERT INTO sync_queue (entity_type, entity_id, action, payload, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(entityType, entityId, action, JSON.stringify(payload), new Date().toISOString());
}

export function getPendingSyncItems(limit = 50) {
  const db = getDatabase();
  
  return db.prepare(`
    SELECT * FROM sync_queue 
    WHERE status = 'pending' 
    ORDER BY priority DESC, created_at ASC
    LIMIT ?
  `).all(limit);
}

export function markSyncItemComplete(id: number) {
  const db = getDatabase();
  
  db.prepare(`
    DELETE FROM sync_queue WHERE id = ?
  `).run(id);
}

export function markSyncItemFailed(id: number, error: string) {
  const db = getDatabase();
  
  db.prepare(`
    UPDATE sync_queue 
    SET attempts = attempts + 1, 
        last_attempt = ?, 
        error = ?,
        status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END
    WHERE id = ?
  `).run(new Date().toISOString(), error, id);
}
```

### C5. Background Sync Service

```typescript
// apps/pos-desktop/main/sync-service.ts

import { getDatabase, getPendingSyncItems, markSyncItemComplete, markSyncItemFailed } from './database';
import { net } from 'electron';

let syncInterval: NodeJS.Timeout | null = null;
let isOnline = true;

const API_BASE = process.env.API_URL || 'https://api.yourapp.com';

export async function initSyncService() {
  // Check online status periodically
  setInterval(checkOnlineStatus, 5000);
  
  // Start sync loop
  syncInterval = setInterval(processSync, 10000); // Every 10 seconds
  
  // Initial sync
  await processSync();
}

async function checkOnlineStatus() {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'HEAD' });
    isOnline = response.ok;
  } catch {
    isOnline = false;
  }
}

export function getOnlineStatus() {
  return isOnline;
}

async function processSync() {
  if (!isOnline) {
    console.log('Offline - skipping sync');
    return;
  }
  
  const items = getPendingSyncItems();
  
  for (const item of items) {
    try {
      await syncItem(item);
      markSyncItemComplete(item.id);
    } catch (error: any) {
      console.error(`Sync failed for ${item.entity_type}:${item.entity_id}`, error);
      markSyncItemFailed(item.id, error.message);
    }
  }
}

async function syncItem(item: any) {
  const payload = JSON.parse(item.payload);
  
  switch (item.entity_type) {
    case 'sale':
      await syncSale(payload);
      break;
    case 'session':
      await syncSession(payload);
      break;
    case 'barcode_link':
      await syncBarcodeLink(payload);
      break;
    case 'cash_movement':
      await syncCashMovement(payload);
      break;
    default:
      throw new Error(`Unknown entity type: ${item.entity_type}`);
  }
}

async function syncSale(sale: any) {
  const response = await fetch(`${API_BASE}/api/v1/pos/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(sale),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync sale: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Update local sale with server ID
  const db = getDatabase();
  db.prepare(`
    UPDATE sales SET id = ?, sync_status = 'synced', synced_at = ? WHERE local_id = ?
  `).run(result.id, new Date().toISOString(), sale.localId);
}

async function syncSession(session: any) {
  const response = await fetch(`${API_BASE}/api/v1/pos/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(session),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync session: ${response.status}`);
  }
}

async function syncBarcodeLink(link: any) {
  const response = await fetch(`${API_BASE}/api/v1/barcodes/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(link),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync barcode link: ${response.status}`);
  }
}

async function syncCashMovement(movement: any) {
  const response = await fetch(`${API_BASE}/api/v1/pos/cash-movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(movement),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync cash movement: ${response.status}`);
  }
}

// Pull latest data from server
export async function pullProducts() {
  if (!isOnline) return;
  
  const response = await fetch(`${API_BASE}/api/v1/pos/sync/products`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to pull products');
  }
  
  const { products } = await response.json();
  
  const { syncProducts } = await import('./database');
  syncProducts(products);
}

function getAuthToken(): string {
  // Get from electron-store or wherever you store it
  const Store = require('electron-store');
  const store = new Store();
  return store.get('authToken', '');
}
```

### C6. Printer Service (ESC/POS)

```typescript
// apps/pos-desktop/main/printer-service.ts

import escpos from 'escpos';
import USB from 'escpos-usb';

let printer: any = null;
let device: any = null;

export async function initPrinterService() {
  try {
    // Find USB printer
    device = new USB();
    printer = new escpos.Printer(device);
    console.log('Printer initialized');
  } catch (error) {
    console.log('No USB printer found, will use fallback');
  }
}

export function isPrinterAvailable(): boolean {
  return printer !== null;
}

export async function printReceipt(receipt: ReceiptData): Promise<void> {
  if (!printer) {
    throw new Error('Printer not available');
  }
  
  return new Promise((resolve, reject) => {
    device.open((err: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      printer
        // Header
        .align('CT')
        .style('B')
        .size(1, 1)
        .text(receipt.businessName)
        .style('NORMAL')
        .text(receipt.businessNameAr || '')
        .text(receipt.address || '')
        .text(`Tel: ${receipt.phone || ''}`)
        
        // Divider
        .text('--------------------------------')
        
        // Receipt info
        .align('LT')
        .text(`Receipt: ${receipt.receiptNumber}`)
        .text(`Date: ${formatDateTime(receipt.date)}`)
        .text(`Cashier: ${receipt.cashierName}`)
        
        // Divider
        .text('--------------------------------')
        
        // Items header
        .tableCustom([
          { text: 'Item', align: 'LEFT', width: 0.5 },
          { text: 'Qty', align: 'CENTER', width: 0.15 },
          { text: 'Price', align: 'RIGHT', width: 0.35 },
        ]);
      
      // Items
      for (const item of receipt.items) {
        printer
          .tableCustom([
            { text: truncate(item.name, 16), align: 'LEFT', width: 0.5 },
            { text: item.quantity.toString(), align: 'CENTER', width: 0.15 },
            { text: formatMoney(item.lineTotal), align: 'RIGHT', width: 0.35 },
          ]);
        
        if (item.discountPercent > 0) {
          printer.text(`  -${item.discountPercent}% discount`);
        }
      }
      
      printer
        // Divider
        .text('--------------------------------')
        
        // Totals
        .align('RT')
        .text(`Subtotal: ${formatMoney(receipt.subtotal)}`)
        
        if (receipt.discountAmount > 0) {
          printer.text(`Discount: -${formatMoney(receipt.discountAmount)}`);
        }
        
        if (receipt.taxAmount > 0) {
          printer.text(`Tax (${receipt.taxRate}%): ${formatMoney(receipt.taxAmount)}`);
        }
        
        printer
        .style('B')
        .size(1, 1)
        .text(`TOTAL: ${formatMoney(receipt.total)} ${receipt.currency}`)
        .style('NORMAL')
        .size(0, 0)
        .text(`(${formatMoney(receipt.totalLBP)} LBP)`)
        
        // Divider
        .text('--------------------------------')
        
        // Payment
        .align('LT')
        .text(`Paid: ${formatMoney(receipt.cashReceived)} ${receipt.paymentCurrency}`)
        .text(`Change: ${formatMoney(receipt.change)} ${receipt.changeCurrency}`)
        
        // Divider
        .text('--------------------------------')
        
        // Footer
        .align('CT')
        .text(receipt.thankYouMessage || 'Thank you for shopping!')
        .text(receipt.thankYouMessageAr || 'شكراً لتسوقكم!')
        
        // Barcode
        .barcode(receipt.receiptNumber, 'CODE39', { width: 2, height: 50 })
        
        // Cut and open drawer
        .cut()
        .cashdraw(2)
        
        .close(() => {
          resolve();
        });
    });
  });
}

export async function openCashDrawer(): Promise<void> {
  if (!printer) {
    throw new Error('Printer not available');
  }
  
  return new Promise((resolve, reject) => {
    device.open((err: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      printer
        .cashdraw(2)
        .close(() => {
          resolve();
        });
    });
  });
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length - 1) + '…' : str;
}

interface ReceiptData {
  businessName: string;
  businessNameAr?: string;
  address?: string;
  phone?: string;
  receiptNumber: string;
  date: Date | string;
  cashierName: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountPercent: number;
  }[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  totalLBP: number;
  cashReceived: number;
  paymentCurrency: string;
  change: number;
  changeCurrency: string;
  thankYouMessage?: string;
  thankYouMessageAr?: string;
}
```

### C7. IPC Handlers

```typescript
// apps/pos-desktop/main/ipc-handlers.ts

import { ipcMain } from 'electron';
import {
  lookupProductByBarcode,
  searchProducts,
  saveSale,
  getDatabase,
  addToSyncQueue,
} from './database';
import { printReceipt, openCashDrawer, isPrinterAvailable } from './printer-service';
import { getOnlineStatus, pullProducts } from './sync-service';

export function registerIpcHandlers() {
  // Product lookup
  ipcMain.handle('pos:lookup-barcode', async (_, barcode: string) => {
    return lookupProductByBarcode(barcode);
  });
  
  // Product search
  ipcMain.handle('pos:search-products', async (_, query: string) => {
    return searchProducts(query);
  });
  
  // Save sale
  ipcMain.handle('pos:save-sale', async (_, sale: any) => {
    saveSale(sale);
    return { success: true };
  });
  
  // Link barcode
  ipcMain.handle('pos:link-barcode', async (_, barcode: string, productId: string, userId: string) => {
    const db = getDatabase();
    
    db.prepare(`
      INSERT OR REPLACE INTO pending_barcode_links (barcode, product_id, linked_by, linked_at, sync_status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(barcode, productId, userId, new Date().toISOString());
    
    addToSyncQueue('barcode_link', barcode, 'create', { barcode, productId, linkedBy: userId });
    
    return { success: true };
  });
  
  // Print receipt
  ipcMain.handle('pos:print-receipt', async (_, receiptData: any) => {
    try {
      await printReceipt(receiptData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  // Open cash drawer
  ipcMain.handle('pos:open-cash-drawer', async () => {
    try {
      await openCashDrawer();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  // Get online status
  ipcMain.handle('pos:get-online-status', async () => {
    return getOnlineStatus();
  });
  
  // Check printer
  ipcMain.handle('pos:check-printer', async () => {
    return isPrinterAvailable();
  });
  
  // Manual sync trigger
  ipcMain.handle('pos:sync-products', async () => {
    try {
      await pullProducts();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  // Session operations
  ipcMain.handle('pos:open-session', async (_, sessionData: any) => {
    const db = getDatabase();
    
    db.prepare(`
      INSERT INTO sessions (id, local_id, terminal_id, terminal_code, cashier_id, cashier_name,
        opened_at, opening_cash_usd, opening_cash_lbp, status, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'pending')
    `).run(
      sessionData.id,
      sessionData.localId,
      sessionData.terminalId,
      sessionData.terminalCode,
      sessionData.cashierId,
      sessionData.cashierName,
      new Date().toISOString(),
      sessionData.openingCashUSD,
      sessionData.openingCashLBP
    );
    
    addToSyncQueue('session', sessionData.localId, 'open', sessionData);
    
    return { success: true };
  });
  
  ipcMain.handle('pos:close-session', async (_, sessionId: string, closingData: any) => {
    const db = getDatabase();
    
    db.prepare(`
      UPDATE sessions SET 
        closed_at = ?,
        closing_cash_usd = ?,
        closing_cash_lbp = ?,
        status = 'closed'
      WHERE local_id = ?
    `).run(
      new Date().toISOString(),
      closingData.closingCashUSD,
      closingData.closingCashLBP,
      sessionId
    );
    
    addToSyncQueue('session', sessionId, 'close', closingData);
    
    return { success: true };
  });
  
  // Get current session
  ipcMain.handle('pos:get-current-session', async () => {
    const db = getDatabase();
    
    const session = db.prepare(`
      SELECT * FROM sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1
    `).get();
    
    return session || null;
  });
}
```

### C8. Preload Script

```typescript
// apps/pos-desktop/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Product operations
  lookupBarcode: (barcode: string) => ipcRenderer.invoke('pos:lookup-barcode', barcode),
  searchProducts: (query: string) => ipcRenderer.invoke('pos:search-products', query),
  
  // Sale operations
  saveSale: (sale: any) => ipcRenderer.invoke('pos:save-sale', sale),
  
  // Barcode linking
  linkBarcode: (barcode: string, productId: string, userId: string) => 
    ipcRenderer.invoke('pos:link-barcode', barcode, productId, userId),
  
  // Hardware
  printReceipt: (receiptData: any) => ipcRenderer.invoke('pos:print-receipt', receiptData),
  openCashDrawer: () => ipcRenderer.invoke('pos:open-cash-drawer'),
  checkPrinter: () => ipcRenderer.invoke('pos:check-printer'),
  
  // Sync
  getOnlineStatus: () => ipcRenderer.invoke('pos:get-online-status'),
  syncProducts: () => ipcRenderer.invoke('pos:sync-products'),
  
  // Session
  openSession: (sessionData: any) => ipcRenderer.invoke('pos:open-session', sessionData),
  closeSession: (sessionId: string, closingData: any) => 
    ipcRenderer.invoke('pos:close-session', sessionId, closingData),
  getCurrentSession: () => ipcRenderer.invoke('pos:get-current-session'),
});

// Type declaration for renderer
declare global {
  interface Window {
    electronAPI: {
      lookupBarcode: (barcode: string) => Promise<any>;
      searchProducts: (query: string) => Promise<any[]>;
      saveSale: (sale: any) => Promise<{ success: boolean }>;
      linkBarcode: (barcode: string, productId: string, userId: string) => Promise<{ success: boolean }>;
      printReceipt: (receiptData: any) => Promise<{ success: boolean; error?: string }>;
      openCashDrawer: () => Promise<{ success: boolean; error?: string }>;
      checkPrinter: () => Promise<boolean>;
      getOnlineStatus: () => Promise<boolean>;
      syncProducts: () => Promise<{ success: boolean; error?: string }>;
      openSession: (sessionData: any) => Promise<{ success: boolean }>;
      closeSession: (sessionId: string, closingData: any) => Promise<{ success: boolean }>;
      getCurrentSession: () => Promise<any>;
    };
  }
}
```

### C9. Electron Renderer (Uses Shared Core)

```typescript
// apps/pos-desktop/renderer/App.tsx

import React, { useEffect, useState } from 'react';
import { POSLayout } from '@accounting/pos-core';

export function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [printerAvailable, setPrinterAvailable] = useState(false);
  
  useEffect(() => {
    // Check initial status
    window.electronAPI.getOnlineStatus().then(setIsOnline);
    window.electronAPI.checkPrinter().then(setPrinterAvailable);
    
    // Poll for status changes
    const interval = setInterval(async () => {
      setIsOnline(await window.electronAPI.getOnlineStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <POSLayout
      isElectron={true}
      isOnline={isOnline}
      onPrint={async (receiptData) => {
        const result = await window.electronAPI.printReceipt(receiptData);
        if (!result.success) {
          console.error('Print failed:', result.error);
          // Fallback to window.print() or show error
        }
      }}
      onOpenCashDrawer={async () => {
        await window.electronAPI.openCashDrawer();
      }}
      onSync={async () => {
        await window.electronAPI.syncProducts();
      }}
      // Override hooks to use Electron IPC
      productLookupFn={async (barcode) => {
        return window.electronAPI.lookupBarcode(barcode);
      }}
      productSearchFn={async (query) => {
        return window.electronAPI.searchProducts(query);
      }}
      saveSaleFn={async (sale) => {
        return window.electronAPI.saveSale(sale);
      }}
      linkBarcodeFn={async (barcode, productId, userId) => {
        return window.electronAPI.linkBarcode(barcode, productId, userId);
      }}
    />
  );
}
```

---

## Part D: Backend API Additions

### D1. New API Endpoints

```
# POS Sync
POST   /api/v1/pos/sync/pull           # Get products, categories, exchange rate
POST   /api/v1/pos/sync/push           # Upload sales, sessions, barcode links

# Terminals
GET    /api/v1/pos/terminals
POST   /api/v1/pos/terminals
PUT    /api/v1/pos/terminals/:id

# Sessions
GET    /api/v1/pos/sessions
POST   /api/v1/pos/sessions            # Open/close session
GET    /api/v1/pos/sessions/:id
GET    /api/v1/pos/sessions/:id/report # X/Z report

# Sales
GET    /api/v1/pos/sales
POST   /api/v1/pos/sales
GET    /api/v1/pos/sales/:id
POST   /api/v1/pos/sales/:id/void

# Cash Movements
POST   /api/v1/pos/cash-movements

# Barcode Links (from product-identity-matching.md)
GET    /api/v1/barcodes/:barcode/lookup
POST   /api/v1/barcodes/link
GET    /api/v1/barcodes/pending         # Manager verification queue
POST   /api/v1/barcodes/pending/:id/approve
POST   /api/v1/barcodes/pending/:id/reject
```

### D2. Database Schema Additions

Add to existing Drizzle schema:

```typescript
// POS Terminals
export const posTerminals = pgTable('pos_terminals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  code: varchar('code', { length: 20 }).notNull(), // POS01, POS02
  name: varchar('name', { length: 100 }),
  location: varchar('location', { length: 200 }),
  isActive: boolean('is_active').default(true),
  lastSeenAt: timestamp('last_seen_at'),
  currentSequence: integer('current_sequence').default(0),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// POS Sessions
export const posSessions = pgTable('pos_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  localId: uuid('local_id').notNull(),
  terminalId: uuid('terminal_id').references(() => posTerminals.id).notNull(),
  cashierId: uuid('cashier_id').references(() => users.id).notNull(),
  
  openedAt: timestamp('opened_at').notNull(),
  closedAt: timestamp('closed_at'),
  
  openingCashUsd: decimal('opening_cash_usd', { precision: 15, scale: 2 }).default('0'),
  openingCashLbp: decimal('opening_cash_lbp', { precision: 15, scale: 2 }).default('0'),
  closingCashUsd: decimal('closing_cash_usd', { precision: 15, scale: 2 }),
  closingCashLbp: decimal('closing_cash_lbp', { precision: 15, scale: 2 }),
  expectedCashUsd: decimal('expected_cash_usd', { precision: 15, scale: 2 }).default('0'),
  expectedCashLbp: decimal('expected_cash_lbp', { precision: 15, scale: 2 }).default('0'),
  
  totalSales: decimal('total_sales', { precision: 15, scale: 2 }).default('0'),
  totalReturns: decimal('total_returns', { precision: 15, scale: 2 }).default('0'),
  totalTransactions: integer('total_transactions').default(0),
  
  status: varchar('status', { length: 20 }).default('open'), // open, closed
  createdAt: timestamp('created_at').defaultNow(),
});

// POS Sales
export const posSales = pgTable('pos_sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  localId: uuid('local_id').notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  
  terminalId: uuid('terminal_id').references(() => posTerminals.id).notNull(),
  sessionId: uuid('session_id').references(() => posSessions.id).notNull(),
  
  customerId: uuid('customer_id').references(() => contacts.id),
  
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).default('0'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  total: decimal('total', { precision: 15, scale: 2 }).notNull(),
  
  currency: varchar('currency', { length: 3 }).default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 15, scale: 4 }),
  totalLbp: decimal('total_lbp', { precision: 15, scale: 2 }),
  
  paymentMethod: varchar('payment_method', { length: 20 }), // cash_usd, cash_lbp, mixed, card
  cashReceivedUsd: decimal('cash_received_usd', { precision: 15, scale: 2 }),
  cashReceivedLbp: decimal('cash_received_lbp', { precision: 15, scale: 2 }),
  changeUsd: decimal('change_usd', { precision: 15, scale: 2 }),
  changeLbp: decimal('change_lbp', { precision: 15, scale: 2 }),
  
  status: varchar('status', { length: 20 }).default('completed'), // completed, voided, returned
  voidReason: text('void_reason'),
  
  cashierId: uuid('cashier_id').references(() => users.id).notNull(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// POS Sale Items
export const posSaleItems = pgTable('pos_sale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  saleId: uuid('sale_id').references(() => posSales.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  barcode: varchar('barcode', { length: 50 }),
  productName: varchar('product_name', { length: 200 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  lineTotal: decimal('line_total', { precision: 15, scale: 2 }).notNull(),
});

// Cash Movements
export const posCashMovements = pgTable('pos_cash_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  localId: uuid('local_id').notNull(),
  sessionId: uuid('session_id').references(() => posSessions.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // cash_in, cash_out
  amountUsd: decimal('amount_usd', { precision: 15, scale: 2 }).default('0'),
  amountLbp: decimal('amount_lbp', { precision: 15, scale: 2 }).default('0'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Pending Barcode Links (from product-identity-matching.md)
export const pendingBarcodeLinks = pgTable('pending_barcode_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  barcode: varchar('barcode', { length: 50 }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  linkedBy: uuid('linked_by').references(() => users.id).notNull(),
  linkedAt: timestamp('linked_at').defaultNow(),
  terminalId: uuid('terminal_id').references(() => posTerminals.id),
  saleId: uuid('sale_id').references(() => posSales.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  correctedProductId: uuid('corrected_product_id').references(() => products.id),
});

// Product Barcodes (multiple barcodes per product)
export const productBarcodes = pgTable('product_barcodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  barcode: varchar('barcode', { length: 50 }).notNull(),
  barcodeType: varchar('barcode_type', { length: 20 }), // EAN13, EAN8, UPC, CODE128
  source: varchar('source', { length: 20 }), // original, supplier, pos_link
  supplierId: uuid('supplier_id').references(() => contacts.id),
  isPrimary: boolean('is_primary').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Implementation Timeline

```
Week 1: Foundation
├── Create pos-core package structure
├── Implement core types
├── Implement cart store
├── Implement barcode scanner hook
└── Basic UI components (ScanInput, CartPanel, TotalDisplay)

Week 2: Payment & Session
├── PaymentModal with USD/LBP handling
├── SessionModal (open/close)
├── UnknownBarcodeModal
├── Currency utilities
└── PWA integration in apps/web

Week 3: Backend API
├── Add database schema
├── POS module in NestJS
├── Terminals CRUD
├── Sessions API
├── Sales API
└── Barcode linking API

Week 4: Electron Setup
├── Electron project structure
├── SQLite database setup
├── IPC handlers
├── Preload script
└── Basic renderer

Week 5: Electron Features
├── Background sync service
├── ESC/POS printer service
├── Cash drawer integration
├── Offline data management
└── Product sync from server

Week 6: Polish & Testing
├── Keyboard shortcuts
├── Error handling
├── Offline testing
├── Receipt format refinement
├── Manager verification queue UI
└── X/Z reports
```

---

## Key Differences from Previous Prompt

| Previous (Restaurant) | Current (Supermarket) |
|----------------------|----------------------|
| Touch product grid | Barcode scanner input |
| Browse categories | PLU code entry |
| PWA only | PWA + Electron |
| IndexedDB | SQLite (Electron) |
| Basic offline | True offline with sync |
| No hardware | Printer + cash drawer |
| Simple payment | USD/LBP mixed payment |

---

## Hardware Requirements

| Hardware | Purpose | Connection |
|----------|---------|------------|
| USB Barcode Scanner | Scan products | USB (keyboard emulation) |
| Thermal Receipt Printer | Print receipts | USB (ESC/POS) |
| Cash Drawer | Store cash | Connected to printer |
| Customer Display (optional) | Show total | USB or serial |

---

Ready to paste into Claude Code! 🚀
