import React, { useState, useCallback } from 'react';
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
  isOnline?: boolean;
  cashierId: string;
  cashierName: string;
}

export function POSLayout({
  onSaleComplete,
  onPrint,
  onOpenCashDrawer,
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
    (params: { cashierId: string; cashierName: string; openingCashUSD: number; openingCashLBP: number }) => {
      openSession(params);
      setShowSession(false);
    },
    [openSession]
  );

  const handleCloseSession = useCallback(
    (params: { closingCashUSD: number; closingCashLBP: number }) => {
      closeSession(params);
      setShowSession(true);
    },
    [closeSession]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>

          <button
            onClick={() => setShowSession(true)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            {session?.status === 'open' ? 'Close Shift' : 'Open Shift'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4">
          <ScanInput
            onSubmit={handleBarcodeScan}
            disabled={!session || session.status !== 'open'}
            placeholder="Scan barcode or enter PLU..."
            autoFocus
          />

          <div className="mt-4 text-center text-gray-500">
            <p className="text-lg">Scan product barcode</p>
            <p className="text-sm mt-2">Or type PLU code and press Enter</p>
          </div>

          <div className="mt-auto text-sm text-gray-400">
            <p>
              <kbd className="px-1 border rounded">F2</kbd> Search Product
            </p>
            <p>
              <kbd className="px-1 border rounded">F8</kbd> Void Last Item
            </p>
            <p>
              <kbd className="px-1 border rounded">F12</kbd> Pay
            </p>
          </div>
        </div>

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
