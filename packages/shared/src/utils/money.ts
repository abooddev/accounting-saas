import { CURRENCIES, CurrencyCode, DEFAULT_EXCHANGE_RATE } from '../constants/currencies';

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const currencyInfo = CURRENCIES[currency];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals,
  }).format(amount);
}

export function formatMoneyCompact(
  amount: number,
  currency: CurrencyCode = 'USD'
): string {
  const currencyInfo = CURRENCIES[currency];
  const symbol = currencyInfo.symbol;

  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return `${symbol}${amount.toFixed(currencyInfo.decimals)}`;
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (from === to) return amount;

  if (from === 'USD' && to === 'LBP') {
    return amount * exchangeRate;
  }

  if (from === 'LBP' && to === 'USD') {
    return amount / exchangeRate;
  }

  return amount;
}

export function roundMoney(amount: number, currency: CurrencyCode = 'USD'): number {
  const decimals = CURRENCIES[currency].decimals;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
