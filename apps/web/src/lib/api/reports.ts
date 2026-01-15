import { apiClient } from './client';
import type {
  ProfitLossReport,
  SupplierBalancesReport,
  SupplierStatementReport,
  SupplierHistoryReport,
  ExpensesByCategoryReport,
  PaymentsDueReport,
  CashFlowReport,
  InventoryValueReport,
  BalanceSheetReport,
  TrialBalanceReport,
} from '@accounting/shared';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const reportsApi = {
  getProfitLoss: async (params?: DateRangeParams): Promise<ProfitLossReport> => {
    const response = await apiClient.get('/reports/profit-loss', { params });
    return response.data.data;
  },

  getSupplierBalances: async (): Promise<SupplierBalancesReport> => {
    const response = await apiClient.get('/reports/supplier-balances');
    return response.data.data;
  },

  getSupplierStatement: async (
    contactId: string,
    params?: DateRangeParams
  ): Promise<SupplierStatementReport> => {
    const response = await apiClient.get(`/reports/supplier-statement/${contactId}`, { params });
    return response.data.data;
  },

  getSupplierHistory: async (
    contactId: string,
    months?: number
  ): Promise<SupplierHistoryReport> => {
    const response = await apiClient.get(`/reports/supplier-history/${contactId}`, {
      params: months ? { months } : undefined,
    });
    return response.data.data;
  },

  getExpensesByCategory: async (params?: DateRangeParams): Promise<ExpensesByCategoryReport> => {
    const response = await apiClient.get('/reports/expenses-by-category', { params });
    return response.data.data;
  },

  getPaymentsDue: async (): Promise<PaymentsDueReport> => {
    const response = await apiClient.get('/reports/payments-due');
    return response.data.data;
  },

  getCashFlow: async (params?: DateRangeParams): Promise<CashFlowReport> => {
    const response = await apiClient.get('/reports/cash-flow', { params });
    return response.data.data;
  },

  getInventoryValue: async (): Promise<InventoryValueReport> => {
    const response = await apiClient.get('/reports/inventory-value');
    return response.data.data;
  },

  getLowStock: async (): Promise<InventoryValueReport['lowStock']> => {
    const response = await apiClient.get('/reports/low-stock');
    return response.data.data;
  },

  getBalanceSheet: async (asOfDate?: string): Promise<BalanceSheetReport> => {
    const response = await apiClient.get('/reports/balance-sheet', {
      params: asOfDate ? { asOfDate } : undefined,
    });
    return response.data.data;
  },

  getTrialBalance: async (asOfDate?: string): Promise<TrialBalanceReport> => {
    const response = await apiClient.get('/reports/trial-balance', {
      params: asOfDate ? { asOfDate } : undefined,
    });
    return response.data.data;
  },
};
