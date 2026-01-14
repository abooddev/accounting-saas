import { create } from 'zustand';
import type { POSProduct, PendingBarcodeLink } from '../types';

interface ProductsState {
  products: Map<string, POSProduct>;
  barcodeIndex: Map<string, string>; // barcode -> productId
  pendingBarcodeLinks: Map<string, PendingBarcodeLink>;
  lastSync: Date | null;
  isLoading: boolean;

  setProducts: (products: POSProduct[]) => void;
  getProductById: (id: string) => POSProduct | undefined;
  getProductByBarcode: (barcode: string) => { product: POSProduct | undefined; isPending: boolean };
  searchProducts: (query: string, limit?: number) => POSProduct[];
  addPendingBarcodeLink: (barcode: string, productId: string, linkedBy: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: new Map(),
  barcodeIndex: new Map(),
  pendingBarcodeLinks: new Map(),
  lastSync: null,
  isLoading: false,

  setProducts: (products) => {
    const productMap = new Map<string, POSProduct>();
    const barcodeMap = new Map<string, string>();

    for (const product of products) {
      productMap.set(product.id, product);
      if (product.barcode) {
        barcodeMap.set(product.barcode, product.id);
      }
    }

    set({
      products: productMap,
      barcodeIndex: barcodeMap,
      lastSync: new Date(),
    });
  },

  getProductById: (id) => {
    return get().products.get(id);
  },

  getProductByBarcode: (barcode) => {
    const state = get();

    // First check official barcode index
    const productId = state.barcodeIndex.get(barcode);
    if (productId) {
      return { product: state.products.get(productId), isPending: false };
    }

    // Check pending barcode links
    const pendingLink = state.pendingBarcodeLinks.get(barcode);
    if (pendingLink) {
      return { product: state.products.get(pendingLink.productId), isPending: true };
    }

    return { product: undefined, isPending: false };
  },

  searchProducts: (query, limit = 20) => {
    const state = get();
    const lowerQuery = query.toLowerCase();
    const results: POSProduct[] = [];

    for (const product of state.products.values()) {
      if (results.length >= limit) break;

      const matches =
        product.name.toLowerCase().includes(lowerQuery) ||
        product.nameAr?.includes(query) ||
        product.barcode?.includes(query) ||
        product.sku?.toLowerCase().includes(lowerQuery);

      if (matches) {
        results.push(product);
      }
    }

    return results;
  },

  addPendingBarcodeLink: (barcode, productId, linkedBy) => {
    set((state) => {
      const newLinks = new Map(state.pendingBarcodeLinks);
      newLinks.set(barcode, {
        barcode,
        productId,
        linkedBy,
        linkedAt: new Date(),
        syncStatus: 'pending',
      });
      return { pendingBarcodeLinks: newLinks };
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
