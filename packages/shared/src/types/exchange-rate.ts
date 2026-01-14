export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  effectiveDate: string;
  source: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateExchangeRateDto {
  fromCurrency?: string;
  toCurrency?: string;
  rate: number;
  effectiveDate: string;
  source?: string;
}
