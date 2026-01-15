'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  purchaseOrdersApi,
  PurchaseOrderFilters,
  CreatePurchaseOrderDto,
  ReceiveGoodsItemDto,
} from '@/lib/api/purchase-orders';

export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => purchaseOrdersApi.getAll(filters),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !!id,
  });
}

export function usePurchaseOrderStats() {
  return useQuery({
    queryKey: ['purchase-orders', 'stats'],
    queryFn: () => purchaseOrdersApi.getStats(),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderDto) => purchaseOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePurchaseOrderDto> }) =>
      purchaseOrdersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled' }) =>
      purchaseOrdersApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
    },
  });
}

export function useReceiveGoods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: ReceiveGoodsItemDto[] }) =>
      purchaseOrdersApi.receiveGoods(id, items),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useConvertToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.convertToInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
