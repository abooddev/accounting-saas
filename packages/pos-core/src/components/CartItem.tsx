import React from 'react';
import type { CartItem as CartItemType } from '../types';
import { formatCurrency } from '../utils/currency';

interface CartItemRowProps {
  item: CartItemType;
  index: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  index,
  onQuantityChange,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-1 hover:bg-gray-100">
      <span className="w-6 text-center text-sm text-gray-400">{index}</span>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {item.nameAr && (
          <div className="text-sm text-gray-500 truncate" dir="rtl">
            {item.nameAr}
          </div>
        )}
        <div className="text-sm text-gray-500">
          {formatCurrency(item.unitPrice, item.currency)} x {item.quantity}
          {item.discountPercent > 0 && (
            <span className="text-red-500 ml-2">-{item.discountPercent}%</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(item.quantity - 1)}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
        >
          -
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-200"
        >
          +
        </button>
      </div>

      <div className="w-20 text-right font-bold">
        {formatCurrency(item.lineTotal, item.currency)}
      </div>

      <button
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
      >
        x
      </button>
    </div>
  );
}
