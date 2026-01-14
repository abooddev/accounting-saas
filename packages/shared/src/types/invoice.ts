export interface Invoice {
  id: string;
  tenantId: string;
  type: 'purchase' | 'expense' | 'sale';
  invoiceNumber: string | null;
  supplierInvoiceNumber: string | null;
  internalNumber: string;
  contactId: string | null;
  date: string;
  dueDate: string | null;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'cancelled';
  currency: string;
  exchangeRate: string;
  subtotal: string;
  discountType: 'percent' | 'fixed' | null;
  discountValue: string;
  discountAmount: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  totalLbp: string;
  amountPaid: string;
  paidAmount: string;
  balance: string;
  notes: string | null;
  expenseCategory: string | null;
  attachmentUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountPercent: string;
  lineTotal: string;
  total: string;
  sortOrder: string;
  notes: string | null;
  createdAt: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  contact?: {
    id: string;
    name: string;
    nameAr: string | null;
  } | null;
}

export interface CreateInvoiceDto {
  type: 'purchase' | 'expense' | 'sale';
  invoiceNumber?: string;
  supplierInvoiceNumber?: string;
  contactId?: string;
  date: string;
  dueDate?: string;
  status?: 'draft' | 'pending';
  currency: string;
  exchangeRate: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  expenseCategory?: string;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
  productId?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
}

export interface UpdateInvoiceDto {
  invoiceNumber?: string;
  contactId?: string;
  date?: string;
  dueDate?: string;
  currency?: string;
  exchangeRate?: number;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  taxRate?: number;
  notes?: string;
  expenseCategory?: string;
  items?: CreateInvoiceItemDto[];
}
