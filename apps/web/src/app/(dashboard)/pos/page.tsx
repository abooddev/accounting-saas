'use client';

import { useEffect, useState } from 'react';
import { POSLayout, useProductsStore, POSProduct } from '@accounting/pos-core';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api/client';

export default function POSPage() {
  const { user } = useAuthStore();
  const { setProducts, setExchangeRate } = useProductsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
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
  }, [setProducts, setExchangeRate]);

  const handleSaleComplete = async (sale: any) => {
    console.log('Sale completed:', sale);
    // TODO: Save sale to API
  };

  if (isLoading) {
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
    />
  );
}
