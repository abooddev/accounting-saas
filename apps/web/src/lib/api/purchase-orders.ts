import { apiClient } from './client';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId?: string;
  description: string;
  quantityOrdered: string;
  quantityReceived: string;
  unitPrice: string;
  lineTotal: string;
  sortOrder?: string;
  createdAt?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  number: string;
  supplierId?: string;
  date: string;
  expectedDeliveryDate?: string;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  currency: string;
  exchangeRate: string;
  subtotal: string;
  taxAmount?: string;
  total: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  supplier?: {
    id: string;
    name: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderFilters {
  status?: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreatePurchaseOrderItemDto {
  productId?: string;
  description: string;
  quantityOrdered: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderDto {
  supplierId?: string;
  date: string;
  expectedDeliveryDate?: string;
  status?: 'draft' | 'sent';
  currency: string;
  exchangeRate: number;
  taxAmount?: number;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface ReceiveGoodsItemDto {
  itemId: string;
  quantityReceived: number;
}

export interface PurchaseOrderStats {
  totalDraft: number;
  totalSent: number;
  totalPending: number;
  countDraft: number;
  countSent: number;
  countPending: number;
}

export const purchaseOrdersApi = {
  getAll: async (filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await apiClient.get(`/purchase-orders?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  getStats: async (): Promise<PurchaseOrderStats> => {
    const response = await apiClient.get('/purchase-orders/stats');
    return response.data.data;
  },

  create: async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreatePurchaseOrderDto>): Promise<PurchaseOrder> => {
    const response = await apiClient.patch(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: string, status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${id}/status`, { status });
    return response.data.data;
  },

  receiveGoods: async (id: string, items: ReceiveGoodsItemDto[]): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${id}/receive`, { items });
    return response.data.data;
  },

  convertToInvoice: async (id: string): Promise<{ invoiceId: string }> => {
    const response = await apiClient.post(`/purchase-orders/${id}/convert-to-invoice`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },
};
