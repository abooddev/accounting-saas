import { apiClient } from './client';
import type { Invoice, InvoiceWithItems, CreateInvoiceDto } from '@accounting/shared';

export interface InvoiceFilters {
  type?: 'purchase' | 'expense';
  status?: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';
  contactId?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceStats {
  totalPending: number;
  totalOverdue: number;
  countPending: number;
  countOverdue: number;
}

export interface DueSoonInvoice {
  id: string;
  internalNumber: string;
  dueDate: string;
  balance: string;
  currency: string;
  contactName: string;
  daysUntilDue: number;
}

export const invoicesApi = {
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.contactId) params.append('contactId', filters.contactId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/invoices?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<InvoiceWithItems> => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data.data;
  },

  getStats: async (): Promise<InvoiceStats> => {
    const response = await apiClient.get('/invoices/stats');
    return response.data.data;
  },

  getDueSoon: async (days?: number): Promise<DueSoonInvoice[]> => {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/invoices/due-soon${params}`);
    return response.data.data;
  },

  create: async (data: CreateInvoiceDto): Promise<InvoiceWithItems> => {
    const response = await apiClient.post('/invoices', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceDto>): Promise<InvoiceWithItems> => {
    const response = await apiClient.patch(`/invoices/${id}`, data);
    return response.data.data;
  },

  confirm: async (id: string): Promise<InvoiceWithItems> => {
    const response = await apiClient.post(`/invoices/${id}/confirm`);
    return response.data.data;
  },

  cancel: async (id: string): Promise<InvoiceWithItems> => {
    const response = await apiClient.post(`/invoices/${id}/cancel`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },
};
