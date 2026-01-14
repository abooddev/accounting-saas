export type ContactType = 'supplier' | 'customer' | 'both';

export interface Contact {
  id: string;
  tenantId: string;
  type: ContactType;
  name: string;
  nameAr: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  paymentTermsDays: number;
  creditLimit: number;
  balanceUsd: number;
  balanceLbp: number;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateContactInput {
  type: ContactType;
  name: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateContactInput {
  type?: ContactType;
  name?: string;
  nameAr?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTermsDays?: number;
  creditLimit?: number;
  notes?: string;
  isActive?: boolean;
}

export interface ContactFilters {
  type?: ContactType;
  search?: string;
  isActive?: boolean;
}
