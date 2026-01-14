'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSupplierPayables() {
  return useQuery({
    queryKey: ['dashboard', 'payables'],
    queryFn: () => dashboardApi.getPayables(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => dashboardApi.getRecent(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useDueThisWeek() {
  return useQuery({
    queryKey: ['dashboard', 'due-this-week'],
    queryFn: () => dashboardApi.getDueThisWeek(),
    staleTime: 60 * 1000, // 1 minute
  });
}
