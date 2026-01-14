import { useCartStore } from '../stores/cart-store';

export function useCart() {
  const store = useCartStore();

  return {
    cart: store.cart,
    addItem: store.addItem,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
    setItemDiscount: store.setItemDiscount,
    setOrderDiscount: store.setOrderDiscount,
    setCustomer: store.setCustomer,
    setExchangeRate: store.setExchangeRate,
    clearCart: store.clearCart,
    itemCount: store.getItemCount(),
    isEmpty: store.isEmpty(),
  };
}
