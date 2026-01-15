import { apiClient } from './client';

export interface Quote {
  id: string;
  tenantId: string;
  number: string;
  customerId: string;
  date: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  currency: string;
  exchangeRate: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  terms: string | null;
  notes: string | null;
  rejectionReason: string | null;
  convertedToType: string | null;
  convertedToId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  lineTotal: string;
  sortOrder: string;
  createdAt: string;
}

export interface QuoteWithItems extends Quote {
  items: QuoteItem[];
  customer?: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
}

export interface QuoteFilters {
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface QuoteStats {
  totalDraft: number;
  totalSent: number;
  totalAccepted: number;
  countDraft: number;
  countSent: number;
  countAccepted: number;
  countExpired: number;
  countRejected: number;
  countConverted: number;
}

export interface CreateQuoteDto {
  customerId: string;
  date: string;
  validUntil: string;
  status?: 'draft' | 'sent';
  currency: string;
  exchangeRate: number;
  terms?: string;
  notes?: string;
  items: CreateQuoteItemDto[];
}

export interface CreateQuoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface UpdateQuoteDto {
  customerId?: string;
  date?: string;
  validUntil?: string;
  currency?: string;
  exchangeRate?: number;
  terms?: string;
  notes?: string;
  items?: CreateQuoteItemDto[];
}

export const quotesApi = {
  getAll: async (filters?: QuoteFilters): Promise<QuoteWithItems[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/quotes?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<QuoteWithItems> => {
    const response = await apiClient.get(`/quotes/${id}`);
    return response.data;
  },

  getStats: async (): Promise<QuoteStats> => {
    const response = await apiClient.get('/quotes/stats');
    return response.data;
  },

  getExpiringSoon: async (days?: number): Promise<QuoteWithItems[]> => {
    const params = days ? `?days=${days}` : '';
    const response = await apiClient.get(`/quotes/expiring-soon${params}`);
    return response.data;
  },

  create: async (data: CreateQuoteDto): Promise<QuoteWithItems> => {
    const response = await apiClient.post('/quotes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateQuoteDto): Promise<QuoteWithItems> => {
    const response = await apiClient.patch(`/quotes/${id}`, data);
    return response.data;
  },

  send: async (id: string): Promise<QuoteWithItems> => {
    const response = await apiClient.post(`/quotes/${id}/send`);
    return response.data;
  },

  accept: async (id: string): Promise<QuoteWithItems> => {
    const response = await apiClient.post(`/quotes/${id}/accept`);
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<QuoteWithItems> => {
    const response = await apiClient.post(`/quotes/${id}/reject`, { reason });
    return response.data;
  },

  convertToSalesOrder: async (id: string): Promise<{ salesOrderId: string }> => {
    const response = await apiClient.post(`/quotes/${id}/convert-to-sales-order`);
    return response.data;
  },

  convertToInvoice: async (id: string): Promise<{ invoiceId: string }> => {
    const response = await apiClient.post(`/quotes/${id}/convert-to-invoice`);
    return response.data;
  },

  duplicate: async (id: string): Promise<QuoteWithItems> => {
    const response = await apiClient.post(`/quotes/${id}/duplicate`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quotes/${id}`);
  },
};
