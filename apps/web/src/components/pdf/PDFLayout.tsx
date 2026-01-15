'use client';

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ReactNode } from 'react';

// Register fonts for Arabic support
// Note: In production, you'd want to host these fonts or use embedded ones
Font.register({
  family: 'Amiri',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHpUrtLMA7w.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/amiri/v27/J7acnpd8CGxBHp2VkZY4xK9CGyAa.ttf',
      fontWeight: 'bold',
    },
  ],
});

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5g.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Create styles
export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a2e',
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  businessNameAr: {
    fontFamily: 'Amiri',
    fontSize: 16,
    color: '#4a4a6a',
    marginBottom: 8,
    textAlign: 'right',
  },
  businessAddress: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 8,
    color: '#999999',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
  pageNumber: {
    fontSize: 8,
    color: '#666666',
  },
  // Table styles
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: '#f9f9fc',
  },
  tableCell: {
    fontSize: 9,
    color: '#333333',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  // Section styles
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 4,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#333333',
    fontWeight: 'bold',
  },
  // RTL text support
  rtlText: {
    fontFamily: 'Amiri',
    textAlign: 'right',
  },
  // Currency display
  dualCurrency: {
    marginTop: 2,
  },
  primaryAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  secondaryAmount: {
    fontSize: 8,
    color: '#666666',
    marginTop: 1,
  },
  // Totals section
  totalsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    fontSize: 9,
    color: '#666666',
    paddingRight: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
    color: '#333333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a1a2e',
  },
  grandTotalLabel: {
    width: 120,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a2e',
    paddingRight: 10,
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  // Badge/Status styles
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgePending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  badgePaid: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  badgeCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  badgePartial: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
});

// Business info interface
export interface BusinessInfo {
  name: string;
  nameAr?: string;
  address?: string;
  addressAr?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

// Default business info (can be overridden)
export const defaultBusinessInfo: BusinessInfo = {
  name: 'Lebanese Accounting Co.',
  nameAr: 'شركة المحاسبة اللبنانية',
  address: 'Beirut, Lebanon',
  phone: '+961 1 234 567',
  email: 'info@lebaccounting.com',
};

// Header component
interface PDFHeaderProps {
  businessInfo?: BusinessInfo;
  title?: string;
  titleAr?: string;
  documentNumber?: string;
  documentDate?: string;
}

export function PDFHeader({
  businessInfo = defaultBusinessInfo,
  title,
  titleAr,
  documentNumber,
  documentDate,
}: PDFHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <View style={pdfStyles.headerContent}>
        <View style={pdfStyles.businessInfo}>
          <Text style={pdfStyles.businessName}>{businessInfo.name}</Text>
          {businessInfo.nameAr && (
            <Text style={pdfStyles.businessNameAr}>{businessInfo.nameAr}</Text>
          )}
          {businessInfo.address && (
            <Text style={pdfStyles.businessAddress}>{businessInfo.address}</Text>
          )}
          {businessInfo.phone && (
            <Text style={pdfStyles.businessAddress}>Tel: {businessInfo.phone}</Text>
          )}
          {businessInfo.email && (
            <Text style={pdfStyles.businessAddress}>{businessInfo.email}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {title && (
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 }}>
              {title}
            </Text>
          )}
          {titleAr && (
            <Text style={[pdfStyles.rtlText, { fontSize: 14, color: '#4a4a6a', marginBottom: 8 }]}>
              {titleAr}
            </Text>
          )}
          {documentNumber && (
            <Text style={{ fontSize: 10, color: '#333333', marginBottom: 2 }}>
              #{documentNumber}
            </Text>
          )}
          {documentDate && (
            <Text style={{ fontSize: 9, color: '#666666' }}>
              Date: {documentDate}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// Footer component with page numbers
interface PDFFooterProps {
  companyName?: string;
}

export function PDFFooter({ companyName }: PDFFooterProps) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>
        {companyName || defaultBusinessInfo.name}
      </Text>
      <Text
        style={pdfStyles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// Main document wrapper
interface PDFDocumentWrapperProps {
  children: ReactNode;
  title?: string;
}

export function PDFDocumentWrapper({ children, title }: PDFDocumentWrapperProps) {
  return (
    <Document title={title} author={defaultBusinessInfo.name}>
      {children}
    </Document>
  );
}

// Utility function for formatting money in PDFs (without Intl for PDF compatibility)
export function formatMoneyPDF(
  amount: number,
  currency: string = 'USD'
): string {
  const symbol = currency === 'LBP' ? 'L.L. ' : '$';
  const decimals = currency === 'LBP' ? 0 : 2;

  const formattedNumber = amount
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return currency === 'LBP'
    ? `${formattedNumber} ${symbol}`
    : `${symbol}${formattedNumber}`;
}

// Dual currency display component
interface DualCurrencyProps {
  amountUSD: number;
  exchangeRate: number;
  showLBP?: boolean;
}

export function DualCurrencyDisplay({ amountUSD, exchangeRate, showLBP = true }: DualCurrencyProps) {
  const amountLBP = amountUSD * exchangeRate;

  return (
    <View style={pdfStyles.dualCurrency}>
      <Text style={pdfStyles.primaryAmount}>
        {formatMoneyPDF(amountUSD, 'USD')}
      </Text>
      {showLBP && (
        <Text style={pdfStyles.secondaryAmount}>
          ({formatMoneyPDF(amountLBP, 'LBP')})
        </Text>
      )}
    </View>
  );
}

// Info item component
interface InfoItemProps {
  label: string;
  value: string | number;
  labelAr?: string;
  valueAr?: string;
}

export function InfoItem({ label, value, labelAr, valueAr }: InfoItemProps) {
  return (
    <View style={pdfStyles.infoItem}>
      <Text style={pdfStyles.infoLabel}>{label}</Text>
      <Text style={pdfStyles.infoValue}>{value}</Text>
      {labelAr && (
        <Text style={[pdfStyles.infoLabel, pdfStyles.rtlText]}>{labelAr}</Text>
      )}
      {valueAr && (
        <Text style={[pdfStyles.infoValue, pdfStyles.rtlText]}>{valueAr}</Text>
      )}
    </View>
  );
}

// Section wrapper component
interface SectionProps {
  title: string;
  titleAr?: string;
  children: ReactNode;
}

export function PDFSection({ title, titleAr, children }: SectionProps) {
  return (
    <View style={pdfStyles.section}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={pdfStyles.sectionTitle}>{title}</Text>
        {titleAr && (
          <Text style={[pdfStyles.sectionTitle, pdfStyles.rtlText, { borderBottomWidth: 0 }]}>
            {titleAr}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: 'pending' | 'paid' | 'cancelled' | 'partial' | 'draft';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'paid': return pdfStyles.badgePaid;
      case 'cancelled': return pdfStyles.badgeCancelled;
      case 'partial': return pdfStyles.badgePartial;
      default: return pdfStyles.badgePending;
    }
  };

  return (
    <View style={[pdfStyles.badge, getBadgeStyle()]}>
      <Text>{label}</Text>
    </View>
  );
}
