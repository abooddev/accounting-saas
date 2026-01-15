import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { SupplierStatementReport } from '@accounting/shared';

/**
 * Export Supplier Statement report to Excel
 */
export function exportSupplierStatementToExcel(report: SupplierStatementReport): void {
  const wb = XLSX.utils.book_new();

  // Create statement data
  const statementData: (string | number)[][] = [
    ['Supplier Statement'],
    [],
    ['Supplier:', report.supplier.name + (report.supplier.nameAr ? ` (${report.supplier.nameAr})` : '')],
    ['Period:', `${report.period.startDate} to ${report.period.endDate}`],
    ['Currency:', report.currency],
    [],
    ['Date', 'Reference', 'Type', 'Description', 'Debit', 'Credit', 'Balance'],
    [],
    // Opening balance row
    [
      report.period.startDate,
      '-',
      '-',
      'Opening Balance',
      '-',
      '-',
      formatMoney(report.openingBalance, report.currency),
    ],
  ];

  // Add transaction rows
  report.transactions.forEach((tx) => {
    statementData.push([
      tx.date,
      tx.reference,
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      tx.description,
      tx.debit > 0 ? formatMoney(tx.debit, report.currency) : '-',
      tx.credit > 0 ? formatMoney(tx.credit, report.currency) : '-',
      formatMoney(tx.balance, report.currency),
    ]);
  });

  // Add closing balance row
  statementData.push([]);
  statementData.push([
    report.period.endDate,
    '-',
    '-',
    'Closing Balance',
    '-',
    '-',
    formatMoney(report.closingBalance, report.currency),
  ]);

  // Add summary section
  statementData.push([]);
  statementData.push([]);
  statementData.push(['Summary']);
  statementData.push(['Opening Balance:', formatMoney(report.openingBalance, report.currency)]);

  const totalDebits = report.transactions.reduce((sum, tx) => sum + tx.debit, 0);
  const totalCredits = report.transactions.reduce((sum, tx) => sum + tx.credit, 0);

  statementData.push(['Total Debits (Invoices):', formatMoney(totalDebits, report.currency)]);
  statementData.push(['Total Credits (Payments):', formatMoney(totalCredits, report.currency)]);
  statementData.push(['Closing Balance:', formatMoney(report.closingBalance, report.currency)]);

  const ws = XLSX.utils.aoa_to_sheet(statementData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Statement');

  // Generate and download file
  const supplierSlug = report.supplier.name.toLowerCase().replace(/\s+/g, '-');
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `supplier-statement_${supplierSlug}_${timestamp}.xlsx`);
}
