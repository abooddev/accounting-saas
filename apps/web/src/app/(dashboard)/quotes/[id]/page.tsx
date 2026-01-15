'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useQuote,
  useSendQuote,
  useAcceptQuote,
  useRejectQuote,
  useConvertQuoteToInvoice,
  useDuplicateQuote,
} from '@/hooks/use-quotes';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  FileCheck,
  Download,
  Copy,
  Edit,
  Loader2,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: quote, isLoading } = useQuote(id);

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const sendMutation = useSendQuote();
  const acceptMutation = useAcceptQuote();
  const rejectMutation = useRejectQuote();
  const convertMutation = useConvertQuoteToInvoice();
  const duplicateMutation = useDuplicateQuote();

  const handleSend = async () => {
    await sendMutation.mutateAsync(id);
    setShowSendDialog(false);
  };

  const handleAccept = async () => {
    await acceptMutation.mutateAsync(id);
  };

  const handleReject = async () => {
    await rejectMutation.mutateAsync({ id, reason: rejectReason });
    setShowRejectDialog(false);
    setRejectReason('');
  };

  const handleConvert = async () => {
    const result = await convertMutation.mutateAsync(id);
    setShowConvertDialog(false);
    router.push(`/invoices/${result.invoiceId}`);
  };

  const handleDuplicate = async () => {
    const newQuote = await duplicateMutation.mutateAsync(id);
    router.push(`/quotes/${newQuote.id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--cedar))]" />
          <span>Loading quote...</span>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Quote not found</p>
        <Link href="/quotes">
          <Button variant="outline">Back to Quotes</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = QUOTE_STATUSES.find(s => s.value === quote.status);

  const getStatusVariant = (status: string): string => {
    const variants: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger',
      expired: 'bg-stone/10 text-stone border border-stone/20',
      converted: 'bg-[hsl(var(--cedar))]/10 text-[hsl(var(--cedar))] border border-[hsl(var(--cedar))]/20',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  const isExpired = () => {
    const today = new Date().toISOString().split('T')[0];
    return quote.validUntil < today;
  };

  const daysUntilExpiry = () => {
    const today = new Date();
    const expiryDate = new Date(quote.validUntil);
    return Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-foreground">{quote.number}</h1>
              <Badge className={getStatusVariant(quote.status)}>
                {statusInfo?.label || quote.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Quote for {quote.customer?.name || 'Unknown Customer'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Print / Export
          </Button>
          <Button variant="outline" onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          {quote.status === 'draft' && (
            <>
              <Link href={`/quotes/${quote.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button className="btn-cedar" onClick={() => setShowSendDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </>
          )}
          {quote.status === 'sent' && !isExpired() && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button className="btn-cedar" onClick={handleAccept} disabled={acceptMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
              </Button>
            </>
          )}
          {quote.status === 'accepted' && (
            <Button className="btn-gold" onClick={() => setShowConvertDialog(true)}>
              <FileCheck className="h-4 w-4 mr-2" />
              Convert to Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {quote.status === 'sent' && daysUntilExpiry() <= 7 && daysUntilExpiry() > 0 && (
        <div className="p-4 rounded-lg bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/20">
          <p className="text-sm font-medium text-[hsl(var(--gold))]">
            This quote expires in {daysUntilExpiry()} day{daysUntilExpiry() !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      {quote.status === 'expired' && (
        <div className="p-4 rounded-lg bg-stone/10 border border-stone/20">
          <p className="text-sm font-medium text-stone">
            This quote has expired on {quote.validUntil}
          </p>
        </div>
      )}
      {quote.status === 'rejected' && quote.rejectionReason && (
        <div className="p-4 rounded-lg bg-terracotta/10 border border-terracotta/20">
          <p className="text-sm font-medium text-terracotta">
            Rejection reason: {quote.rejectionReason}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 card-premium">
          <CardHeader>
            <CardTitle className="font-display">Quote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{quote.customer?.name || '-'}</p>
                    {quote.customer?.nameAr && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{quote.customer.nameAr}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quote Date</p>
                    <p className="font-medium">{quote.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Until</p>
                    <p className="font-medium">{quote.validUntil}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">{quote.currency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exchange Rate</p>
                  <p className="font-medium">{quote.exchangeRate} LBP/USD</p>
                </div>
                {quote.convertedToType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Converted To</p>
                    <Link
                      href={quote.convertedToType === 'invoice' ? `/invoices/${quote.convertedToId}` : `/sales-orders/${quote.convertedToId}`}
                      className="font-medium text-[hsl(var(--cedar))] hover:underline"
                    >
                      {quote.convertedToType === 'invoice' ? 'Invoice' : 'Sales Order'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            {quote.terms && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-2">Terms & Conditions</p>
                <p className="text-sm whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
            {quote.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="font-display">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(parseFloat(quote.subtotal ?? '0'), quote.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-[hsl(var(--sage))]">
                -{formatMoney(parseFloat(quote.discountAmount ?? '0'), quote.currency)}
              </span>
            </div>
            {parseFloat(quote.taxAmount ?? '0') > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(parseFloat(quote.taxAmount ?? '0'), quote.currency)}</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[hsl(var(--cedar))]">
                  {formatMoney(parseFloat(quote.total ?? '0'), quote.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="font-display">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="table-warm">
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
              {quote.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.description}</div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(parseFloat(item.unitPrice ?? '0'), quote.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discountPercent}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(parseFloat(item.lineTotal ?? '0'), quote.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this quote to {quote.customer?.name}? Once sent, the quote cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              className="btn-cedar"
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quote.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Rejection reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-warm"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              This will create a new sales invoice from this quote. The quote status will be changed to &quot;converted&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button
              className="btn-gold"
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
