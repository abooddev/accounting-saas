'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  priceListsApi,
  type CreatePriceListInput,
  type UpdatePriceListInput,
  type AddPriceListItemInput,
  type UpdatePriceListItemInput,
} from '@/lib/api/price-lists';

export function usePriceLists() {
  return useQuery({
    queryKey: ['price-lists'],
    queryFn: () => priceListsApi.getAll(),
  });
}

export function usePriceList(id: string) {
  return useQuery({
    queryKey: ['price-lists', id],
    queryFn: () => priceListsApi.getById(id),
    enabled: !!id,
  });
}

export function useDefaultPriceList() {
  return useQuery({
    queryKey: ['price-lists', 'default'],
    queryFn: () => priceListsApi.getDefault(),
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePriceListInput) => priceListsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePriceListInput }) =>
      priceListsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['price-lists', id] });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => priceListsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useAddPriceListItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ priceListId, items }: { priceListId: string; items: AddPriceListItemInput[] }) =>
      priceListsApi.addItems(priceListId, items),
    onSuccess: (_, { priceListId }) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists', priceListId] });
    },
  });
}

export function useUpdatePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data, priceListId }: { itemId: string; data: UpdatePriceListItemInput; priceListId: string }) =>
      priceListsApi.updateItem(itemId, data),
    onSuccess: (_, { priceListId }) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists', priceListId] });
    },
  });
}

export function useRemovePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; priceListId: string }) =>
      priceListsApi.removeItem(itemId),
    onSuccess: (_, { priceListId }) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists', priceListId] });
    },
  });
}
