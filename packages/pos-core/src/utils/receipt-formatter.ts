import type { Sale, Payment } from '../types';
import { formatCurrency } from './currency';

export interface ReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  terminalCode: string;
  cashierName: string;
  receiptNumber: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalLBP: number;
  payment: Payment;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
}

export function formatReceiptData(
  sale: Sale,
  storeInfo: { name: string; address: string; phone: string }
): ReceiptData {
  const date = new Date(sale.createdAt);

  return {
    storeName: storeInfo.name,
    storeAddress: storeInfo.address,
    storePhone: storeInfo.phone,
    terminalCode: sale.terminalId,
    cashierName: sale.cashierName,
    receiptNumber: sale.receiptNumber,
    date: date.toLocaleDateString('en-GB'),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    items: sale.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    subtotal: sale.subtotal,
    discount: sale.discountAmount,
    tax: sale.taxAmount,
    total: sale.total,
    totalLBP: sale.totalLBP,
    payment: sale.payment,
    currency: sale.currency,
    exchangeRate: sale.exchangeRate,
  };
}

export function formatReceiptText(data: ReceiptData): string {
  const width = 40;
  const lines: string[] = [];

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const line = (left: string, right: string) => {
    const space = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, space)) + right;
  };

  const separator = '='.repeat(width);
  const dottedLine = '-'.repeat(width);

  // Header
  lines.push(center(data.storeName));
  if (data.storeAddress) lines.push(center(data.storeAddress));
  if (data.storePhone) lines.push(center(data.storePhone));
  lines.push(separator);

  // Receipt info
  lines.push(line('Receipt:', data.receiptNumber));
  lines.push(line('Date:', data.date));
  lines.push(line('Time:', data.time));
  lines.push(line('Terminal:', data.terminalCode));
  lines.push(line('Cashier:', data.cashierName));
  lines.push(separator);

  // Items
  for (const item of data.items) {
    lines.push(item.name);
    lines.push(
      line(
        `  ${item.quantity} x ${formatCurrency(item.unitPrice, data.currency)}`,
        formatCurrency(item.lineTotal, data.currency)
      )
    );
  }

  lines.push(dottedLine);

  // Totals
  lines.push(line('Subtotal:', formatCurrency(data.subtotal, data.currency)));
  if (data.discount > 0) {
    lines.push(line('Discount:', `-${formatCurrency(data.discount, data.currency)}`));
  }
  if (data.tax > 0) {
    lines.push(line('Tax:', formatCurrency(data.tax, data.currency)));
  }
  lines.push(separator);
  lines.push(line('TOTAL:', formatCurrency(data.total, data.currency)));
  lines.push(line('', formatCurrency(data.totalLBP, 'LBP')));
  lines.push(separator);

  // Payment
  if (data.payment.cashReceivedUSD > 0) {
    lines.push(line('Cash USD:', formatCurrency(data.payment.cashReceivedUSD, 'USD')));
  }
  if (data.payment.cashReceivedLBP > 0) {
    lines.push(line('Cash LBP:', formatCurrency(data.payment.cashReceivedLBP, 'LBP')));
  }
  if (data.payment.changeUSD > 0) {
    lines.push(line('Change USD:', formatCurrency(data.payment.changeUSD, 'USD')));
  }
  if (data.payment.changeLBP > 0) {
    lines.push(line('Change LBP:', formatCurrency(data.payment.changeLBP, 'LBP')));
  }

  lines.push('');
  lines.push(center('Thank you for your purchase!'));
  lines.push(center(`Rate: 1 USD = ${data.exchangeRate.toLocaleString()} LBP`));

  return lines.join('\n');
}
