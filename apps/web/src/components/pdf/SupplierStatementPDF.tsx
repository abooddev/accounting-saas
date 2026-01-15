'use client';

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import {
  PDFHeader,
  PDFFooter,
  pdfStyles,
  formatMoneyPDF,
  BusinessInfo,
  defaultBusinessInfo,
} from './PDFLayout';
import type { SupplierStatementReport } from '@accounting/shared';

// Statement-specific styles
const statementStyles = StyleSheet.create({
  supplierHeader: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  supplierNameAr: {
    fontFamily: 'Amiri',
    fontSize: 14,
    color: '#4a4a6a',
    textAlign: 'right',
    marginBottom: 8,
  },
  periodInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  periodText: {
    fontSize: 9,
    color: '#666666',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryBox: {
    width: '32%',
    padding: 12,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  summaryLabelAr: {
    fontFamily: 'Amiri',
    fontSize: 8,
    color: '#888888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  openingBalanceValue: {
    color: '#333333',
  },
  closingBalancePositive: {
    color: '#dc3545',
  },
  closingBalanceNegative: {
    color: '#28a745',
  },
  transactionsTable: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ed',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#fafafc',
  },
  openingRow: {
    backgroundColor: '#e8f4f8',
    borderBottomWidth: 2,
    borderBottomColor: '#b8d4e3',
  },
  closingRow: {
    backgroundColor: '#1a1a2e',
    marginTop: 0,
  },
  closingRowCell: {
    color: '#ffffff',
  },
  tableCell: {
    fontSize: 8,
    color: '#333333',
  },
  dateCell: {
    width: 65,
  },
  referenceCell: {
    width: 80,
  },
  typeCell: {
    width: 60,
  },
  descriptionCell: {
    flex: 1,
    paddingRight: 8,
  },
  debitCell: {
    width: 75,
    textAlign: 'right',
  },
  creditCell: {
    width: 75,
    textAlign: 'right',
  },
  balanceCell: {
    width: 80,
    textAlign: 'right',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
  invoiceBadge: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
  paymentBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  debitValue: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  creditValue: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  negativeBalance: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  noTransactions: {
    textAlign: 'center',
    padding: 30,
    color: '#999999',
    fontSize: 10,
  },
  footerNote: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerNoteText: {
    fontSize: 8,
    color: '#856404',
  },
  footerNoteTextAr: {
    fontFamily: 'Amiri',
    fontSize: 8,
    color: '#856404',
    textAlign: 'right',
  },
});

interface SupplierStatementPDFProps {
  report: SupplierStatementReport;
  businessInfo?: BusinessInfo;
}

export function SupplierStatementPDF({
  report,
  businessInfo = defaultBusinessInfo,
}: SupplierStatementPDFProps) {
  const hasPositiveClosingBalance = report.closingBalance > 0;

  return (
    <Document
      title={`Statement - ${report.supplier.name}`}
      author={businessInfo.name}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          businessInfo={businessInfo}
          title="SUPPLIER STATEMENT"
          titleAr="كشف حساب المورد"
          documentDate={report.period.endDate}
        />

        {/* Supplier Info */}
        <View style={statementStyles.supplierHeader}>
          <Text style={statementStyles.supplierName}>{report.supplier.name}</Text>
          {report.supplier.nameAr && (
            <Text style={statementStyles.supplierNameAr}>{report.supplier.nameAr}</Text>
          )}
          <View style={statementStyles.periodInfo}>
            <Text style={statementStyles.periodText}>
              Statement Period: {report.period.startDate} to {report.period.endDate}
            </Text>
            <Text style={statementStyles.periodText}>
              Currency: {report.currency}
            </Text>
          </View>
        </View>

        {/* Summary Boxes */}
        <View style={statementStyles.summarySection}>
          <View style={statementStyles.summaryBox}>
            <Text style={statementStyles.summaryLabel}>Opening Balance</Text>
            <Text style={statementStyles.summaryLabelAr}>الرصيد الافتتاحي</Text>
            <Text style={[statementStyles.summaryValue, statementStyles.openingBalanceValue]}>
              {formatMoneyPDF(report.openingBalance, report.currency)}
            </Text>
          </View>

          <View style={statementStyles.summaryBox}>
            <Text style={statementStyles.summaryLabel}>Transactions</Text>
            <Text style={statementStyles.summaryLabelAr}>المعاملات</Text>
            <Text style={statementStyles.summaryValue}>
              {report.transactions.length}
            </Text>
          </View>

          <View style={statementStyles.summaryBox}>
            <Text style={statementStyles.summaryLabel}>Closing Balance</Text>
            <Text style={statementStyles.summaryLabelAr}>الرصيد الختامي</Text>
            <Text style={[
              statementStyles.summaryValue,
              hasPositiveClosingBalance
                ? statementStyles.closingBalancePositive
                : statementStyles.closingBalanceNegative,
            ]}>
              {formatMoneyPDF(report.closingBalance, report.currency)}
            </Text>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={statementStyles.transactionsTable}>
          {/* Table Header */}
          <View style={statementStyles.tableHeader}>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.dateCell]}>
              Date
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.referenceCell]}>
              Reference
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.typeCell]}>
              Type
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.descriptionCell]}>
              Description
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.debitCell]}>
              Debit
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.creditCell]}>
              Credit
            </Text>
            <Text style={[statementStyles.tableHeaderCell, statementStyles.balanceCell]}>
              Balance
            </Text>
          </View>

          {/* Opening Balance Row */}
          <View style={[statementStyles.tableRow, statementStyles.openingRow]}>
            <Text style={[statementStyles.tableCell, statementStyles.dateCell]}>
              {report.period.startDate}
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.referenceCell, { fontWeight: 'bold' }]}>
              -
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.typeCell, { fontWeight: 'bold' }]}>
              Opening
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.descriptionCell, { fontWeight: 'bold' }]}>
              Opening Balance / الرصيد الافتتاحي
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.debitCell]}>-</Text>
            <Text style={[statementStyles.tableCell, statementStyles.creditCell]}>-</Text>
            <Text style={[
              statementStyles.tableCell,
              statementStyles.balanceCell,
              { fontWeight: 'bold' },
            ]}>
              {formatMoneyPDF(report.openingBalance, report.currency)}
            </Text>
          </View>

          {/* Transaction Rows */}
          {report.transactions.length > 0 ? (
            report.transactions.map((tx, index) => (
              <View
                key={`${tx.reference}-${index}`}
                style={[
                  statementStyles.tableRow,
                  index % 2 === 1 ? statementStyles.tableRowAlt : {},
                ]}
              >
                <Text style={[statementStyles.tableCell, statementStyles.dateCell]}>
                  {tx.date}
                </Text>
                <Text style={[statementStyles.tableCell, statementStyles.referenceCell]}>
                  {tx.reference}
                </Text>
                <View style={statementStyles.typeCell}>
                  <View style={[
                    statementStyles.typeBadge,
                    tx.type === 'invoice'
                      ? statementStyles.invoiceBadge
                      : statementStyles.paymentBadge,
                  ]}>
                    <Text>{tx.type === 'invoice' ? 'Invoice' : 'Payment'}</Text>
                  </View>
                </View>
                <Text style={[statementStyles.tableCell, statementStyles.descriptionCell]}>
                  {tx.description}
                </Text>
                <Text style={[
                  statementStyles.tableCell,
                  statementStyles.debitCell,
                  tx.debit > 0 ? statementStyles.debitValue : {},
                ]}>
                  {tx.debit > 0 ? formatMoneyPDF(tx.debit, report.currency) : '-'}
                </Text>
                <Text style={[
                  statementStyles.tableCell,
                  statementStyles.creditCell,
                  tx.credit > 0 ? statementStyles.creditValue : {},
                ]}>
                  {tx.credit > 0 ? formatMoneyPDF(tx.credit, report.currency) : '-'}
                </Text>
                <Text style={[
                  statementStyles.tableCell,
                  statementStyles.balanceCell,
                  tx.balance > 0 ? statementStyles.positiveBalance : statementStyles.negativeBalance,
                ]}>
                  {formatMoneyPDF(tx.balance, report.currency)}
                </Text>
              </View>
            ))
          ) : (
            <View style={statementStyles.tableRow}>
              <Text style={statementStyles.noTransactions}>
                No transactions in this period
              </Text>
            </View>
          )}

          {/* Closing Balance Row */}
          <View style={[statementStyles.tableRow, statementStyles.closingRow]}>
            <Text style={[statementStyles.tableCell, statementStyles.dateCell, statementStyles.closingRowCell]}>
              {report.period.endDate}
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.referenceCell, statementStyles.closingRowCell]}>
              -
            </Text>
            <Text style={[
              statementStyles.tableCell,
              statementStyles.typeCell,
              statementStyles.closingRowCell,
              { fontWeight: 'bold' },
            ]}>
              Closing
            </Text>
            <Text style={[
              statementStyles.tableCell,
              statementStyles.descriptionCell,
              statementStyles.closingRowCell,
              { fontWeight: 'bold' },
            ]}>
              Closing Balance / الرصيد الختامي
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.debitCell, statementStyles.closingRowCell]}>
              -
            </Text>
            <Text style={[statementStyles.tableCell, statementStyles.creditCell, statementStyles.closingRowCell]}>
              -
            </Text>
            <Text style={[
              statementStyles.tableCell,
              statementStyles.balanceCell,
              statementStyles.closingRowCell,
              { fontWeight: 'bold' },
            ]}>
              {formatMoneyPDF(report.closingBalance, report.currency)}
            </Text>
          </View>
        </View>

        {/* Footer Note */}
        <View style={statementStyles.footerNote}>
          <Text style={statementStyles.footerNoteText}>
            {hasPositiveClosingBalance
              ? 'A positive balance indicates an amount owed to the supplier.'
              : 'A negative balance indicates a credit with the supplier.'}
          </Text>
          <Text style={statementStyles.footerNoteTextAr}>
            {hasPositiveClosingBalance
              ? 'الرصيد الموجب يشير إلى مبلغ مستحق للمورد'
              : 'الرصيد السالب يشير إلى رصيد دائن لدى المورد'}
          </Text>
        </View>

        <PDFFooter companyName={businessInfo.name} />
      </Page>
    </Document>
  );
}

export default SupplierStatementPDF;
