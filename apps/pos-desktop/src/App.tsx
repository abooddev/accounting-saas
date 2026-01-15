import { useEffect, useState, useCallback } from 'react';
import {
  POSLayout,
  useProductsStore,
  useSessionStore,
  useCartStore,
  POSProduct,
  POSSession,
} from '@accounting/pos-core';
import { apiClient, setAuthTokens, getAuthTokens, clearAuthTokens } from './lib/api';
import { LoginForm } from './components/LoginForm';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const { setProducts } = useProductsStore();
  const { setExchangeRate, cart: { exchangeRate } } = useCartStore();
  const { setTerminal, setSession, session } = useSessionStore();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth tokens on startup
  useEffect(() => {
    const initializeApp = async () => {
      const { accessToken } = getAuthTokens();

      if (accessToken) {
        try {
          // Verify token and get user info
          const userResponse = await apiClient.get('/auth/me');
          setUser(userResponse.data.data);
          await loadPOSData();
        } catch {
          // Token invalid, clear it
          clearAuthTokens();
        }
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Use Electron API if available, fallback to browser events
    if (window.electronAPI?.network) {
      setIsOnline(window.electronAPI.network.isOnline());
      window.electronAPI.network.onStatusChange((online) => setIsOnline(online));
      return () => {
        window.electronAPI.network.removeStatusListener();
      };
    } else {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const loadPOSData = async () => {
    try {
      // Configure default terminal
      setTerminal({
        id: 'terminal-1',
        code: 'POS-01',
        name: 'Main Terminal',
        location: null,
        isActive: true,
      });

      const [productsRes, ratesRes, sessionRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/exchange-rates/current'),
        apiClient.get('/pos/sessions/active').catch(() => ({ data: { data: null } })),
      ]);

      // Map products to POS format
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

      // Sync active session if exists
      if (sessionRes.data.data) {
        const activeSession = sessionRes.data.data;
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
      }
    } catch (error) {
      console.error('Failed to load POS data:', error);
      setError('Failed to load data. Please check your connection and try again.');
    }
  };

  const handleLogin = async (email: string, password: string, tenantSlug: string) => {
    try {
      setError(null);

      const response = await apiClient.post('/auth/login', {
        email,
        password,
      }, {
        headers: {
          'X-Tenant-Slug': tenantSlug,
        },
      });

      const { tokens, user: userData } = response.data.data;
      const { accessToken, refreshToken } = tokens;

      setAuthTokens(accessToken, refreshToken, tenantSlug);
      setUser(userData);

      await loadPOSData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    setUser(null);
    setSession(null);
  };

  const handleSessionOpen = useCallback(async (params: {
    terminalId: string;
    terminalCode: string;
    openingCashUSD: number;
    openingCashLBP: number;
  }) => {
    setSessionLoading(true);
    try {
      const response = await apiClient.post('/pos/sessions/open', params);
      const sessionData = response.data.data;

      const posSession: POSSession = {
        id: sessionData.id,
        localId: sessionData.id,
        terminalId: sessionData.terminalId,
        terminalCode: sessionData.terminalCode,
        cashierId: sessionData.cashierId,
        cashierName: sessionData.cashierName,
        openedAt: new Date(sessionData.openedAt),
        closedAt: null,
        openingCashUSD: parseFloat(String(sessionData.openingCashUSD)) || 0,
        openingCashLBP: parseFloat(String(sessionData.openingCashLBP)) || 0,
        closingCashUSD: null,
        closingCashLBP: null,
        expectedCashUSD: parseFloat(String(sessionData.openingCashUSD)) || 0,
        expectedCashLBP: parseFloat(String(sessionData.openingCashLBP)) || 0,
        differenceUSD: null,
        differenceLBP: null,
        totalSales: 0,
        totalReturns: 0,
        totalTransactions: 0,
        status: 'open',
        syncStatus: 'synced',
      };

      setSession(posSession);
      return posSession;
    } finally {
      setSessionLoading(false);
    }
  }, [setSession]);

  const handleSessionClose = useCallback(async (
    sessionId: string,
    params: { closingCashUSD: number; closingCashLBP: number }
  ) => {
    setSessionLoading(true);
    try {
      const response = await apiClient.post(`/pos/sessions/${sessionId}/close`, params);
      setSession(null);
      return response.data.data;
    } finally {
      setSessionLoading(false);
    }
  }, [setSession]);

  const handleSaleComplete = useCallback(async (sale: any) => {
    if (!session) return;

    try {
      await apiClient.post('/pos/sales', {
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

      // Open cash drawer if hardware is available
      if (window.electronAPI?.printer?.openCashDrawer) {
        try {
          await window.electronAPI.printer.openCashDrawer();
        } catch (e) {
          console.warn('Failed to open cash drawer:', e);
        }
      }
    } catch (error) {
      console.error('Failed to save sale:', error);
      throw error;
    }
  }, [session, exchangeRate]);

  const handlePrint = useCallback(async (receiptData: any) => {
    if (window.electronAPI?.printer?.print) {
      const result = await window.electronAPI.printer.print(receiptData);
      if (!result.success) {
        console.error('Print failed:', result.error);
      }
    }
  }, []);

  const handleOpenCashDrawer = useCallback(async () => {
    if (window.electronAPI?.printer?.openCashDrawer) {
      await window.electronAPI.printer.openCashDrawer();
    }
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return <LoginForm onLogin={handleLogin} error={error} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop header with logout */}
      <div className="bg-blue-800 text-white px-4 py-1 flex justify-between items-center text-sm">
        <span>Lebanese Accounting POS - {user.name}</span>
        <button
          onClick={handleLogout}
          className="text-blue-200 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>

      {/* POS Layout from shared package */}
      <div className="flex-1">
        <POSLayout
          cashierId={user.id}
          cashierName={user.name}
          isOnline={isOnline}
          onSaleComplete={handleSaleComplete}
          onSessionOpen={handleSessionOpen}
          onSessionClose={handleSessionClose}
          onPrint={handlePrint}
          onOpenCashDrawer={handleOpenCashDrawer}
        />
      </div>
    </div>
  );
}
