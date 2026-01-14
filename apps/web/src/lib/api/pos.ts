import { apiClient } from './client';
import type { POSSession, Sale } from '@accounting/pos-core';

export interface OpenSessionInput {
  terminalId: string;
  terminalCode: string;
  openingCashUSD: number;
  openingCashLBP: number;
}

export interface CloseSessionInput {
  closingCashUSD: number;
  closingCashLBP: number;
}

export interface CreateSaleInput {
  sessionId: string;
  localId?: string;
  customerId?: string;
  customerName?: string;
  items: {
    productId: string;
    barcode?: string;
    productName: string;
    productNameAr?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  totalLBP: number;
  payment: {
    method: 'cash_usd' | 'cash_lbp' | 'card' | 'mixed';
    amountUSD: number;
    amountLBP: number;
    cashReceivedUSD: number;
    cashReceivedLBP: number;
    changeUSD: number;
    changeLBP: number;
  };
}

export const posApi = {
  // Session endpoints
  openSession: async (data: OpenSessionInput): Promise<POSSession> => {
    const response = await apiClient.post('/pos/sessions/open', data);
    return response.data.data;
  },

  closeSession: async (sessionId: string, data: CloseSessionInput): Promise<POSSession> => {
    const response = await apiClient.post(`/pos/sessions/${sessionId}/close`, data);
    return response.data.data;
  },

  getActiveSession: async (): Promise<POSSession | null> => {
    const response = await apiClient.get('/pos/sessions/active');
    return response.data.data;
  },

  getSession: async (sessionId: string): Promise<POSSession> => {
    const response = await apiClient.get(`/pos/sessions/${sessionId}`);
    return response.data.data;
  },

  getSessions: async (limit?: number): Promise<POSSession[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/pos/sessions${params}`);
    return response.data.data;
  },

  // Sales endpoints
  createSale: async (data: CreateSaleInput): Promise<Sale> => {
    const response = await apiClient.post('/pos/sales', data);
    return response.data.data;
  },

  getSales: async (sessionId?: string, limit?: number): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (limit) params.append('limit', String(limit));
    const queryString = params.toString();
    const response = await apiClient.get(`/pos/sales${queryString ? `?${queryString}` : ''}`);
    return response.data.data;
  },

  getSale: async (saleId: string): Promise<Sale> => {
    const response = await apiClient.get(`/pos/sales/${saleId}`);
    return response.data.data;
  },
};
