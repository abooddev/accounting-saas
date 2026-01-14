import { useCallback, useState } from 'react';
import { useProductsStore } from '../stores/products-store';
import type { POSProduct } from '../types';

interface LookupResult {
  found: boolean;
  product: POSProduct | null;
  pendingLink: boolean;
}

export function useProductLookup() {
  const { getProductByBarcode, getProductById, searchProducts } = useProductsStore();
  const [isLoading, setIsLoading] = useState(false);

  const lookupProduct = useCallback(
    async (barcodeOrId: string): Promise<LookupResult> => {
      setIsLoading(true);

      try {
        // First try barcode lookup
        const { product, isPending } = getProductByBarcode(barcodeOrId);

        if (product) {
          return {
            found: true,
            product,
            pendingLink: isPending,
          };
        }

        // Try as product ID
        const productById = getProductById(barcodeOrId);
        if (productById) {
          return {
            found: true,
            product: productById,
            pendingLink: false,
          };
        }

        // Not found
        return {
          found: false,
          product: null,
          pendingLink: false,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [getProductByBarcode, getProductById]
  );

  const search = useCallback(
    (query: string, limit?: number): POSProduct[] => {
      return searchProducts(query, limit);
    },
    [searchProducts]
  );

  return {
    lookupProduct,
    search,
    isLoading,
  };
}
