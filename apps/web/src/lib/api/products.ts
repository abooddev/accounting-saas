import { apiClient } from './client';
import type { Product, ProductWithCategory, CreateProductInput, UpdateProductInput, ProductFilters } from '@accounting/shared';

export const productsApi = {
  getAll: async (filters?: ProductFilters): Promise<ProductWithCategory[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.lowStock) params.append('lowStock', 'true');

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<ProductWithCategory> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  getByBarcode: async (barcode: string): Promise<ProductWithCategory> => {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data.data;
  },

  create: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
