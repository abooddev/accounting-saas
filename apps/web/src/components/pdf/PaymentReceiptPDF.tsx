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
import type { PaymentWithRelations } from '@accounting/shared';

// Receipt-specific styles
const receiptStyles = StyleSheet.create({
  receiptContainer: {
    padding: 20,
  },
  receiptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 4,
  },
  receiptTitleAr: {
    fontFamily: 'Amiri',
    fontSize: 16,
    color: '#4a4a6a',
    textAlign: 'center',
    marginBottom: 15,
  },
  receiptNumber: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },
  amountSection: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 6,
    marginBottom: 25,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 6,
  },
  amountLabelAr: {
    fontFamily: 'Amiri',
    fontSize: 9,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  amountLbp: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 6,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  detailBox: {
    width: '50%',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ed',
  },
  detailBoxFull: {
    width: '100%',
  },
  detailLabel: {
    fontSize: 8,
    color: '#999999',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailLabelAr: {
    fontFamily: 'Amiri',
    fontSize: 8,
    color: '#999999',
    textAlign: 'right',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
  },
  detailValueAr: {
    fontFamily: 'Amiri',
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
    marginTop: 2,
  },
  contactSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9fc',
    borderRadius: 4,
  },
  contactSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
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
  },
  invoiceReference: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  invoiceReferenceTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#17a2b8',
    marginBottom: 6,
  },
  invoiceReferenceText: {
    fontSize: 10,
    color: '#333333',
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff8e1',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 6,
    height: 40,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  signatureLabelAr: {
    fontFamily: 'Amiri',
    fontSize: 8,
    color: '#888888',
    textAlign: 'center',
  },
  stampSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  stampPlaceholder: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: 60,
    color: '#f0f0f5',
    transform: 'rotate(-30deg)',
    fontWeight: 'bold',
    opacity: 0.3,
  },
  paymentMethodBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  paymentMethodText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

// Get payment method info
function getPaymentMethodInfo(method: string): { label: string; labelAr: string; bg: string; color: string } {
  const methods: Record<string, { label: string; labelAr: string; bg: string; color: string }> = {
    cash: { label: 'Cash', labelAr: 'نقدي', bg: '#d4edda', color: '#155724' },
    bank_transfer: { label: 'Bank Transfer', labelAr: 'تحويل بنكي', bg: '#cce5ff', color: '#004085' },
    check: { label: 'Check', labelAr: 'شيك', bg: '#e2e3e5', color: '#383d41' },
    whish: { label: 'Whish Money', labelAr: 'ويش موني', bg: '#d4edda', color: '#155724' },
    omt: { label: 'OMT', labelAr: 'او ام تي', bg: '#fff3cd', color: '#856404' },
  };
  return methods[method] || methods.cash;
}

// Get payment type info
function getPaymentTypeInfo(type: string): { title: string; titleAr: string } {
  const types: Record<string, { title: string; titleAr: string }> = {
    supplier_payment: { title: 'PAYMENT RECEIPT', titleAr: 'ايصال دفع' },
    expense_payment: { title: 'EXPENSE RECEIPT', titleAr: 'ايصال مصروفات' },
    customer_receipt: { title: 'PAYMENT RECEIPT', titleAr: 'ايصال استلام' },
  };
  return types[type] || types.supplier_payment;
}

interface PaymentReceiptPDFProps {
  payment: PaymentWithRelations;
  businessInfo?: BusinessInfo;
}

