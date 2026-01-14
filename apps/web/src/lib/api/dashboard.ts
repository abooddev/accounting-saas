import { apiClient } from './client';

export interface DashboardSummary {
  cashPosition: {
    usd: number;
    lbp: number;
  };
  payables: {
    total: number;
    overdue: number;
    count: number;
    overdueCount: number;
  };
}

export interface SupplierPayable {
  id: string;
  name: string;
  nameAr: string | null;
  balanceUsd: number;
  balanceLbp: number;
}

export interface RecentInvoice {
  id: string;
  type: string;
  internalNumber: string;
  date: string;
  total: string;
  currency: string;
  status: string;
  contactName: string | null;
}

export interface RecentPayment {
  id: string;
  paymentNumber: string;
  date: string;
  amount: string;
  currency: string;
  contactName: string | null;
}

export interface RecentActivity {
  invoices: RecentInvoice[];
  payments: RecentPayment[];
}

export interface DueInvoice {
  id: string;
  internalNumber: string;
  dueDate: string;
  balance: string;
  currency: string;
  contactName: string | null;
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data.data;
  },

  getPayables: async (): Promise<SupplierPayable[]> => {
    const response = await apiClient.get('/dashboard/payables');
    return response.data.data;
  },

  getRecent: async (): Promise<RecentActivity> => {
    const response = await apiClient.get('/dashboard/recent');
    return response.data.data;
  },

  getDueThisWeek: async (): Promise<DueInvoice[]> => {
    const response = await apiClient.get('/dashboard/due-this-week');
    return response.data.data;
  },
};
