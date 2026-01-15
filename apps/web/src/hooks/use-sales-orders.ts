'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  salesOrdersApi,
  SalesOrderFilters,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  DeliveryItem,
} from '@/lib/api/sales-orders';

export function useSalesOrders(filters?: SalesOrderFilters) {
  return useQuery({
    queryKey: ['sales-orders', filters],
    queryFn: () => salesOrdersApi.getAll(filters),
  });
}

export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: ['sales-orders', id],
    queryFn: () => salesOrdersApi.getById(id),
    enabled: !!id,
  });
}

export function useSalesOrderStats() {
  return useQuery({
    queryKey: ['sales-orders', 'stats'],
    queryFn: () => salesOrdersApi.getStats(),
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderDto) => salesOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesOrderDto }) =>
      salesOrdersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', id] });
    },
  });
}

export function useConfirmSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.confirm(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeliverSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: DeliveryItem[] }) =>
      salesOrdersApi.deliver(id, items),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useConvertSalesOrderToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.convertToInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCancelSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
