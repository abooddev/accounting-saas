import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { CashFlowReport } from '@accounting/shared';

/**
 * Export Cash Flow report to Excel
 */
export function exportCashFlowToExcel(report: CashFlowReport): void {
  const wb = XLSX.utils.book_new();

  // Create cash flow statement sheet
  const statementData: (string | number)[][] = [
    ['Cash Flow Report'],
    [`Period: ${report.period.startDate} to ${report.period.endDate}`],
    [],
    ['Cash Flow Statement'],
    [],
    ['Opening Balances'],
    ['USD', formatMoney(report.openingBalances.usd, 'USD')],
    ['LBP', formatMoney(report.openingBalances.lbp, 'LBP')],
    [],
    ['MONEY IN'],
    ['Customer Payments', formatMoney(report.moneyIn.customerPayments, 'USD')],
    ['Other Income', formatMoney(report.moneyIn.otherIncome, 'USD')],
    ['Total Money In', formatMoney(report.moneyIn.total, 'USD')],
    [],
    ['MONEY OUT'],
    ['Supplier Payments', formatMoney(report.moneyOut.supplierPayments, 'USD')],
    ['Expense Payments', formatMoney(report.moneyOut.expensePayments, 'USD')],
    ['Total Money Out', formatMoney(report.moneyOut.total, 'USD')],
    [],
    ['NET CASH FLOW', formatMoney(report.netCashFlow, 'USD')],
    [],
    ['Closing Balances'],
    ['USD', formatMoney(report.closingBalances.usd, 'USD')],
    ['LBP', formatMoney(report.closingBalances.lbp, 'LBP')],
  ];

  const statementWs = XLSX.utils.aoa_to_sheet(statementData);
  statementWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, statementWs, 'Cash Flow');

  // Create by account sheet if there are accounts
  if (report.byAccount.length > 0) {
    const byAccountData: (string | number)[][] = [
      ['Cash Flow by Account'],
      [`Period: ${report.period.startDate} to ${report.period.endDate}`],
      [],
      ['Account', 'Currency', 'Opening', 'Money In', 'Money Out', 'Closing'],
    ];

    report.byAccount.forEach((account) => {
      byAccountData.push([
        account.accountName,
        account.currency,
        formatMoney(account.opening, account.currency),
        formatMoney(account.totalIn, account.currency),
        formatMoney(account.totalOut, account.currency),
        formatMoney(account.closing, account.currency),
      ]);
    });

    // Calculate totals (only for USD accounts for simplicity)
    const usdAccounts = report.byAccount.filter((a) => a.currency === 'USD');
    const lbpAccounts = report.byAccount.filter((a) => a.currency === 'LBP');

    if (usdAccounts.length > 0) {
      byAccountData.push([]);
      byAccountData.push([
        'Total (USD)',
        'USD',
        formatMoney(usdAccounts.reduce((sum, a) => sum + a.opening, 0), 'USD'),
        formatMoney(usdAccounts.reduce((sum, a) => sum + a.totalIn, 0), 'USD'),
        formatMoney(usdAccounts.reduce((sum, a) => sum + a.totalOut, 0), 'USD'),
        formatMoney(usdAccounts.reduce((sum, a) => sum + a.closing, 0), 'USD'),
      ]);
    }

    if (lbpAccounts.length > 0) {
      byAccountData.push([
        'Total (LBP)',
        'LBP',
        formatMoney(lbpAccounts.reduce((sum, a) => sum + a.opening, 0), 'LBP'),
        formatMoney(lbpAccounts.reduce((sum, a) => sum + a.totalIn, 0), 'LBP'),
        formatMoney(lbpAccounts.reduce((sum, a) => sum + a.totalOut, 0), 'LBP'),
        formatMoney(lbpAccounts.reduce((sum, a) => sum + a.closing, 0), 'LBP'),
      ]);
    }

    const byAccountWs = XLSX.utils.aoa_to_sheet(byAccountData);
    byAccountWs['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, byAccountWs, 'By Account');
  }

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `cash-flow-report_${timestamp}.xlsx`);
}
