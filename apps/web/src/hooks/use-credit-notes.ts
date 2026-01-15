'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  creditNotesApi,
  CreditNoteFilters,
  CreateCreditNoteDto,
  UpdateCreditNoteDto,
  ApplyCreditNoteDto,
} from '@/lib/api/credit-notes';

// ============================================================================
// Query Keys
// ============================================================================

export const creditNotesKeys = {
  all: ['credit-notes'] as const,
  lists: () => [...creditNotesKeys.all, 'list'] as const,
  list: (filters?: CreditNoteFilters) => [...creditNotesKeys.lists(), filters] as const,
  details: () => [...creditNotesKeys.all, 'detail'] as const,
  detail: (id: string) => [...creditNotesKeys.details(), id] as const,
  stats: () => [...creditNotesKeys.all, 'stats'] as const,
  unapplied: (contactId: string) => [...creditNotesKeys.all, 'unapplied', contactId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all credit/debit notes with optional filtering
 */
export function useCreditNotes(filters?: CreditNoteFilters) {
  return useQuery({
    queryKey: creditNotesKeys.list(filters),
    queryFn: () => creditNotesApi.getAll(filters),
  });
}

/**
 * Fetch a single credit/debit note by ID
 */
export function useCreditNote(id: string) {
  return useQuery({
    queryKey: creditNotesKeys.detail(id),
    queryFn: () => creditNotesApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Fetch credit/debit notes statistics
 */
export function useCreditNoteStats() {
  return useQuery({
    queryKey: creditNotesKeys.stats(),
    queryFn: () => creditNotesApi.getStats(),
  });
}

/**
 * Fetch unapplied credits for a specific contact
 */
export function useUnappliedCredits(contactId: string) {
  return useQuery({
    queryKey: creditNotesKeys.unapplied(contactId),
    queryFn: () => creditNotesApi.getUnappliedCredits(contactId),
    enabled: !!contactId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new credit or debit note
 */
export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditNoteDto) => creditNotesApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
      // Invalidate unapplied credits for the contact
      if (data.contactId) {
        queryClient.invalidateQueries({
          queryKey: creditNotesKeys.unapplied(data.contactId),
        });
      }
    },
  });
}

/**
 * Update a draft credit/debit note
 */
export function useUpdateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCreditNoteDto }) =>
      creditNotesApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
      // Invalidate unapplied credits for the contact
      if (data.contactId) {
        queryClient.invalidateQueries({
          queryKey: creditNotesKeys.unapplied(data.contactId),
        });
      }
    },
  });
}

/**
 * Delete a draft credit/debit note
 */
export function useDeleteCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
    },
  });
}

/**
 * Issue a credit/debit note (change from draft to issued)
 * This updates the contact's balance
 */
export function useIssueCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditNotesApi.issue(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
      // Contact balance is affected
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Unapplied credits for this contact
      if (data.contactId) {
        queryClient.invalidateQueries({
          queryKey: creditNotesKeys.unapplied(data.contactId),
        });
      }
      // Dashboard may show credit note stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Apply a credit note to an invoice
 */
export function useApplyCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApplyCreditNoteDto }) =>
      creditNotesApi.applyToInvoice(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
      // Invoice balance is affected
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Unapplied credits for this contact
      if (data.contactId) {
        queryClient.invalidateQueries({
          queryKey: creditNotesKeys.unapplied(data.contactId),
        });
      }
      // Dashboard stats may be affected
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Cancel a credit/debit note
 * This reverses any balance changes if the note was issued
 */
export function useCancelCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      creditNotesApi.cancel(id, reason),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: creditNotesKeys.stats() });
      // Contact balance may be reversed
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Unapplied credits for this contact
      if (data.contactId) {
        queryClient.invalidateQueries({
          queryKey: creditNotesKeys.unapplied(data.contactId),
        });
      }
      // Dashboard stats may be affected
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
