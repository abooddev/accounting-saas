import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Cart, CartItem, POSProduct } from '../types';
import { calculateTotals } from '../utils/currency';

interface CartState {
  cart: Cart;
  addItem: (product: POSProduct, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemDiscount: (itemId: string, percent: number) => void;
  setOrderDiscount: (percent: number) => void;
  setCustomer: (customerId: string | null, name: string | null) => void;
  setExchangeRate: (rate: number) => void;
  clearCart: () => void;
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
  taxRate: 0,
  taxAmount: 0,
  total: 0,
  currency: 'USD',
  exchangeRate: 89500,
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
        newItems = state.cart.items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                lineTotal:
                  (item.quantity + quantity) *
                  item.unitPrice *
                  (1 - item.discountPercent / 100),
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: uuidv4(),
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
              lineTotal:
                quantity * item.unitPrice * (1 - item.discountPercent / 100),
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
              lineTotal:
                item.quantity * item.unitPrice * (1 - percent / 100),
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
