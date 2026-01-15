import { exportToExcelWithSummary, type ExcelColumn, formatCurrency } from '../excel-export';
import type { SupplierBalancesReport } from '@accounting/shared';

interface SupplierBalanceRow {
  name: string;
  nameAr: string | null;
  totalPurchases: number;
  totalPaid: number;
  balanceUsd: number;
  balanceLbp: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
}

/**
 * Export Supplier Balances report to Excel
 */
export function exportSupplierBalancesToExcel(report: SupplierBalancesReport): void {
  const columns: ExcelColumn<SupplierBalanceRow>[] = [
    { header: 'Supplier', key: 'name', width: 25 },
    { header: 'Supplier (Arabic)', key: 'nameAr', width: 20 },
    { header: 'Total Purchases', key: 'totalPurchases', format: 'currency_usd', width: 18 },
    { header: 'Total Paid', key: 'totalPaid', format: 'currency_usd', width: 18 },
    { header: 'Balance (USD)', key: 'balanceUsd', format: 'currency_usd', width: 18 },
    { header: 'Balance (LBP)', key: 'balanceLbp', format: 'currency_lbp', width: 22 },
    { header: 'Last Purchase', key: 'lastPurchaseDate', format: 'date', width: 14 },
    { header: 'Last Payment', key: 'lastPaymentDate', format: 'date', width: 14 },
  ];

  const data: SupplierBalanceRow[] = report.suppliers.map((s) => ({
    name: s.name,
    nameAr: s.nameAr,
    totalPurchases: s.totalPurchases,
    totalPaid: s.totalPaid,
    balanceUsd: s.balanceUsd,
    balanceLbp: s.balanceLbp,
    lastPurchaseDate: s.lastPurchaseDate,
    lastPaymentDate: s.lastPaymentDate,
  }));

  const summaryRow = [
    'TOTAL',
    '',
    formatCurrency(report.totals.totalPurchases, 'USD'),
    formatCurrency(report.totals.totalPaid, 'USD'),
    formatCurrency(report.totals.totalBalance, 'USD'),
    '',
    '',
    '',
  ];

  exportToExcelWithSummary(data, columns, summaryRow, 'supplier-balances', {
    sheetName: 'Supplier Balances',
  });
}
