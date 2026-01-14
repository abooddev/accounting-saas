'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, type DateRangeParams } from '@/lib/api/reports';

export function useProfitLoss(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['reports', 'profit-loss', params],
    queryFn: () => reportsApi.getProfitLoss(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSupplierBalances() {
  return useQuery({
    queryKey: ['reports', 'supplier-balances'],
    queryFn: () => reportsApi.getSupplierBalances(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSupplierStatement(contactId: string, params?: DateRangeParams) {
  return useQuery({
    queryKey: ['reports', 'supplier-statement', contactId, params],
    queryFn: () => reportsApi.getSupplierStatement(contactId, params),
    enabled: !!contactId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSupplierHistory(contactId: string, months?: number) {
  return useQuery({
    queryKey: ['reports', 'supplier-history', contactId, months],
    queryFn: () => reportsApi.getSupplierHistory(contactId, months),
    enabled: !!contactId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useExpensesByCategory(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['reports', 'expenses-by-category', params],
    queryFn: () => reportsApi.getExpensesByCategory(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePaymentsDue() {
  return useQuery({
    queryKey: ['reports', 'payments-due'],
    queryFn: () => reportsApi.getPaymentsDue(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCashFlow(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', params],
    queryFn: () => reportsApi.getCashFlow(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useInventoryValue() {
  return useQuery({
    queryKey: ['reports', 'inventory-value'],
    queryFn: () => reportsApi.getInventoryValue(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => reportsApi.getLowStock(),
    staleTime: 60 * 1000, // 1 minute
  });
}
