import React, { useState, useCallback } from 'react';
import {
  TreePine,
  Wifi,
  WifiOff,
  Clock,
  Barcode,
  Search,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { useCartStore } from '../stores/cart-store';
import { useSessionStore } from '../stores/session-store';
import { useProductsStore } from '../stores/products-store';
import { useBarcodeScan } from '../hooks/useBarcodeScan';
import { ScanInput } from './ScanInput';
import { CartPanel } from './CartPanel';
import { TotalDisplay } from './TotalDisplay';
import { PaymentModal } from './PaymentModal';
import { UnknownBarcodeModal } from './UnknownBarcodeModal';
import { SessionModal } from './SessionModal';
import { playSound } from '../utils/sound';
import type { Payment, POSProduct } from '../types';

interface POSLayoutProps {
  onSaleComplete?: (sale: any) => Promise<void>;
  onPrint?: (receiptData: any) => Promise<void>;
  onOpenCashDrawer?: () => Promise<void>;
  onSessionOpen?: (params: { terminalId: string; terminalCode: string; openingCashUSD: number; openingCashLBP: number }) => Promise<any>;
  onSessionClose?: (sessionId: string, params: { closingCashUSD: number; closingCashLBP: number }) => Promise<any>;
  isOnline?: boolean;
  cashierId: string;
  cashierName: string;
}

export function POSLayout({
  onSaleComplete,
  onPrint,
  onOpenCashDrawer,
  onSessionOpen,
  onSessionClose,
  isOnline = true,
  cashierId,
  cashierName,
}: POSLayoutProps) {
  const { cart, addItem, clearCart } = useCartStore();
  const { session, openSession, closeSession, updateSessionTotals } = useSessionStore();
  const { getProductByBarcode, addPendingBarcodeLink } = useProductsStore();

  const [showPayment, setShowPayment] = useState(false);
  const [showUnknownBarcode, setShowUnknownBarcode] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showSession, setShowSession] = useState(!session || session.status !== 'open');

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (!session || session.status !== 'open') {
        playSound('error');
        setShowSession(true);
        return;
      }

      const { product, isPending } = getProductByBarcode(barcode);

      if (product) {
        addItem(product);
        playSound(isPending ? 'warning' : 'success');
      } else {
        playSound('error');
        setUnknownBarcode(barcode);
        setShowUnknownBarcode(true);
      }
    },
    [session, getProductByBarcode, addItem]
  );

  useBarcodeScan({
    onScan: handleBarcodeScan,
    enabled: !showPayment && !showUnknownBarcode && !showSession,
  });

  const handlePaymentComplete = useCallback(
    async (payment: Payment) => {
      try {
        const sale = {
          items: cart.items,
          total: cart.total,
          totalLBP: cart.totalLBP,
          payment,
          sessionId: session?.id,
        };

        await onSaleComplete?.(sale);
        updateSessionTotals({ saleAmount: cart.total });

        if (onOpenCashDrawer) {
          await onOpenCashDrawer();
        }

        setShowPayment(false);
        clearCart();
        playSound('success');
      } catch (error) {
        console.error('Sale failed:', error);
        playSound('error');
      }
    },
    [cart, session, onSaleComplete, onOpenCashDrawer, updateSessionTotals, clearCart]
  );

  const handleBarcodeLinked = useCallback(
    (product: POSProduct) => {
      if (unknownBarcode) {
        addPendingBarcodeLink(unknownBarcode, product.id, cashierId);
      }
      addItem(product);
      setShowUnknownBarcode(false);
      setUnknownBarcode(null);
      playSound('success');
    },
    [unknownBarcode, addItem, addPendingBarcodeLink, cashierId]
  );

  const handleOpenSession = useCallback(
    async (params: { cashierId: string; cashierName: string; openingCashUSD: number; openingCashLBP: number }) => {
      try {
        if (onSessionOpen) {
          // Use API to open session
          const terminal = useSessionStore.getState().terminal;
          if (!terminal) throw new Error('Terminal not configured');

          await onSessionOpen({
            terminalId: terminal.id,
            terminalCode: terminal.code,
            openingCashUSD: params.openingCashUSD,
            openingCashLBP: params.openingCashLBP,
          });
        } else {
          // Use local store
          openSession(params);
        }
        setShowSession(false);
      } catch (error) {
        console.error('Failed to open session:', error);
        playSound('error');
      }
    },
    [openSession, onSessionOpen]
  );

  const handleCloseSession = useCallback(
    async (params: { closingCashUSD: number; closingCashLBP: number }) => {
      try {
        if (onSessionClose && session) {
          await onSessionClose(session.id, params);
        } else {
          closeSession(params);
        }
        setShowSession(true);
      } catch (error) {
        console.error('Failed to close session:', error);
        playSound('error');
      }
    },
    [closeSession, onSessionClose, session]
  );

  return (
    <div className="h-screen flex flex-col" style={{ background: 'hsl(220 15% 8%)' }}>
      {/* Premium Header */}
      <header className="pos-gradient-cedar px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'hsl(43 45% 56%)', boxShadow: 'var(--shadow-gold)' }}
            >
              <TreePine className="w-6 h-6" style={{ color: 'hsl(160 47% 20%)' }} />
            </div>
            <div>
              <h1 className="pos-header-title text-white text-xl">Point of Sale</h1>
              {session && (
                <p className="text-sm text-white/60">
                  {session.terminalCode} | {session.cashierName}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" style={{ color: 'hsl(150 22% 45%)' }} />
                <span className="text-sm" style={{ color: 'hsl(150 22% 45%)' }}>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" style={{ color: 'hsl(15 56% 50%)' }} />
                <span className="text-sm" style={{ color: 'hsl(15 56% 50%)' }}>Offline</span>
              </>
            )}
          </div>

          {/* Session Button */}
          <button
            onClick={() => setShowSession(true)}
            className="pos-button-secondary flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {session?.status === 'open' ? 'Close Shift' : 'Open Shift'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scan Area */}
        <div className="flex-1 flex flex-col p-6">
          <ScanInput
            onSubmit={handleBarcodeScan}
            disabled={!session || session.status !== 'open'}
            placeholder="Scan barcode or enter PLU..."
            autoFocus
          />

          {/* Scan Instructions */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 pos-animate-fade-in"
              style={{ background: 'hsl(220 14% 12%)', border: '2px dashed hsl(220 12% 25%)' }}
            >
              <Barcode className="w-12 h-12" style={{ color: 'hsl(43 45% 56%)' }} />
            </div>
            <p className="text-xl font-medium" style={{ color: 'hsl(220 10% 92%)' }}>
              Scan product barcode
            </p>
            <p className="text-sm mt-2" style={{ color: 'hsl(220 10% 55%)' }}>
              Or type PLU code and press Enter
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2 text-sm" style={{ color: 'hsl(220 10% 45%)' }}>
            <div className="flex items-center gap-3">
              <kbd className="pos-card px-2 py-1 text-xs font-mono" style={{ minWidth: '2.5rem', textAlign: 'center' }}>
                <Search className="w-3 h-3 inline" /> F2
              </kbd>
              <span>Search Product</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="pos-card px-2 py-1 text-xs font-mono" style={{ minWidth: '2.5rem', textAlign: 'center' }}>
                <Trash2 className="w-3 h-3 inline" /> F8
              </kbd>
              <span>Void Last Item</span>
            </div>
            <div className="flex items-center gap-3">
              <kbd className="pos-card px-2 py-1 text-xs font-mono" style={{ minWidth: '2.5rem', textAlign: 'center' }}>
                <CreditCard className="w-3 h-3 inline" /> F12
              </kbd>
              <span>Pay</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 pos-card flex flex-col m-4 ml-0 overflow-hidden" style={{ borderRadius: '1rem' }}>
          <CartPanel />

          <div className="pos-divider" />

          <div className="p-5">
            <TotalDisplay
              subtotal={cart.subtotal}
              discount={cart.discountAmount}
              tax={cart.taxAmount}
              total={cart.total}
              totalLBP={cart.totalLBP}
              currency={cart.currency}
            />

            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.items.length === 0 || !session || session.status !== 'open'}
              className="pos-button-gold w-full mt-5 py-4 text-xl flex items-center justify-center gap-3"
            >
              <CreditCard className="w-6 h-6" />
              PAY ${cart.total.toFixed(2)}
            </button>
          </div>
        </div>
      </main>

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
          onOpenSession={handleOpenSession}
          onCloseSession={handleCloseSession}
          onCancel={() => session?.status === 'open' && setShowSession(false)}
          cashierId={cashierId}
          cashierName={cashierName}
        />
      )}
    </div>
  );
}
