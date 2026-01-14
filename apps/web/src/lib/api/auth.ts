import { apiClient } from './client';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  businessName: string;
  businessSlug: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  tenant: AuthTenant;
}

export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  getMe: async (): Promise<{ user: AuthUser; tenant: AuthTenant }> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
