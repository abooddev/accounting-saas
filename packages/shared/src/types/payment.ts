export interface Payment {
  id: string;
  tenantId: string;
  type: 'supplier_payment' | 'expense_payment' | 'customer_receipt';
  paymentNumber: string;
  contactId: string | null;
  invoiceId: string | null;
  accountId: string;
  date: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  amountLbp: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'whish' | 'omt';
  reference: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaymentWithRelations extends Payment {
  contact?: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
  invoice?: {
    id: string;
    internalNumber: string;
    total: string;
  } | null;
  account?: {
    id: string;
    name: string;
    type: 'cash' | 'bank';
    currency: string;
  } | null;
}

export interface CreatePaymentDto {
  type: 'supplier_payment' | 'expense_payment' | 'customer_receipt';
  contactId?: string;
  invoiceId?: string;
  accountId: string;
  date: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'whish' | 'omt';
  reference?: string;
  notes?: string;
}
