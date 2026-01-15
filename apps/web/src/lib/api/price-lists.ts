import { apiClient } from './client';

export interface PriceList {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  currency: 'USD' | 'LBP';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: string;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    nameAr: string | null;
  };
}

export interface PriceListWithItems extends PriceList {
  items: PriceListItem[];
}

export interface CreatePriceListInput {
  name: string;
  nameAr?: string;
  currency?: 'USD' | 'LBP';
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdatePriceListInput {
  name?: string;
  nameAr?: string;
  currency?: 'USD' | 'LBP';
  isDefault?: boolean;
  isActive?: boolean;
}

export interface AddPriceListItemInput {
  productId: string;
  price: number;
  minQuantity?: number;
}

export interface UpdatePriceListItemInput {
  price?: number;
  minQuantity?: number;
}

export const priceListsApi = {
  getAll: async (): Promise<PriceList[]> => {
    const response = await apiClient.get('/price-lists');
    return response.data.data;
  },

  getById: async (id: string): Promise<PriceListWithItems> => {
    const response = await apiClient.get(`/price-lists/${id}`);
    return response.data.data;
  },

  getDefault: async (): Promise<PriceList | null> => {
    const response = await apiClient.get('/price-lists/default');
    return response.data.data;
  },

  create: async (data: CreatePriceListInput): Promise<PriceList> => {
    const response = await apiClient.post('/price-lists', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdatePriceListInput): Promise<PriceList> => {
    const response = await apiClient.patch(`/price-lists/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/price-lists/${id}`);
  },

  addItems: async (priceListId: string, items: AddPriceListItemInput[]): Promise<PriceListItem[]> => {
    const response = await apiClient.post(`/price-lists/${priceListId}/items`, { items });
    return response.data.data;
  },

  updateItem: async (itemId: string, data: UpdatePriceListItemInput): Promise<PriceListItem> => {
    const response = await apiClient.patch(`/price-lists/items/${itemId}`, data);
    return response.data.data;
  },

  removeItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/price-lists/items/${itemId}`);
  },
};
