import { apiClient } from './client';
import type { Contact, CreateContactInput, UpdateContactInput, ContactFilters } from '@accounting/shared';

export const contactsApi = {
  getAll: async (filters?: ContactFilters): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

    const response = await apiClient.get(`/contacts?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateContactInput): Promise<Contact> => {
    const response = await apiClient.post('/contacts', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateContactInput): Promise<Contact> => {
    const response = await apiClient.patch(`/contacts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};
