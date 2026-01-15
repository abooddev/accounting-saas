import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export type CreditNoteType = 'credit' | 'debit';
export type CreditNoteStatus = 'draft' | 'issued' | 'applied' | 'cancelled';
export type ContactType = 'customer' | 'supplier';

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  productId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  sortOrder: string;
  createdAt: Date;
}

export interface CreditNoteAllocation {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  amount: string;
  allocatedBy: string;
  allocatedAt: Date;
  notes: string | null;
}

export interface CreditNote {
  id: string;
  tenantId: string;
  number: string;
  type: CreditNoteType;
  contactId: string;
  contactType: ContactType;
  originalInvoiceId: string | null;
  date: string;
  reason: string | null;
  currency: string;
  exchangeRate: string;
  subtotal: string;
  taxRate: string | null;
  taxAmount: string;
  total: string;
  totalLbp: string;
  status: CreditNoteStatus;
  appliedAmount: string | null;
  unappliedAmount: string | null;
  notes: string | null;
  cancellationReason: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreditNoteWithDetails extends CreditNote {
  items: CreditNoteItem[];
  allocations: CreditNoteAllocation[];
  contact?: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
  originalInvoice?: {
    id: string;
    internalNumber: string;
  } | null;
}

export interface CreditNoteFilters {
  type?: CreditNoteType;
  status?: CreditNoteStatus;
  contactId?: string;
  contactType?: ContactType;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreditNoteStats {
  totalCreditNotes: number;
  totalDebitNotes: number;
  totalUnappliedCredits: number;
  countCreditNotes: number;
  countDebitNotes: number;
  countUnapplied: number;
}

export interface CreateCreditNoteItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateCreditNoteDto {
  type: CreditNoteType;
  contactId: string;
  contactType: ContactType;
  originalInvoiceId?: string;
  date: string;
  reason?: string;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  taxRate?: number;
  notes?: string;
  items: CreateCreditNoteItemDto[];
}

export interface UpdateCreditNoteDto {
  contactId?: string;
  contactType?: ContactType;
  originalInvoiceId?: string;
  date?: string;
  reason?: string;
  currency?: 'USD' | 'LBP';
  exchangeRate?: number;
  taxRate?: number;
  notes?: string;
  items?: CreateCreditNoteItemDto[];
}

export interface ApplyCreditNoteDto {
  invoiceId: string;
  amount: number;
  notes?: string;
}

export interface CancelCreditNoteDto {
  reason: string;
}

// ============================================================================
// API Client
// ============================================================================

export const creditNotesApi = {
  /**
   * Get all credit/debit notes with optional filtering
   */
  getAll: async (filters?: CreditNoteFilters): Promise<CreditNoteWithDetails[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.contactId) params.append('contactId', filters.contactId);
    if (filters?.contactType) params.append('contactType', filters.contactType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const queryString = params.toString();
    const url = queryString ? `/credit-notes?${queryString}` : '/credit-notes';
    const response = await apiClient.get(url);
    return response.data.data ?? response.data;
  },

  /**
   * Get a single credit/debit note by ID with full details
   */
  getById: async (id: string): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.get(`/credit-notes/${id}`);
    return response.data.data ?? response.data;
  },

  /**
   * Get credit/debit notes statistics
   */
  getStats: async (): Promise<CreditNoteStats> => {
    const response = await apiClient.get('/credit-notes/stats');
    return response.data.data ?? response.data;
  },

  /**
   * Get unapplied credits for a specific contact
   */
  getUnappliedCredits: async (contactId: string): Promise<CreditNoteWithDetails[]> => {
    const response = await apiClient.get(`/credit-notes/unapplied/${contactId}`);
    return response.data.data ?? response.data;
  },

  /**
   * Create a new credit or debit note
   */
  create: async (data: CreateCreditNoteDto): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.post('/credit-notes', data);
    return response.data.data ?? response.data;
  },

  /**
   * Update a draft credit/debit note
   */
  update: async (id: string, data: UpdateCreditNoteDto): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.patch(`/credit-notes/${id}`, data);
    return response.data.data ?? response.data;
  },

  /**
   * Delete a draft credit/debit note (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/credit-notes/${id}`);
  },

  /**
   * Issue a credit/debit note (change status from draft to issued)
   * This will also update the contact's balance
   */
  issue: async (id: string): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.post(`/credit-notes/${id}/issue`);
    return response.data.data ?? response.data;
  },

  /**
   * Apply a credit note to an invoice
   * Only applicable for credit notes (not debit notes)
   */
  applyToInvoice: async (id: string, data: ApplyCreditNoteDto): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.post(`/credit-notes/${id}/apply`, data);
    return response.data.data ?? response.data;
  },

  /**
   * Cancel a credit/debit note with a reason
   * This will reverse any balance changes if the note was issued
   */
  cancel: async (id: string, reason: string): Promise<CreditNoteWithDetails> => {
    const response = await apiClient.post(`/credit-notes/${id}/cancel`, { reason });
    return response.data.data ?? response.data;
  },
};
