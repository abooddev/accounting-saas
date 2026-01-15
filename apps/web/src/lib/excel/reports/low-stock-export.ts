import { exportToExcel, type ExcelColumn } from '../excel-export';
import type { InventoryValueReport } from '@accounting/shared';

type LowStockItem = InventoryValueReport['lowStock'][number];

/**
 * Export Low Stock report to Excel
 */
export function exportLowStockToExcel(lowStock: LowStockItem[]): void {
  const columns: ExcelColumn<LowStockItem>[] = [
    { header: 'Product', key: 'productName', width: 30 },
    { header: 'Product (Arabic)', key: 'productNameAr', width: 25 },
    { header: 'Current Stock', key: 'currentStock', format: 'number', width: 15 },
    { header: 'Min Level', key: 'minStockLevel', format: 'number', width: 12 },
    {
      header: 'Status',
      key: 'status',
      width: 12,
      getValue: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1),
    },
    {
      header: 'Shortage',
      key: 'currentStock',
      width: 12,
      getValue: (row) => Math.max(0, row.minStockLevel - row.currentStock),
    },
  ];

  exportToExcel(lowStock, columns, 'low-stock-alert', {
    sheetName: 'Low Stock',
  });
}
