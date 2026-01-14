import { apiClient } from './client';
import type { Category, CategoryWithChildren, CreateCategoryInput, UpdateCategoryInput } from '@accounting/shared';

export const categoriesApi = {
  getAll: async (): Promise<CategoryWithChildren[]> => {
    const response = await apiClient.get('/categories');
    return response.data.data;
  },

  getById: async (id: string): Promise<CategoryWithChildren> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateCategoryInput): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
