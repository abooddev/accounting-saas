'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi, OpenSessionInput, CloseSessionInput, CreateSaleInput } from '@/lib/api/pos';

export function useActiveSession() {
  return useQuery({
    queryKey: ['pos', 'session', 'active'],
    queryFn: () => posApi.getActiveSession(),
    refetchOnWindowFocus: false,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['pos', 'session', sessionId],
    queryFn: () => posApi.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useSessions(limit?: number) {
  return useQuery({
    queryKey: ['pos', 'sessions', limit],
    queryFn: () => posApi.getSessions(limit),
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpenSessionInput) => posApi.openSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'session'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'sessions'] });
    },
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: CloseSessionInput }) =>
      posApi.closeSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'session'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'sessions'] });
    },
  });
}

export function useSales(sessionId?: string, limit?: number) {
  return useQuery({
    queryKey: ['pos', 'sales', sessionId, limit],
    queryFn: () => posApi.getSales(sessionId, limit),
  });
}

export function useSale(saleId: string) {
  return useQuery({
    queryKey: ['pos', 'sale', saleId],
    queryFn: () => posApi.getSale(saleId),
    enabled: !!saleId,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSaleInput) => posApi.createSale(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pos', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['pos', 'session', 'active'] });
    },
  });
}
