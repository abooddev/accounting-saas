import { apiClient } from './client';
import type { Payment, PaymentWithRelations, CreatePaymentDto } from '@accounting/shared';

export interface PaymentFilters {
  type?: 'supplier_payment' | 'expense_payment' | 'customer_receipt';
  contactId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentsApi = {
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.contactId) params.append('contactId', filters.contactId);
    if (filters?.accountId) params.append('accountId', filters.accountId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/payments?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<PaymentWithRelations> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePaymentDto): Promise<PaymentWithRelations> => {
    const response = await apiClient.post('/payments', data);
    return response.data.data;
  },

  void: async (id: string): Promise<void> => {
    await apiClient.delete(`/payments/${id}`);
  },
};