export function PaymentReceiptPDF({
  payment,
  businessInfo = defaultBusinessInfo,
}: PaymentReceiptPDFProps) {
  const typeInfo = getPaymentTypeInfo(payment.type);
  const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
  const amount = parseFloat(payment.amount || '0');
  const exchangeRate = parseFloat(payment.exchangeRate || '89500');
  const amountLbp = payment.currency === 'USD' ? amount * exchangeRate : parseFloat(payment.amountLbp || '0');

  return (
    <Document
      title={`Receipt ${payment.paymentNumber}`}
      author={businessInfo.name}
    >
      <Page size="A4" style={pdfStyles.page}>
        {/* Watermark for paid receipts */}
        <Text style={receiptStyles.watermark}>PAID</Text>

        <PDFHeader
          businessInfo={businessInfo}
          title={typeInfo.title}
          titleAr={typeInfo.titleAr}
          documentNumber={payment.paymentNumber}
          documentDate={payment.date}
        />

        {/* Amount Section */}
        <View style={receiptStyles.amountSection}>
          <Text style={receiptStyles.amountLabel}>Amount Paid</Text>
          <Text style={receiptStyles.amountLabelAr}>المبلغ المدفوع</Text>
          <Text style={receiptStyles.amountValue}>
            {formatMoneyPDF(amount, payment.currency)}
          </Text>
          {payment.currency === 'USD' && (
            <Text style={receiptStyles.amountLbp}>
              ({formatMoneyPDF(amountLbp, 'LBP')})
            </Text>
          )}
        </View>

        {/* Payment Details Grid */}
        <View style={receiptStyles.detailsGrid}>
          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Receipt Number</Text>
            <Text style={receiptStyles.detailLabelAr}>رقم الايصال</Text>
            <Text style={receiptStyles.detailValue}>{payment.paymentNumber}</Text>
          </View>

          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Date</Text>
            <Text style={receiptStyles.detailLabelAr}>التاريخ</Text>
            <Text style={receiptStyles.detailValue}>{payment.date}</Text>
          </View>

          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Payment Method</Text>
            <Text style={receiptStyles.detailLabelAr}>طريقة الدفع</Text>
            <View style={[receiptStyles.paymentMethodBadge, { backgroundColor: methodInfo.bg }]}>
              <Text style={[receiptStyles.paymentMethodText, { color: methodInfo.color }]}>
                {methodInfo.label} / {methodInfo.labelAr}
              </Text>
            </View>
          </View>

          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Account</Text>
            <Text style={receiptStyles.detailLabelAr}>الحساب</Text>
            <Text style={receiptStyles.detailValue}>
              {payment.account?.name || 'N/A'}
            </Text>
            {payment.account && (
              <Text style={{ fontSize: 8, color: '#666666', marginTop: 2 }}>
                {payment.account.type === 'cash' ? 'Cash' : 'Bank'} - {payment.account.currency}
              </Text>
            )}
          </View>

          {payment.reference && (
            <View style={[receiptStyles.detailBox, receiptStyles.detailBoxFull]}>
              <Text style={receiptStyles.detailLabel}>Reference</Text>
              <Text style={receiptStyles.detailLabelAr}>المرجع</Text>
              <Text style={receiptStyles.detailValue}>{payment.reference}</Text>
            </View>
          )}

          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Currency</Text>
            <Text style={receiptStyles.detailLabelAr}>العملة</Text>
            <Text style={receiptStyles.detailValue}>{payment.currency}</Text>
          </View>

          <View style={receiptStyles.detailBox}>
            <Text style={receiptStyles.detailLabel}>Exchange Rate</Text>
            <Text style={receiptStyles.detailLabelAr}>سعر الصرف</Text>
            <Text style={receiptStyles.detailValue}>
              {formatMoneyPDF(exchangeRate, 'LBP')}/USD
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        {payment.contact && (
          <View style={receiptStyles.contactSection}>
            <Text style={receiptStyles.contactSectionTitle}>
              {payment.type === 'customer_receipt' ? 'Received From / المستلم من' : 'Paid To / الدفع إلى'}
            </Text>
            <Text style={receiptStyles.contactName}>{payment.contact.name}</Text>
            {payment.contact.nameAr && (
              <Text style={receiptStyles.contactNameAr}>{payment.contact.nameAr}</Text>
            )}
          </View>
        )}

        {/* Invoice Reference */}
        {payment.invoice && (
          <View style={receiptStyles.invoiceReference}>
            <Text style={receiptStyles.invoiceReferenceTitle}>
              Applied to Invoice / مطبق على الفاتورة
            </Text>
            <Text style={receiptStyles.invoiceReferenceText}>
              Invoice #{payment.invoice.internalNumber} - Total: {formatMoneyPDF(parseFloat(payment.invoice.total || '0'), payment.currency)}
            </Text>
          </View>
        )}

        {/* Notes */}
        {payment.notes && (
          <View style={receiptStyles.notesSection}>
            <Text style={receiptStyles.notesTitle}>Notes / ملاحظات</Text>
            <Text style={receiptStyles.notesText}>{payment.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={receiptStyles.signatureSection}>
          <View style={receiptStyles.signatureBox}>
            <View style={receiptStyles.signatureLine} />
            <Text style={receiptStyles.signatureLabel}>Authorized Signature</Text>
            <Text style={receiptStyles.signatureLabelAr}>التوقيع المعتمد</Text>
          </View>

          <View style={receiptStyles.signatureBox}>
            <View style={receiptStyles.signatureLine} />
            <Text style={receiptStyles.signatureLabel}>
              {payment.type === 'customer_receipt' ? 'Received By' : 'Received By'}
            </Text>
            <Text style={receiptStyles.signatureLabelAr}>
              {payment.type === 'customer_receipt' ? 'المستلم' : 'المستلم'}
            </Text>
          </View>
        </View>

        {/* Stamp Placeholder */}
        <View style={receiptStyles.stampSection}>
          <View style={receiptStyles.stampPlaceholder}>
            <Text style={receiptStyles.stampText}>Company{'\n'}Stamp</Text>
          </View>
        </View>

        <PDFFooter companyName={businessInfo.name} />
      </Page>
    </Document>
  );
}

export default PaymentReceiptPDF;
