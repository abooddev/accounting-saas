export interface ProfitLossReport {
  period: { startDate: string; endDate: string };
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  costOfGoodsSold: {
    purchases: number;
    total: number;
  };
  grossProfit: number;
  expenses: {
    byCategory: Array<{
      category: string;
      categoryLabel: string;
      categoryLabelAr: string;
      amount: number;
      amountLbp: number;
      invoiceCount: number;
    }>;
    total: number;
  };
  netProfit: number;
  currency: string;
}

export interface SupplierBalancesReport {
  suppliers: Array<{
    id: string;
    name: string;
    nameAr: string | null;
    totalPurchases: number;
    totalPaid: number;
    balanceUsd: number;
    balanceLbp: number;
    lastPurchaseDate: string | null;
    lastPaymentDate: string | null;
  }>;
  totals: {
    totalPurchases: number;
    totalPaid: number;
    totalBalance: number;
  };
}

export interface SupplierStatementReport {
  supplier: {
    id: string;
    name: string;
    nameAr: string | null;
  };
  period: { startDate: string; endDate: string };
  openingBalance: number;
  transactions: Array<{
    date: string;
    reference: string;
    type: 'invoice' | 'payment';
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  closingBalance: number;
  currency: string;
}

export interface SupplierHistoryReport {
  supplier: {
    id: string;
    name: string;
    nameAr: string | null;
  };
  period: {
    startDate: string;
    endDate: string;
    months: number;
  };
  monthlyPurchases: Array<{
    month: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
  }>;
  totals: {
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    productNameAr: string | null;
    quantity: number;
    totalValue: number;
    avgPrice: number;
  }>;
}

export interface ExpensesByCategoryReport {
  period: { startDate: string; endDate: string };
  categories: Array<{
    category: string;
    categoryLabel: string;
    categoryLabelAr: string;
    amount: number;
    amountLbp: number;
    percentage: number;
    invoiceCount: number;
  }>;
  totals: {
    amount: number;
    amountLbp: number;
    invoiceCount: number;
  };
}

export interface PaymentsDueReport {
  overdue: Array<InvoiceDue>;
  dueThisWeek: Array<InvoiceDue>;
  upcoming: Array<InvoiceDue>;
  totals: {
    overdueAmount: number;
    dueThisWeekAmount: number;
    upcomingAmount: number;
    totalDue: number;
  };
}

export interface InvoiceDue {
  id: string;
  internalNumber: string;
  supplier: {
    id: string | null;
    name: string | null;
    nameAr: string | null;
  };
  date: string;
  dueDate: string;
  total: number;
  balance: number;
  daysOverdue: number;
  currency: string;
}

export interface CashFlowReport {
  period: { startDate: string; endDate: string };
  openingBalances: {
    usd: number;
    lbp: number;
  };
  moneyIn: {
    customerPayments: number;
    otherIncome: number;
    total: number;
  };
  moneyOut: {
    supplierPayments: number;
    expensePayments: number;
    total: number;
  };
  netCashFlow: number;
  closingBalances: {
    usd: number;
    lbp: number;
  };
  byAccount: Array<{
    accountId: string;
    accountName: string;
    currency: string;
    opening: number;
    totalIn: number;
    totalOut: number;
    closing: number;
  }>;
}

export interface InventoryValueReport {
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalQuantity: number;
    stockValue: number;
    percentage: number;
  }>;
  totals: {
    productCount: number;
    totalQuantity: number;
    stockValue: number;
  };
  lowStock: Array<{
    productId: string;
    productName: string;
    productNameAr: string | null;
    currentStock: number;
    minStockLevel: number;
    status: 'critical' | 'low' | 'ok';
  }>;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    currentAssets: {
      cashAndBank: number;
      accountsReceivable: number;
      inventory: number;
      totalCurrentAssets: number;
    };
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: {
      accountsPayable: number;
      totalCurrentLiabilities: number;
    };
    totalLiabilities: number;
  };
  equity: {
    retainedEarnings: number;
    totalEquity: number;
  };
  isBalanced: boolean;
  currency: string;
  detail: {
    cashAndBankAccounts: Array<{
      id: string;
      name: string;
      nameAr: string | null;
      type: string;
      currency: string;
      balance: number;
    }>;
    accountsReceivableDetail: Array<{
      id: string;
      name: string;
      nameAr: string | null;
      balance: number;
    }>;
    accountsPayableDetail: Array<{
      id: string;
      name: string;
      nameAr: string | null;
      balance: number;
    }>;
  };
}

export interface TrialBalanceReport {
  asOfDate: string;
  entries: Array<{
    accountName: string;
    accountNameAr: string | null;
    accountType: 'asset' | 'liability' | 'revenue' | 'expense' | 'equity';
    category: string;
    debit: number;
    credit: number;
    currency: string;
  }>;
  totals: {
    debit: number;
    credit: number;
    difference: number;
    isBalanced: boolean;
  };
  summary: {
    assets: number;
    liabilities: number;
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  currency: string;
}

export const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'Last Quarter', value: 'last_quarter' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
  { label: 'Custom', value: 'custom' },
] as const;

export type DatePreset = typeof DATE_PRESETS[number]['value'];

export function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let startDate: Date;
  let endDate: Date = startOfDay;

  switch (preset) {
    case 'today':
      startDate = startOfDay;
      break;
    case 'yesterday':
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'this_week':
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      break;
    case 'last_week':
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      break;
    case 'this_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'this_quarter':
      const quarterStart = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterStart, 1);
      break;
    case 'last_quarter':
      const lastQuarterStart = Math.floor(today.getMonth() / 3) * 3 - 3;
      startDate = new Date(today.getFullYear(), lastQuarterStart, 1);
      endDate = new Date(today.getFullYear(), lastQuarterStart + 3, 0);
      break;
    case 'this_year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case 'last_year':
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
