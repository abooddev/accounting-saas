import React, { useState, useEffect } from 'react';
import type { Cart, Payment } from '../types';
import { formatCurrency, calculateChange } from '../utils/currency';

interface PaymentModalProps {
  cart: Cart;
  onComplete: (payment: Payment) => void;
  onCancel: () => void;
}

export function PaymentModal({ cart, onComplete, onCancel }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash_usd' | 'cash_lbp' | 'mixed'>('cash_usd');
  const [cashReceivedUSD, setCashReceivedUSD] = useState<string>('');
  const [cashReceivedLBP, setCashReceivedLBP] = useState<string>('');

  const quickAmountsUSD = [5, 10, 20, 50, 100];
  const quickAmountsLBP = [100000, 500000, 1000000, 2000000, 5000000];

  const receivedUSD = parseFloat(cashReceivedUSD) || 0;
  const receivedLBP = parseFloat(cashReceivedLBP) || 0;

  const change = calculateChange({
    totalUSD: cart.total,
    totalLBP: cart.totalLBP,
    receivedUSD,
    receivedLBP,
    exchangeRate: cart.exchangeRate,
    preferredChangeCurrency: 'LBP',
  });

  const canComplete = change.totalReceivedUSD >= cart.total;

  const handleComplete = () => {
    if (!canComplete) return;

    const payment: Payment = {
      method: paymentMethod,
      amountUSD: cart.total,
      amountLBP: cart.totalLBP,
      cashReceivedUSD: receivedUSD,
      cashReceivedLBP: receivedLBP,
      changeUSD: change.changeUSD,
      changeLBP: change.changeLBP,
      exchangeRate: cart.exchangeRate,
    };

    onComplete(payment);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && canComplete) {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canComplete, onCancel]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Payment</h2>
        </div>

        <div className="p-4 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(cart.total, 'USD')}
            </div>
            <div className="text-lg text-gray-600">
              {formatCurrency(cart.totalLBP, 'LBP')}
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('cash_usd')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'cash_usd'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              Cash USD
            </button>
            <button
              onClick={() => setPaymentMethod('cash_lbp')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'cash_lbp'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              Cash LBP
            </button>
            <button
              onClick={() => setPaymentMethod('mixed')}
              className={`flex-1 py-2 rounded border ${
                paymentMethod === 'mixed'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              Mixed
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {(paymentMethod === 'cash_usd' || paymentMethod === 'mixed') && (
            <div>
              <label className="block text-sm font-medium mb-1">Cash Received (USD)</label>
              <input
                type="number"
                value={cashReceivedUSD}
                onChange={(e) => setCashReceivedUSD(e.target.value)}
                className="w-full px-3 py-2 border rounded text-lg"
                placeholder="0.00"
                autoFocus={paymentMethod === 'cash_usd'}
              />
              <div className="flex gap-2 mt-2">
                {quickAmountsUSD.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceivedUSD(amount.toString())}
                    className="flex-1 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  onClick={() => setCashReceivedUSD(cart.total.toFixed(2))}
                  className="flex-1 py-1 text-sm border rounded bg-green-50 hover:bg-green-100 text-green-700"
                >
                  Exact
                </button>
              </div>
            </div>
          )}

          {(paymentMethod === 'cash_lbp' || paymentMethod === 'mixed') && (
            <div>
              <label className="block text-sm font-medium mb-1">Cash Received (LBP)</label>
              <input
                type="number"
                value={cashReceivedLBP}
                onChange={(e) => setCashReceivedLBP(e.target.value)}
                className="w-full px-3 py-2 border rounded text-lg"
                placeholder="0"
                autoFocus={paymentMethod === 'cash_lbp'}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {quickAmountsLBP.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceivedLBP(amount.toString())}
                    className="py-1 px-2 text-sm border rounded hover:bg-gray-50"
                  >
                    {(amount / 1000).toFixed(0)}K
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCashReceivedLBP((Math.ceil(cart.totalLBP / 1000) * 1000).toString())
                  }
                  className="py-1 px-2 text-sm border rounded bg-green-50 hover:bg-green-100 text-green-700"
                >
                  Round Up
                </button>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-lg ${canComplete ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-sm text-gray-600 mb-1">
              {canComplete ? 'Change Due:' : 'Amount Due:'}
            </div>
            <div className="text-2xl font-bold">
              {canComplete ? (
                <>
                  {change.changeUSD > 0 && (
                    <span className="text-green-600 mr-2">
                      {formatCurrency(change.changeUSD, 'USD')}
                    </span>
                  )}
                  {change.changeLBP > 0 && (
                    <span className="text-green-600">
                      {formatCurrency(change.changeLBP, 'LBP')}
                    </span>
                  )}
                  {change.changeUSD === 0 && change.changeLBP === 0 && (
                    <span className="text-green-600">Exact Amount</span>
                  )}
                </>
              ) : (
                <span className="text-red-600">
                  {formatCurrency(cart.total - change.totalReceivedUSD, 'USD')} remaining
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
          >
            Cancel (Esc)
          </button>
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold
                       hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Complete (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
