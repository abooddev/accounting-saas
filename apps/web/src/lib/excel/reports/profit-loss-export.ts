import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { ProfitLossReport } from '@accounting/shared';

/**
 * Export Profit & Loss report to Excel
 */
export function exportProfitLossToExcel(report: ProfitLossReport): void {
  const wb = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData: (string | number)[][] = [
    ['Profit & Loss Report'],
    [`Period: ${report.period.startDate} to ${report.period.endDate}`],
    [],
    ['Section', 'Amount'],
    [],
    ['REVENUE', ''],
    ['Sales', formatMoney(report.revenue.sales, report.currency)],
    ['Other Income', formatMoney(report.revenue.otherIncome, report.currency)],
    ['Total Revenue', formatMoney(report.revenue.total, report.currency)],
    [],
    ['COST OF GOODS SOLD', ''],
    ['Purchases', formatMoney(report.costOfGoodsSold.purchases, report.currency)],
    ['Total COGS', formatMoney(report.costOfGoodsSold.total, report.currency)],
    [],
    ['GROSS PROFIT', formatMoney(report.grossProfit, report.currency)],
    [],
    ['OPERATING EXPENSES', ''],
  ];

  // Add expenses by category
  report.expenses.byCategory.forEach((expense) => {
    const label = expense.categoryLabelAr
      ? `${expense.categoryLabel} (${expense.categoryLabelAr})`
      : expense.categoryLabel;
    summaryData.push([label, formatMoney(expense.amount, report.currency)]);
  });

  summaryData.push(['Total Expenses', formatMoney(report.expenses.total, report.currency)]);
  summaryData.push([]);
  summaryData.push(['NET PROFIT', formatMoney(report.netProfit, report.currency)]);

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Create expenses detail sheet if there are expenses
  if (report.expenses.byCategory.length > 0) {
    const expensesData: (string | number)[][] = [
      ['Operating Expenses Detail'],
      [`Period: ${report.period.startDate} to ${report.period.endDate}`],
      [],
      ['Category', 'Category (Arabic)', 'Invoices', 'Amount (USD)', 'Amount (LBP)'],
    ];

    report.expenses.byCategory.forEach((expense) => {
      expensesData.push([
        expense.categoryLabel,
        expense.categoryLabelAr || '-',
        expense.invoiceCount,
        formatMoney(expense.amount, 'USD'),
        formatMoney(expense.amountLbp, 'LBP'),
      ]);
    });

    expensesData.push([]);
    expensesData.push([
      'Total',
      '',
      report.expenses.byCategory.reduce((sum, e) => sum + e.invoiceCount, 0),
      formatMoney(report.expenses.total, report.currency),
      '',
    ]);

    const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
    expensesWs['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses Detail');
  }

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `profit-loss-report_${timestamp}.xlsx`);
}
