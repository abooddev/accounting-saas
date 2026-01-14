import { apiClient } from './client';
import type { ExchangeRate, CreateExchangeRateDto } from '@accounting/shared';

export const exchangeRatesApi = {
  getAll: async (): Promise<ExchangeRate[]> => {
    const response = await apiClient.get('/exchange-rates');
    return response.data.data;
  },

  getCurrent: async (): Promise<ExchangeRate> => {
    const response = await apiClient.get('/exchange-rates/current');
    return response.data.data;
  },

  create: async (data: CreateExchangeRateDto): Promise<ExchangeRate> => {
    const response = await apiClient.post('/exchange-rates', data);
    return response.data.data;
  },
};
