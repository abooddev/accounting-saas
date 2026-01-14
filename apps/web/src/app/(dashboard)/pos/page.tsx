'use client';

import { useEffect, useState, useCallback } from 'react';
import { POSLayout, useProductsStore, useSessionStore, POSProduct, POSSession } from '@accounting/pos-core';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api/client';
import { useActiveSession, useOpenSession, useCloseSession, useCreateSale } from '@/hooks/use-pos';

export default function POSPage() {
  const { user, tenant } = useAuthStore();
  const { setProducts, setExchangeRate, exchangeRate } = useProductsStore();
  const { setTerminal, setSession, session } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const { data: activeSession, isLoading: sessionLoading } = useActiveSession();
  const openSessionMutation = useOpenSession();
  const closeSessionMutation = useCloseSession();
  const createSaleMutation = useCreateSale();

  // Sync API session to local store
  useEffect(() => {
    if (!sessionLoading && activeSession !== undefined) {
      if (activeSession) {
        const posSession: POSSession = {
          id: activeSession.id,
          localId: activeSession.id,
          terminalId: activeSession.terminalId,
          terminalCode: activeSession.terminalCode,
          cashierId: activeSession.cashierId,
          cashierName: activeSession.cashierName,
          openedAt: new Date(activeSession.openedAt),
          closedAt: activeSession.closedAt ? new Date(activeSession.closedAt) : null,
          openingCashUSD: parseFloat(String(activeSession.openingCashUSD)) || 0,
          openingCashLBP: parseFloat(String(activeSession.openingCashLBP)) || 0,
          closingCashUSD: activeSession.closingCashUSD ? parseFloat(String(activeSession.closingCashUSD)) : null,
          closingCashLBP: activeSession.closingCashLBP ? parseFloat(String(activeSession.closingCashLBP)) : null,
          expectedCashUSD: parseFloat(String(activeSession.expectedCashUSD)) || 0,
          expectedCashLBP: parseFloat(String(activeSession.expectedCashLBP)) || 0,
          differenceUSD: activeSession.differenceUSD ? parseFloat(String(activeSession.differenceUSD)) : null,
          differenceLBP: activeSession.differenceLBP ? parseFloat(String(activeSession.differenceLBP)) : null,
          totalSales: parseFloat(String(activeSession.totalSales)) || 0,
          totalReturns: parseFloat(String(activeSession.totalReturns)) || 0,
          totalTransactions: parseInt(String(activeSession.totalTransactions)) || 0,
          status: activeSession.status as 'open' | 'closed',
          syncStatus: 'synced',
        };
        setSession(posSession);
      } else {
        setSession(null);
      }
    }
  }, [activeSession, sessionLoading, setSession]);

  useEffect(() => {
    // Configure default terminal
    setTerminal({
      id: 'terminal-1',
      code: 'POS-01',
      name: 'Main Terminal',
      location: null,
      isActive: true,
    });

    const loadProducts = async () => {
      try {
        const [productsRes, ratesRes] = await Promise.all([
          apiClient.get('/products'),
          apiClient.get('/exchange-rates/current'),
        ]);

        const products: POSProduct[] = productsRes.data.data.map((p: any) => ({
          id: p.id,
          barcode: p.barcode,
          sku: p.sku,
          name: p.name,
          nameAr: p.nameAr,
          categoryId: p.categoryId,
          categoryName: p.category?.name || '',
          sellingPrice: parseFloat(p.sellingPrice) || 0,
          sellingCurrency: p.sellingCurrency || 'USD',
          taxRate: 0,
          trackStock: p.trackStock,
          currentStock: parseFloat(p.currentStock) || 0,
          imageUrl: p.imageUrl,
        }));

        setProducts(products);

        if (ratesRes.data.data) {
          setExchangeRate(parseFloat(ratesRes.data.data.rate) || 89500);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setProducts, setExchangeRate, setTerminal]);

  const handleSessionOpen = useCallback(async (params: {
    terminalId: string;
    terminalCode: string;
    openingCashUSD: number;
    openingCashLBP: number;
  }) => {
    const result = await openSessionMutation.mutateAsync(params);
    return result;
  }, [openSessionMutation]);

  const handleSessionClose = useCallback(async (
    sessionId: string,
    params: { closingCashUSD: number; closingCashLBP: number }
  ) => {
    const result = await closeSessionMutation.mutateAsync({ sessionId, data: params });
    return result;
  }, [closeSessionMutation]);

  const handleSaleComplete = useCallback(async (sale: any) => {
    if (!session) return;

    try {
      await createSaleMutation.mutateAsync({
        sessionId: session.id,
        localId: sale.localId,
        customerId: sale.customerId,
        customerName: sale.customerName,
        items: sale.items.map((item: any) => ({
          productId: item.productId,
          barcode: item.barcode,
          productName: item.name,
          productNameAr: item.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          lineTotal: item.lineTotal,
        })),
        subtotal: sale.subtotal || sale.total,
        discountPercent: sale.discountPercent || 0,
        discountAmount: sale.discountAmount || 0,
        taxRate: sale.taxRate || 0,
        taxAmount: sale.taxAmount || 0,
        total: sale.total,
        currency: sale.currency || 'USD',
        exchangeRate: exchangeRate,
        totalLBP: sale.totalLBP || sale.total * exchangeRate,
        payment: {
          method: sale.payment.method,
          amountUSD: sale.payment.amountUSD || sale.total,
          amountLBP: sale.payment.amountLBP || 0,
          cashReceivedUSD: sale.payment.cashReceivedUSD || sale.total,
          cashReceivedLBP: sale.payment.cashReceivedLBP || 0,
          changeUSD: sale.payment.changeUSD || 0,
          changeLBP: sale.payment.changeLBP || 0,
        },
      });
    } catch (error) {
      console.error('Failed to save sale:', error);
      throw error;
    }
  }, [session, createSaleMutation, exchangeRate]);

  if (isLoading || sessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to use POS</p>
      </div>
    );
  }

  return (
    <POSLayout
      cashierId={user.id}
      cashierName={user.name}
      isOnline={isOnline}
      onSaleComplete={handleSaleComplete}
      onSessionOpen={handleSessionOpen}
      onSessionClose={handleSessionClose}
    />
  );
}
