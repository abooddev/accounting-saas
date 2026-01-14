export interface MoneyAccount {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  type: 'cash' | 'bank';
  currency: string;
  currentBalance: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AccountMovement {
  id: string;
  tenantId: string;
  accountId: string;
  type: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'initial' | 'payment_out' | 'payment_in' | 'adjustment';
  amount: string;
  balanceAfter: string;
  currency: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface CreateAccountDto {
  name: string;
  nameAr?: string;
  type: 'cash' | 'bank';
  currency: string;
  isDefault?: boolean;
  openingBalance?: number;
}

export interface UpdateAccountDto {
  name?: string;
  nameAr?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface TransferDto {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  exchangeRate?: number;
  date: string;
  notes?: string;
}

export interface AdjustmentDto {
  amount: number;
  type: 'in' | 'out';
  description: string;
  date: string;
}
