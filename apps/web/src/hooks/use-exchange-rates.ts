'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exchangeRatesApi } from '@/lib/api/exchange-rates';
import type { CreateExchangeRateDto } from '@accounting/shared';

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => exchangeRatesApi.getAll(),
  });
}

export function useCurrentExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rates', 'current'],
    queryFn: () => exchangeRatesApi.getCurrent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExchangeRateDto) => exchangeRatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });
}
