import { exportToExcelWithSummary, type ExcelColumn, formatCurrency, formatPercentage } from '../excel-export';
import type { InventoryValueReport } from '@accounting/shared';

interface InventoryCategoryRow {
  categoryName: string;
  productCount: number;
  totalQuantity: number;
  stockValue: number;
  percentage: number;
}

/**
 * Export Inventory Value report to Excel
 */
export function exportInventoryToExcel(report: InventoryValueReport): void {
  const columns: ExcelColumn<InventoryCategoryRow>[] = [
    { header: 'Category', key: 'categoryName', width: 25 },
    { header: 'Products', key: 'productCount', format: 'number', width: 12 },
    { header: 'Total Quantity', key: 'totalQuantity', format: 'number', width: 15 },
    { header: 'Stock Value (USD)', key: 'stockValue', format: 'currency_usd', width: 20 },
    {
      header: '% of Total',
      key: 'percentage',
      width: 12,
      getValue: (row) => formatPercentage(row.percentage),
    },
  ];

  const data: InventoryCategoryRow[] = report.byCategory.map((c) => ({
    categoryName: c.categoryName,
    productCount: c.productCount,
    totalQuantity: c.totalQuantity,
    stockValue: c.stockValue,
    percentage: c.percentage,
  }));

  const summaryRow = [
    'TOTAL',
    report.totals.productCount,
    report.totals.totalQuantity,
    formatCurrency(report.totals.stockValue, 'USD'),
    '100.0%',
  ];

  exportToExcelWithSummary(data, columns, summaryRow, 'inventory-value', {
    sheetName: 'Inventory',
  });
}
