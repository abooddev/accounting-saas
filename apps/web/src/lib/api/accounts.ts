import { apiClient } from './client';
import type { MoneyAccount, AccountMovement, CreateAccountDto } from '@accounting/shared';

export interface TransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  exchangeRate?: number;
  date: string;
  notes?: string;
}

export interface AdjustmentDto {
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
  date: string;
}

export const accountsApi = {
  getAll: async (): Promise<MoneyAccount[]> => {
    const response = await apiClient.get('/accounts');
    return response.data.data;
  },

  getById: async (id: string): Promise<MoneyAccount> => {
    const response = await apiClient.get(`/accounts/${id}`);
    return response.data.data;
  },

  getMovements: async (id: string): Promise<AccountMovement[]> => {
    const response = await apiClient.get(`/accounts/${id}/movements`);
    return response.data.data;
  },

  create: async (data: CreateAccountDto): Promise<MoneyAccount> => {
    const response = await apiClient.post('/accounts', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateAccountDto>): Promise<MoneyAccount> => {
    const response = await apiClient.patch(`/accounts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  transfer: async (data: TransferDto): Promise<void> => {
    await apiClient.post('/accounts/transfer', data);
  },

  adjust: async (id: string, data: AdjustmentDto): Promise<MoneyAccount> => {
    const response = await apiClient.post(`/accounts/${id}/adjust`, data);
    return response.data.data;
  },
};
