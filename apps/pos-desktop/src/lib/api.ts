import axios from 'axios';

// API URL - can be configured via environment variable or stored setting
const DEFAULT_API_URL = 'http://localhost:3001';

// Get API URL from localStorage or use default
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('apiUrl') || DEFAULT_API_URL;
  }
  return DEFAULT_API_URL;
};

export const apiClient = axios.create({
  baseURL: `${getApiUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
  tenantSlug: string
) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('tenantSlug', tenantSlug);
};

export const getAuthTokens = () => ({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  tenantSlug: localStorage.getItem('tenantSlug'),
});

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tenantSlug');
};

// Set API URL (for configuration)
export const setApiUrl = (url: string) => {
  localStorage.setItem('apiUrl', url);
  apiClient.defaults.baseURL = `${url}/api`;
};

// Request interceptor - add auth headers
apiClient.interceptors.request.use((config) => {
  const { accessToken, tenantSlug } = getAuthTokens();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, tenantSlug } = getAuthTokens();

        if (refreshToken) {
          const response = await axios.post(`${getApiUrl()}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          setAuthTokens(newAccessToken, newRefreshToken, tenantSlug || '');

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        clearAuthTokens();
        // In Electron, we don't redirect - the app will show login screen
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
