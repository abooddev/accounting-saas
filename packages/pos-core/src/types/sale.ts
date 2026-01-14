export interface CartItem {
  id: string;
  productId: string;
  barcode: string | null;
  name: string;
  nameAr: string | null;
  quantity: number;
  unitPrice: number;
  currency: 'USD' | 'LBP';
  discountPercent: number;
  lineTotal: number;
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  totalLBP: number;
}

export interface Payment {
  method: 'cash_usd' | 'cash_lbp' | 'card' | 'mixed';
  amountUSD: number;
  amountLBP: number;
  cashReceivedUSD: number;
  cashReceivedLBP: number;
  changeUSD: number;
  changeLBP: number;
  exchangeRate: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  barcode: string | null;
  productName: string;
  productNameAr: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  localId: string;
  receiptNumber: string;
  terminalId: string;
  sessionId: string;

  items: SaleItem[];

  customerId: string | null;
  customerName: string | null;

  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  totalLBP: number;

  payment: Payment;

  status: 'completed' | 'voided' | 'returned';
  voidReason: string | null;

  cashierId: string;
  cashierName: string;

  createdAt: Date;
  syncedAt: Date | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}
