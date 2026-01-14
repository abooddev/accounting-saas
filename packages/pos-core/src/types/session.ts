export interface POSSession {
  id: string;
  localId: string;
  terminalId: string;
  terminalCode: string;

  cashierId: string;
  cashierName: string;

  openedAt: Date;
  closedAt: Date | null;

  openingCashUSD: number;
  openingCashLBP: number;

  closingCashUSD: number | null;
  closingCashLBP: number | null;

  expectedCashUSD: number;
  expectedCashLBP: number;

  differenceUSD: number | null;
  differenceLBP: number | null;

  totalSales: number;
  totalReturns: number;
  totalTransactions: number;

  status: 'open' | 'closed';

  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface CashMovement {
  id: string;
  localId: string;
  sessionId: string;
  type: 'cash_in' | 'cash_out';
  amountUSD: number;
  amountLBP: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface POSTerminal {
  id: string;
  code: string;
  name: string;
  location: string | null;
  isActive: boolean;
}
