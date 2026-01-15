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
import type { InvoiceWithItems } from '@accounting/shared';

// Invoice-specific styles
const invoiceStyles = StyleSheet.create({
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 20,
  },
  documentTitleAr: {
    fontFamily: 'Amiri',
    fontSize: 18,
    color: '#4a4a6a',
    textAlign: 'center',
    marginBottom: 20,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  invoiceInfoBox: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
  },
  boxTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
  },
  boxTitleAr: {
    fontFamily: 'Amiri',
    fontSize: 10,
    color: '#4a4a6a',
    textAlign: 'right',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  contactNameAr: {
    fontFamily: 'Amiri',
    fontSize: 11,
    color: '#666666',
    textAlign: 'right',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  itemsTable: {
    marginTop: 15,
    marginBottom: 15,
  },
  itemTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  itemHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ed',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  itemTableRowAlt: {
    backgroundColor: '#fafafc',
  },
  itemCell: {
    fontSize: 9,
    color: '#333333',
  },
  itemDescription: {
    flex: 1,
    paddingRight: 8,
  },
  itemQty: {
    width: 50,
    textAlign: 'center',
  },
  itemUnit: {
    width: 40,
    textAlign: 'center',
  },
  itemPrice: {
    width: 80,
    textAlign: 'right',
  },
  itemDiscount: {
    width: 50,
    textAlign: 'center',
  },
  itemTotal: {
    width: 90,
    textAlign: 'right',
  },
  summaryBox: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 280,
    padding: 15,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 9,
    color: '#333333',
    fontWeight: 'bold',
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  lbpEquivalent: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  balanceSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1a1a2e',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paidAmount: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: 'bold',
  },
  balanceDue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

// Get status styles
function getStatusStyles(status: string): { bg: string; color: string; label: string } {
  const statusMap: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: '#e2e3e5', color: '#383d41', label: 'Draft' },
    pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
    partial: { bg: '#cce5ff', color: '#004085', label: 'Partial Payment' },
    paid: { bg: '#d4edda', color: '#155724', label: 'Paid' },
    cancelled: { bg: '#f8d7da', color: '#721c24', label: 'Cancelled' },
  };
  return statusMap[status] || statusMap.pending;
}

// Get invoice type info
function getInvoiceTypeInfo(type: string): { title: string; titleAr: string } {
  const typeMap: Record<string, { title: string; titleAr: string }> = {
    purchase: { title: 'PURCHASE INVOICE', titleAr: 'فاتورة شراء' },
    expense: { title: 'EXPENSE INVOICE', titleAr: 'فاتورة مصروفات' },
    sale: { title: 'SALES INVOICE', titleAr: 'فاتورة بيع' },
  };
  return typeMap[type] || typeMap.purchase;
}

interface InvoicePDFProps {
  invoice: InvoiceWithItems;
  businessInfo?: BusinessInfo;
}

