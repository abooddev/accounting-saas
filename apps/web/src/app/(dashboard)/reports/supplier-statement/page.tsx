'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSupplierStatement } from '@/hooks/use-reports';
import { useContacts } from '@/hooks/use-contacts';
import { getDateRange } from '@accounting/shared';
import { formatMoney } from '@accounting/shared';
import { DateRangePicker } from '@/components/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, History, Download, FileText, Loader2 } from 'lucide-react';
import { exportSupplierStatementToExcel } from '@/lib/excel';
import { SupplierStatementPDF } from '@/components/pdf';
import { usePDFDownload } from '@/components/pdf/usePDFDownload';

function SupplierStatementContent() {
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId') || '';

  const defaultRange = getDateRange('this_month');
  const [contactId, setContactId] = useState(contactIdParam);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const { data: contacts } = useContacts({ type: 'supplier' });
  const { data: report, isLoading } = useSupplierStatement(contactId, { startDate, endDate });
  const { downloadPDF, isGenerating } = usePDFDownload();

  const handleDownloadPDF = async () => {
    if (!report) return;
    const filename = `statement-${report.supplier.name}-${startDate}-to-${endDate}.pdf`;
    await downloadPDF(<SupplierStatementPDF report={report} />, filename);
  };

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports/supplier-balances">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Supplier Statement</h1>
            <p className="text-muted-foreground">
              Transaction history for a supplier
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => exportSupplierStatementToExcel(report)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </>
          )}
          {contactId && (
            <Link href={`/contacts/${contactId}`}>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                View Purchase History
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {contacts?.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </div>

      {!contactId ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">
              Select a supplier to view their statement
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle>
                {report.supplier.name}
                {report.supplier.nameAr && (
                  <span className="text-muted-foreground ml-2 font-normal" dir="rtl">
                    ({report.supplier.nameAr})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">{report.period.startDate} to {report.period.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opening Balance</p>
                  <p className="font-medium text-lg">
                    {formatMoney(report.openingBalance, report.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closing Balance</p>
                  <p className={`font-medium text-lg ${report.closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMoney(report.closingBalance, report.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {report.transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No transactions in this period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="font-medium">Opening Balance</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.openingBalance, report.currency)}
                      </TableCell>
                    </TableRow>
                    {report.transactions.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{tx.date}</TableCell>
                        <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'invoice' ? 'secondary' : 'default'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell className="text-right">
                          {tx.debit > 0 ? formatMoney(tx.debit, report.currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {tx.credit > 0 ? formatMoney(tx.credit, report.currency) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.balance > 0 ? 'text-red-600' : ''}`}>
                          {formatMoney(tx.balance, report.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>Closing Balance</TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className={`text-right ${report.closingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(report.closingBalance, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default function SupplierStatementPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <SupplierStatementContent />
    </Suspense>
  );
}
