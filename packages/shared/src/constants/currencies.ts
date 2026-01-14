export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  LBP: {
    code: 'LBP',
    symbol: 'ل.ل',
    name: 'Lebanese Pound',
    decimals: 0,
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export const DEFAULT_EXCHANGE_RATE = 89500;