export function InvoicePDF({ invoice, businessInfo = defaultBusinessInfo }: InvoicePDFProps) {
  const statusStyle = getStatusStyles(invoice.status);
  const typeInfo = getInvoiceTypeInfo(invoice.type);
  const exchangeRate = parseFloat(invoice.exchangeRate || '89500');
  const total = parseFloat(invoice.total || '0');
  const totalLbp = invoice.currency === 'USD' ? total * exchangeRate : parseFloat(invoice.totalLbp || '0');

  return (
    <Document
      title={`Invoice ${invoice.internalNumber}`}
      author={businessInfo.name}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PDFHeader
          businessInfo={businessInfo}
          title={typeInfo.title}
          titleAr={typeInfo.titleAr}
          documentNumber={invoice.internalNumber}
          documentDate={invoice.date}
        />

        {/* Status Badge */}
        <View style={{ alignItems: 'flex-end', marginBottom: 15 }}>
          <View style={[invoiceStyles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[invoiceStyles.statusText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Invoice & Customer Info */}
        <View style={invoiceStyles.invoiceInfoRow}>
          {/* Invoice Details */}
          <View style={invoiceStyles.invoiceInfoBox}>
            <Text style={invoiceStyles.boxTitle}>Invoice Details</Text>
            <Text style={invoiceStyles.boxTitleAr}>تفاصيل الفاتورة</Text>

            <View style={{ marginTop: 4 }}>
              <Text style={invoiceStyles.infoText}>
                Invoice #: {invoice.internalNumber}
              </Text>
              {invoice.supplierInvoiceNumber && (
                <Text style={invoiceStyles.infoText}>
                  Supplier Ref: {invoice.supplierInvoiceNumber}
                </Text>
              )}
              <Text style={invoiceStyles.infoText}>
                Date: {invoice.date}
              </Text>
              {invoice.dueDate && (
                <Text style={invoiceStyles.infoText}>
                  Due Date: {invoice.dueDate}
                </Text>
              )}
              <Text style={invoiceStyles.infoText}>
                Currency: {invoice.currency}
              </Text>
              {invoice.currency === 'USD' && (
                <Text style={invoiceStyles.infoText}>
                  Exchange Rate: {formatMoneyPDF(exchangeRate, 'LBP')}/USD
                </Text>
              )}
            </View>
          </View>

          {/* Contact Info */}
          <View style={invoiceStyles.invoiceInfoBox}>
            <Text style={invoiceStyles.boxTitle}>
              {invoice.type === 'sale' ? 'Customer' : 'Supplier'}
            </Text>
            <Text style={invoiceStyles.boxTitleAr}>
              {invoice.type === 'sale' ? 'العميل' : 'المورد'}
            </Text>

            {invoice.contact ? (
              <View style={{ marginTop: 4 }}>
                <Text style={invoiceStyles.contactName}>
                  {invoice.contact.name}
                </Text>
                {invoice.contact.nameAr && (
                  <Text style={invoiceStyles.contactNameAr}>
                    {invoice.contact.nameAr}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={invoiceStyles.infoText}>
                {invoice.expenseCategory || 'Not specified'}
              </Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={invoiceStyles.itemsTable}>
          {/* Table Header */}
          <View style={invoiceStyles.itemTableHeader}>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemDescription]}>
              Description / الوصف
            </Text>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemQty]}>
              Qty
            </Text>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemUnit]}>
              Unit
            </Text>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemPrice]}>
              Unit Price
            </Text>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemDiscount]}>
              Disc.%
            </Text>
            <Text style={[invoiceStyles.itemHeaderCell, invoiceStyles.itemTotal]}>
              Total
            </Text>
          </View>

          {/* Table Rows */}
          {invoice.items?.map((item, index) => (
            <View
              key={item.id}
              style={[
                invoiceStyles.itemTableRow,
                index % 2 === 1 ? invoiceStyles.itemTableRowAlt : {},
              ]}
            >
              <View style={invoiceStyles.itemDescription}>
                <Text style={invoiceStyles.itemCell}>
                  {item.description}
                </Text>
                {item.notes && (
                  <Text style={[invoiceStyles.itemCell, { fontSize: 8, color: '#999999', marginTop: 2 }]}>
                    {item.notes}
                  </Text>
                )}
              </View>
              <Text style={[invoiceStyles.itemCell, invoiceStyles.itemQty]}>
                {item.quantity}
              </Text>
              <Text style={[invoiceStyles.itemCell, invoiceStyles.itemUnit]}>
                {item.unit || '-'}
              </Text>
              <Text style={[invoiceStyles.itemCell, invoiceStyles.itemPrice]}>
                {formatMoneyPDF(parseFloat(item.unitPrice || '0'), invoice.currency)}
              </Text>
              <Text style={[invoiceStyles.itemCell, invoiceStyles.itemDiscount]}>
                {item.discountPercent || '0'}%
              </Text>
              <Text style={[invoiceStyles.itemCell, invoiceStyles.itemTotal, { fontWeight: 'bold' }]}>
                {formatMoneyPDF(parseFloat(item.total || '0'), invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={invoiceStyles.summaryBox}>
          <View style={invoiceStyles.summaryRow}>
            <Text style={invoiceStyles.summaryLabel}>Subtotal:</Text>
            <Text style={invoiceStyles.summaryValue}>
              {formatMoneyPDF(parseFloat(invoice.subtotal || '0'), invoice.currency)}
            </Text>
          </View>

          {parseFloat(invoice.discountAmount || '0') > 0 && (
            <View style={invoiceStyles.summaryRow}>
              <Text style={invoiceStyles.summaryLabel}>
                Discount ({invoice.discountType === 'percent' ? `${invoice.discountValue}%` : 'Fixed'}):
              </Text>
              <Text style={[invoiceStyles.summaryValue, { color: '#28a745' }]}>
                -{formatMoneyPDF(parseFloat(invoice.discountAmount || '0'), invoice.currency)}
              </Text>
            </View>
          )}

          {parseFloat(invoice.taxAmount || '0') > 0 && (
            <View style={invoiceStyles.summaryRow}>
              <Text style={invoiceStyles.summaryLabel}>
                Tax ({invoice.taxRate}%):
              </Text>
              <Text style={invoiceStyles.summaryValue}>
                {formatMoneyPDF(parseFloat(invoice.taxAmount || '0'), invoice.currency)}
              </Text>
            </View>
          )}

          <View style={invoiceStyles.summaryDivider} />

          <View style={invoiceStyles.grandTotalRow}>
            <Text style={invoiceStyles.grandTotalLabel}>Total:</Text>
            <Text style={invoiceStyles.grandTotalValue}>
              {formatMoneyPDF(total, invoice.currency)}
            </Text>
          </View>

          {invoice.currency === 'USD' && (
            <Text style={invoiceStyles.lbpEquivalent}>
              ({formatMoneyPDF(totalLbp, 'LBP')})
            </Text>
          )}

          {/* Balance Section */}
          {(parseFloat(invoice.paidAmount || '0') > 0 || parseFloat(invoice.balance || '0') > 0) && (
            <View style={invoiceStyles.balanceSection}>
              <View style={invoiceStyles.balanceRow}>
                <Text style={invoiceStyles.summaryLabel}>Amount Paid:</Text>
                <Text style={invoiceStyles.paidAmount}>
                  -{formatMoneyPDF(parseFloat(invoice.paidAmount || '0'), invoice.currency)}
                </Text>
              </View>
              <View style={invoiceStyles.balanceRow}>
                <Text style={invoiceStyles.summaryLabel}>Balance Due:</Text>
                <Text style={invoiceStyles.balanceDue}>
                  {formatMoneyPDF(parseFloat(invoice.balance || '0'), invoice.currency)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={invoiceStyles.notesSection}>
            <Text style={invoiceStyles.notesTitle}>Notes / ملاحظات</Text>
            <Text style={invoiceStyles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <PDFFooter companyName={businessInfo.name} />
      </Page>
    </Document>
  );
}

export default InvoicePDF;
