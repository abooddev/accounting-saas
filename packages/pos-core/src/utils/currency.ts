import type { Cart } from '../types';

export function formatCurrency(amount: number, currency: 'USD' | 'LBP'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function convertToLBP(amountUSD: number, exchangeRate: number): number {
  return Math.round(amountUSD * exchangeRate);
}

export function convertToUSD(amountLBP: number, exchangeRate: number): number {
  return amountLBP / exchangeRate;
}

export function calculateTotals(cart: Cart): Cart {
  const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = subtotal * (cart.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (cart.taxRate / 100);
  const total = afterDiscount + taxAmount;
  const totalLBP = convertToLBP(total, cart.exchangeRate);

  return {
    ...cart,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    totalLBP,
  };
}

export interface ChangeCalculation {
  totalReceivedUSD: number;
  totalReceivedLBP: number;
  changeUSD: number;
  changeLBP: number;
}

export function calculateChange(params: {
  totalUSD: number;
  totalLBP: number;
  receivedUSD: number;
  receivedLBP: number;
  exchangeRate: number;
  preferredChangeCurrency: 'USD' | 'LBP';
}): ChangeCalculation {
  const { totalUSD, receivedUSD, receivedLBP, exchangeRate, preferredChangeCurrency } = params;

  // Convert everything to USD for calculation
  const receivedLBPInUSD = receivedLBP / exchangeRate;
  const totalReceivedUSD = receivedUSD + receivedLBPInUSD;

  if (totalReceivedUSD < totalUSD) {
    // Not enough money
    return {
      totalReceivedUSD,
      totalReceivedLBP: receivedLBP,
      changeUSD: 0,
      changeLBP: 0,
    };
  }

  const changeInUSD = totalReceivedUSD - totalUSD;

  if (preferredChangeCurrency === 'LBP') {
    // Give change in LBP (Lebanese preference - keep USD)
    return {
      totalReceivedUSD,
      totalReceivedLBP: receivedLBP,
      changeUSD: 0,
      changeLBP: Math.round(changeInUSD * exchangeRate),
    };
  }

  // Give change in USD
  return {
    totalReceivedUSD,
    totalReceivedLBP: receivedLBP,
    changeUSD: Math.round(changeInUSD * 100) / 100,
    changeLBP: 0,
  };
}
