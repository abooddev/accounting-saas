import React from 'react';
import { useCartStore } from '../stores/cart-store';
import { CartItemRow } from './CartItem';

export function CartPanel() {
  const { cart, updateQuantity, removeItem } = useCartStore();

  if (cart.items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
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
        <div className="text-sm text-gray-500 mb-2">{cart.items.length} item(s)</div>

        {cart.items.map((item, index) => (
          <CartItemRow
            key={item.id}
            item={item}
            index={index + 1}
            onQuantityChange={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
