'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInvoice, useConfirmInvoice, useCancelInvoice } from '@/hooks/use-invoices';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, Download, Loader2 } from 'lucide-react';
import { formatMoney, INVOICE_STATUSES } from '@accounting/shared';
import { InvoicePDF } from '@/components/pdf';
import { usePDFDownload } from '@/components/pdf/usePDFDownload';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(id);
  const confirmMutation = useConfirmInvoice();
  const cancelMutation = useCancelInvoice();
  const { downloadPDF, isGenerating } = usePDFDownload();

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    const filename = `invoice-${invoice.internalNumber}.pdf`;
    await downloadPDF(<InvoicePDF invoice={invoice} />, filename);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex items-center justify-center h-64">Invoice not found</div>;
  }

  const statusInfo = INVOICE_STATUSES.find(s => s.value === invoice.status);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      pending: 'default',
      partial: 'outline',
      paid: 'default',
      cancelled: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync(id);
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.internalNumber}</h1>
            <p className="text-muted-foreground">
              {invoice.type === 'purchase' ? 'Purchase Invoice' : 'Expense Invoice'}
            </p>
          </div>
          <Badge variant={getStatusVariant(invoice.status)}>
            {statusInfo?.label || invoice.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          {invoice.status === 'draft' && (
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm'}
            </Button>
          )}
          {['pending', 'partial'].includes(invoice.status) && (
            <Link href={`/payments/new?invoiceId=${invoice.id}`}>
              <Button>
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </Link>
          )}
          {['draft', 'pending', 'partial'].includes(invoice.status) && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Supplier Invoice #</p>
                <p className="font-medium">{invoice.supplierInvoiceNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{invoice.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{invoice.dueDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exchange Rate</p>
                <p className="font-medium">{invoice.exchangeRate} LBP/USD</p>
              </div>
              {invoice.expenseCategory && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Expense Category</p>
                  <p className="font-medium">{invoice.expenseCategory}</p>
                </div>
              )}
              {invoice.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{invoice.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(parseFloat(invoice.subtotal ?? '0'), invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatMoney(parseFloat(invoice.discountAmount ?? '0'), invoice.currency)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatMoney(parseFloat(invoice.total ?? '0'), invoice.currency)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-green-600">
                -{formatMoney(parseFloat(invoice.paidAmount ?? '0'), invoice.currency)}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Balance Due</span>
                <span className="text-red-600">
                  {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.description}</div>
                      {item.notes && (
                        <div className="text-sm text-muted-foreground">{item.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(parseFloat(item.unitPrice ?? '0'), invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discountPercent}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(parseFloat(item.total ?? '0'), invoice.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
