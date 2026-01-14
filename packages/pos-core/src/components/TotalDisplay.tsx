import React from 'react';
import { formatCurrency } from '../utils/currency';

interface TotalDisplayProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalLBP: number;
  currency: 'USD' | 'LBP';
}

export function TotalDisplay({
  subtotal,
  discount,
  tax,
  total,
  totalLBP,
  currency,
}: TotalDisplayProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Discount</span>
          <span className="text-red-500">-{formatCurrency(discount, currency)}</span>
        </div>
      )}

      {tax > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span>{formatCurrency(tax, currency)}</span>
        </div>
      )}

      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-lg text-green-600">
            {formatCurrency(total, currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span></span>
          <span>{formatCurrency(totalLBP, 'LBP')}</span>
        </div>
      </div>
    </div>
  );
}
