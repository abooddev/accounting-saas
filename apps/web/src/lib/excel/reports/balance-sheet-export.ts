import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { BalanceSheetReport } from '@accounting/shared';

/**
 * Export Balance Sheet report to Excel
 */
export function exportBalanceSheetToExcel(report: BalanceSheetReport): void {
  const wb = XLSX.utils.book_new();

  // Create summary sheet with traditional balance sheet layout
  const summaryData: (string | number)[][] = [
    ['Balance Sheet'],
    [`As of: ${report.asOfDate}`],
    [],
    ['ASSETS', ''],
    [],
    ['Current Assets:', ''],
    ['  Cash and Bank', formatMoney(report.assets.currentAssets.cashAndBank, report.currency)],
    ['  Accounts Receivable', formatMoney(report.assets.currentAssets.accountsReceivable, report.currency)],
    ['  Inventory', formatMoney(report.assets.currentAssets.inventory, report.currency)],
    ['Total Current Assets', formatMoney(report.assets.currentAssets.totalCurrentAssets, report.currency)],
    [],
    ['TOTAL ASSETS', formatMoney(report.assets.totalAssets, report.currency)],
    [],
    [],
    ['LIABILITIES', ''],
    [],
    ['Current Liabilities:', ''],
    ['  Accounts Payable', formatMoney(report.liabilities.currentLiabilities.accountsPayable, report.currency)],
    ['Total Current Liabilities', formatMoney(report.liabilities.currentLiabilities.totalCurrentLiabilities, report.currency)],
    [],
    ['TOTAL LIABILITIES', formatMoney(report.liabilities.totalLiabilities, report.currency)],
    [],
    [],
    ['EQUITY', ''],
    [],
    ['  Retained Earnings', formatMoney(report.equity.retainedEarnings, report.currency)],
    ['TOTAL EQUITY', formatMoney(report.equity.totalEquity, report.currency)],
    [],
    [],
    ['TOTAL LIABILITIES & EQUITY', formatMoney(report.liabilities.totalLiabilities + report.equity.totalEquity, report.currency)],
    [],
    ['Balance Check:', report.isBalanced ? 'BALANCED' : 'NOT BALANCED'],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Balance Sheet');

  // Create Cash & Bank detail sheet
  if (report.detail.cashAndBankAccounts.length > 0) {
    const cashData: (string | number)[][] = [
      ['Cash and Bank Accounts'],
      [`As of: ${report.asOfDate}`],
      [],
      ['Account Name', 'Type', 'Currency', 'Balance'],
    ];

    report.detail.cashAndBankAccounts.forEach((acc) => {
      cashData.push([
        acc.name,
        acc.type,
        acc.currency,
        formatMoney(acc.balance, acc.currency),
      ]);
    });

    const cashWs = XLSX.utils.aoa_to_sheet(cashData);
    cashWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, cashWs, 'Cash & Bank');
  }

  // Create Accounts Receivable detail sheet
  if (report.detail.accountsReceivableDetail.length > 0) {
    const arData: (string | number)[][] = [
      ['Accounts Receivable Detail'],
      [`As of: ${report.asOfDate}`],
      [],
      ['Customer Name', 'Balance (USD)'],
    ];

    report.detail.accountsReceivableDetail.forEach((customer) => {
      arData.push([
        customer.name,
        formatMoney(customer.balance, 'USD'),
      ]);
    });

    arData.push([]);
    arData.push([
      'Total',
      formatMoney(report.assets.currentAssets.accountsReceivable, 'USD'),
    ]);

    const arWs = XLSX.utils.aoa_to_sheet(arData);
    arWs['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, arWs, 'Accounts Receivable');
  }

  // Create Accounts Payable detail sheet
  if (report.detail.accountsPayableDetail.length > 0) {
    const apData: (string | number)[][] = [
      ['Accounts Payable Detail'],
      [`As of: ${report.asOfDate}`],
      [],
      ['Supplier Name', 'Balance (USD)'],
    ];

    report.detail.accountsPayableDetail.forEach((supplier) => {
      apData.push([
        supplier.name,
        formatMoney(supplier.balance, 'USD'),
      ]);
    });

    apData.push([]);
    apData.push([
      'Total',
      formatMoney(report.liabilities.currentLiabilities.accountsPayable, 'USD'),
    ]);

    const apWs = XLSX.utils.aoa_to_sheet(apData);
    apWs['!cols'] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, apWs, 'Accounts Payable');
  }

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `balance-sheet_${timestamp}.xlsx`);
}
