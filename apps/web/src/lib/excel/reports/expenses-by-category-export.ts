import { exportToExcelWithSummary, type ExcelColumn, formatCurrency, formatPercentage } from '../excel-export';
import type { ExpensesByCategoryReport } from '@accounting/shared';

interface ExpenseCategoryRow {
  categoryLabel: string;
  categoryLabelAr: string;
  invoiceCount: number;
  amount: number;
  amountLbp: number;
  percentage: number;
}

/**
 * Export Expenses by Category report to Excel
 */
export function exportExpensesByCategoryToExcel(report: ExpensesByCategoryReport): void {
  const columns: ExcelColumn<ExpenseCategoryRow>[] = [
    { header: 'Category', key: 'categoryLabel', width: 25 },
    { header: 'Category (Arabic)', key: 'categoryLabelAr', width: 20 },
    { header: 'Invoices', key: 'invoiceCount', format: 'number', width: 12 },
    { header: 'Amount (USD)', key: 'amount', format: 'currency_usd', width: 18 },
    { header: 'Amount (LBP)', key: 'amountLbp', format: 'currency_lbp', width: 22 },
    {
      header: '% of Total',
      key: 'percentage',
      width: 12,
      getValue: (row) => formatPercentage(row.percentage),
    },
  ];

  const data: ExpenseCategoryRow[] = report.categories.map((c) => ({
    categoryLabel: c.categoryLabel,
    categoryLabelAr: c.categoryLabelAr,
    invoiceCount: c.invoiceCount,
    amount: c.amount,
    amountLbp: c.amountLbp,
    percentage: c.percentage,
  }));

  const summaryRow = [
    'TOTAL',
    '',
    report.totals.invoiceCount,
    formatCurrency(report.totals.amount, 'USD'),
    formatCurrency(report.totals.amountLbp, 'LBP'),
    '100.0%',
  ];

  exportToExcelWithSummary(data, columns, summaryRow, 'expenses-by-category', {
    sheetName: 'Expenses',
  });
}
