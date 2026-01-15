import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatMoney } from '@accounting/shared';
import type { PaymentsDueReport, InvoiceDue } from '@accounting/shared';

/**
 * Export Payments Due report to Excel
 */
export function exportPaymentsDueToExcel(report: PaymentsDueReport): void {
  const wb = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData: (string | number)[][] = [
    ['Payments Due Report'],
    [`Generated: ${new Date().toISOString().split('T')[0]}`],
    [],
    ['Summary'],
    [],
    ['Category', 'Count', 'Amount (USD)'],
    ['Overdue', report.overdue.length, formatMoney(report.totals.overdueAmount, 'USD')],
    ['Due This Week', report.dueThisWeek.length, formatMoney(report.totals.dueThisWeekAmount, 'USD')],
    ['Upcoming', report.upcoming.length, formatMoney(report.totals.upcomingAmount, 'USD')],
    [],
    ['TOTAL',
      report.overdue.length + report.dueThisWeek.length + report.upcoming.length,
      formatMoney(report.totals.totalDue, 'USD')
    ],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Helper function to create invoice rows
  const createInvoiceData = (invoices: InvoiceDue[], title: string): (string | number)[][] => {
    const data: (string | number)[][] = [
      [title],
      [],
      ['Invoice #', 'Supplier', 'Supplier (Arabic)', 'Invoice Date', 'Due Date', 'Balance', 'Days Overdue'],
    ];

    invoices.forEach((inv) => {
      data.push([
        inv.internalNumber,
        inv.supplier.name || '-',
        inv.supplier.nameAr || '-',
        inv.date,
        inv.dueDate,
        formatMoney(inv.balance, inv.currency),
        inv.daysOverdue > 0 ? inv.daysOverdue : '-',
      ]);
    });

    const total = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    data.push([]);
    data.push(['', '', '', '', 'TOTAL:', formatMoney(total, 'USD'), '']);

    return data;
  };

  // Overdue invoices sheet
  if (report.overdue.length > 0) {
    const overdueData = createInvoiceData(report.overdue, 'Overdue Invoices');
    const overdueWs = XLSX.utils.aoa_to_sheet(overdueData);
    overdueWs['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, overdueWs, 'Overdue');
  }

  // Due this week sheet
  if (report.dueThisWeek.length > 0) {
    const dueThisWeekData = createInvoiceData(report.dueThisWeek, 'Due This Week');
    const dueThisWeekWs = XLSX.utils.aoa_to_sheet(dueThisWeekData);
    dueThisWeekWs['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, dueThisWeekWs, 'Due This Week');
  }

  // Upcoming sheet
  if (report.upcoming.length > 0) {
    const upcomingData = createInvoiceData(report.upcoming, 'Upcoming Payments');
    const upcomingWs = XLSX.utils.aoa_to_sheet(upcomingData);
    upcomingWs['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, upcomingWs, 'Upcoming');
  }

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0];
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `payments-due_${timestamp}.xlsx`);
}
