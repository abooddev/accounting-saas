import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { TrialBalanceReport } from '@accounting/shared';

/**
 * Export Trial Balance report to Excel
 */
export function exportTrialBalanceToExcel(report: TrialBalanceReport): void {
  const wb = XLSX.utils.book_new();

  // Create trial balance sheet
  const trialBalanceData: (string | number)[][] = [
    ['Trial Balance Report'],
    [`As of: ${report.asOfDate}`],
    [],
    ['Account', 'Type', 'Category', 'Currency', 'Debit', 'Credit'],
  ];

  // Add entries
  report.entries.forEach((entry) => {
    trialBalanceData.push([
      entry.accountName,
      entry.accountType.charAt(0).toUpperCase() + entry.accountType.slice(1),
      entry.category,
      entry.currency,
      entry.debit > 0 ? formatMoney(entry.debit, entry.currency) : '-',
      entry.credit > 0 ? formatMoney(entry.credit, entry.currency) : '-',
    ]);
  });

  // Add totals
  trialBalanceData.push([]);
  trialBalanceData.push([
    'TOTAL',
    '',
    '',
    report.currency,
    formatMoney(report.totals.debit, report.currency),
    formatMoney(report.totals.credit, report.currency),
  ]);

  // Add balance status
  trialBalanceData.push([]);
  trialBalanceData.push([
    'Balance Status:',
    report.totals.isBalanced ? 'BALANCED' : 'UNBALANCED',
  ]);
  if (!report.totals.isBalanced) {
    trialBalanceData.push([
      'Difference:',
      formatMoney(report.totals.difference, report.currency),
    ]);
  }

  const trialBalanceWs = XLSX.utils.aoa_to_sheet(trialBalanceData);
  trialBalanceWs['!cols'] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, trialBalanceWs, 'Trial Balance');

  // Create summary sheet
  const summaryData: (string | number)[][] = [
    ['Trial Balance Summary'],
    [`As of: ${report.asOfDate}`],
    [],
    ['Account Type', 'Amount'],
    ['Assets', formatMoney(report.summary.assets, report.currency)],
    ['Liabilities', formatMoney(report.summary.liabilities, report.currency)],
    ['Revenue', formatMoney(report.summary.revenue, report.currency)],
    ['Expenses', formatMoney(report.summary.expenses, report.currency)],
    [],
    ['Net Income', formatMoney(report.summary.netIncome, report.currency)],
    [],
    ['Totals'],
    ['Total Debits', formatMoney(report.totals.debit, report.currency)],
    ['Total Credits', formatMoney(report.totals.credit, report.currency)],
    ['Difference', formatMoney(report.totals.difference, report.currency)],
    ['Is Balanced', report.totals.isBalanced ? 'Yes' : 'No'],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `trial-balance-report_${timestamp}.xlsx`);
}
