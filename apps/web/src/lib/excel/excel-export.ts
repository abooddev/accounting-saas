import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T | string;
  width?: number;
  format?: 'currency_usd' | 'currency_lbp' | 'date' | 'number' | 'percentage' | 'text';
  getValue?: (row: T) => string | number;
}

export interface ExcelExportOptions {
  sheetName?: string;
  includeTimestamp?: boolean;
  rtlSupport?: boolean;
}

/**
 * Format currency value for Excel display
 */
export function formatCurrency(value: number, currency: 'USD' | 'LBP'): string {
  return formatMoney(value, currency);
}

/**
 * Format date for Excel display (YYYY-MM-DD)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
}

/**
 * Format percentage for Excel display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get cell value based on column configuration
 */
function getCellValue<T>(row: T, column: ExcelColumn<T>): string | number {
  // Use custom getValue function if provided
  if (column.getValue) {
    return column.getValue(row);
  }

  // Get raw value from row
  const keys = (column.key as string).split('.');
  let value: unknown = row;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      value = undefined;
      break;
    }
  }

  // Format based on column type
  switch (column.format) {
    case 'currency_usd':
      return formatCurrency(Number(value) || 0, 'USD');
    case 'currency_lbp':
      return formatCurrency(Number(value) || 0, 'LBP');
    case 'date':
      return formatDate(value as string | Date | null);
    case 'number':
      return Number(value) || 0;
    case 'percentage':
      return formatPercentage(Number(value) || 0);
    default:
      return value !== undefined && value !== null ? String(value) : '-';
  }
}

/**
 * Calculate optimal column widths based on content
 */
function calculateColumnWidths<T>(
  data: T[],
  columns: ExcelColumn<T>[]
): number[] {
  return columns.map((col) => {
    // Start with header width
    let maxWidth = col.header.length;

    // Check data widths
    data.forEach((row) => {
      const value = String(getCellValue(row, col));
      if (value.length > maxWidth) {
        maxWidth = value.length;
      }
    });

    // Use custom width if provided, otherwise calculate
    return col.width || Math.min(Math.max(maxWidth + 2, 10), 50);
  });
}

/**
 * Generic export function for any data to Excel
 */
export function exportToExcel<T>(
  data: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  options: ExcelExportOptions = {}
): void {
  const {
    sheetName = 'Report',
    includeTimestamp = true,
    rtlSupport = true,
  } = options;

  // Create worksheet data
  const wsData: (string | number)[][] = [];

  // Add header row
  wsData.push(columns.map((col) => col.header));

  // Add data rows
  data.forEach((row) => {
    wsData.push(columns.map((col) => getCellValue(row, col)));
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const widths = calculateColumnWidths(data, columns);
  ws['!cols'] = widths.map((w) => ({ wch: w }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Set RTL support if needed (for Arabic text)
  if (rtlSupport) {
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = wb.Workbook.Views || [];
    wb.Workbook.Views[0] = wb.Workbook.Views[0] || {};
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with optional timestamp
  let finalFilename = filename;
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0];
    finalFilename = `${filename}_${timestamp}`;
  }

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${finalFilename}.xlsx`);
}

/**
 * Export to Excel with summary row at the bottom
 */
export function exportToExcelWithSummary<T>(
  data: T[],
  columns: ExcelColumn<T>[],
  summaryRow: (string | number)[],
  filename: string,
  options: ExcelExportOptions = {}
): void {
  const {
    sheetName = 'Report',
    includeTimestamp = true,
    rtlSupport = true,
  } = options;

  // Create worksheet data
  const wsData: (string | number)[][] = [];

  // Add header row
  wsData.push(columns.map((col) => col.header));

  // Add data rows
  data.forEach((row) => {
    wsData.push(columns.map((col) => getCellValue(row, col)));
  });

  // Add empty row before summary
  wsData.push([]);

  // Add summary row
  wsData.push(summaryRow);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const widths = calculateColumnWidths(data, columns);
  ws['!cols'] = widths.map((w) => ({ wch: w }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  if (rtlSupport) {
    wb.Workbook = wb.Workbook || {};
    wb.Workbook.Views = wb.Workbook.Views || [];
    wb.Workbook.Views[0] = wb.Workbook.Views[0] || {};
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate filename with optional timestamp
  let finalFilename = filename;
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0];
    finalFilename = `${filename}_${timestamp}`;
  }

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${finalFilename}.xlsx`);
}

/**
 * Export multiple sheets to a single Excel file
 */
export function exportMultiSheetExcel(
  sheets: Array<{
    name: string;
    data: (string | number)[][];
    columns?: { wch: number }[];
  }>,
  filename: string,
  includeTimestamp: boolean = true
): void {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.data);
    if (sheet.columns) {
      ws['!cols'] = sheet.columns;
    }
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  let finalFilename = filename;
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0];
    finalFilename = `${filename}_${timestamp}`;
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${finalFilename}.xlsx`);
}
