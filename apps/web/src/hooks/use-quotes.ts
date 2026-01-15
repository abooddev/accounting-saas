'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotesApi, QuoteFilters, CreateQuoteDto, UpdateQuoteDto } from '@/lib/api/quotes';

export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quotesApi.getAll(filters),
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => quotesApi.getById(id),
    enabled: !!id,
  });
}

export function useQuoteStats() {
  return useQuery({
    queryKey: ['quotes', 'stats'],
    queryFn: () => quotesApi.getStats(),
  });
}

export function useExpiringSoonQuotes(days?: number) {
  return useQuery({
    queryKey: ['quotes', 'expiring-soon', days],
    queryFn: () => quotesApi.getExpiringSoon(days),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuoteDto) => quotesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuoteDto }) =>
      quotesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.send(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.accept(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      quotesApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useConvertQuoteToSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.convertToSalesOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}

export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.convertToInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
