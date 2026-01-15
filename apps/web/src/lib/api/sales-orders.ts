import { apiClient } from './client';

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  productId: string;
  description: string;
  quantityOrdered: string;
  quantityDelivered: string;
  unitPrice: string;
  discountPercent: string | null;
  lineTotal: string;
  sortOrder: string | null;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  tenantId: string;
  number: string;
  customerId: string;
  date: string;
  expectedDeliveryDate: string | null;
  status: 'draft' | 'confirmed' | 'partial' | 'fulfilled' | 'cancelled';
  currency: string;
  exchangeRate: string;
  subtotal: string;
  discountAmount: string | null;
  taxAmount: string | null;
  total: string;
  priceListId: string | null;
  salesRepId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  items: SalesOrderItem[];
  customer?: { id: string; name: string; nameAr: string | null } | null;
  salesRep?: { id: string; name: string } | null;
}

export interface SalesOrderFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  salesRepId?: string;
}

export interface CreateSalesOrderItemDto {
  productId: string;
  description: string;
  quantityOrdered: number;
  unitPrice: number;
  discountPercent?: number;
}

export interface CreateSalesOrderDto {
  customerId: string;
  date: string;
  expectedDeliveryDate?: string;
  status?: 'draft' | 'confirmed';
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  priceListId?: string;
  salesRepId?: string;
  notes?: string;
  items: CreateSalesOrderItemDto[];
}

export interface UpdateSalesOrderDto {
  customerId?: string;
  date?: string;
  expectedDeliveryDate?: string;
  currency?: 'USD' | 'LBP';
  exchangeRate?: number;
  priceListId?: string;
  salesRepId?: string;
  notes?: string;
  items?: CreateSalesOrderItemDto[];
}

export interface DeliveryItem {
  itemId: string;
  quantityDelivered: number;
}

export interface SalesOrderStats {
  totalDraft: number;
  totalConfirmed: number;
  totalPartial: number;
  countDraft: number;
  countConfirmed: number;
  countPartial: number;
}

export const salesOrdersApi = {
  getAll: async (filters?: SalesOrderFilters): Promise<SalesOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.salesRepId) params.append('salesRepId', filters.salesRepId);

    const response = await apiClient.get(`/sales-orders?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get(`/sales-orders/${id}`);
    return response.data;
  },

  getStats: async (): Promise<SalesOrderStats> => {
    const response = await apiClient.get('/sales-orders/stats');
    return response.data;
  },

  create: async (data: CreateSalesOrderDto): Promise<SalesOrder> => {
    const response = await apiClient.post('/sales-orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSalesOrderDto): Promise<SalesOrder> => {
    const response = await apiClient.patch(`/sales-orders/${id}`, data);
    return response.data;
  },

  confirm: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`/sales-orders/${id}/confirm`);
    return response.data;
  },

  deliver: async (id: string, items: DeliveryItem[]): Promise<SalesOrder> => {
    const response = await apiClient.post(`/sales-orders/${id}/deliver`, { items });
    return response.data;
  },

  convertToInvoice: async (id: string): Promise<{ invoiceId: string }> => {
    const response = await apiClient.post(`/sales-orders/${id}/convert-to-invoice`);
    return response.data;
  },

  cancel: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post(`/sales-orders/${id}/cancel`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-orders/${id}`);
  },
};
