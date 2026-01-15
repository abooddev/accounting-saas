'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useQuotes,
  useDeleteQuote,
  useSendQuote,
  useConvertQuoteToInvoice,
  useDuplicateQuote,
} from '@/hooks/use-quotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Send,
  FileText,
  Copy,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { QuoteWithItems } from '@/lib/api/quotes';

const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
];

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteQuote, setDeleteQuote] = useState<QuoteWithItems | null>(null);
  const [sendQuote, setSendQuote] = useState<QuoteWithItems | null>(null);
  const [convertQuote, setConvertQuote] = useState<QuoteWithItems | null>(null);

  const { data: quotes, isLoading } = useQuotes({
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  const deleteMutation = useDeleteQuote();
  const sendMutation = useSendQuote();
  const convertMutation = useConvertQuoteToInvoice();
  const duplicateMutation = useDuplicateQuote();

  const handleDelete = async () => {
    if (deleteQuote) {
      await deleteMutation.mutateAsync(deleteQuote.id);
      setDeleteQuote(null);
    }
  };

  const handleSend = async () => {
    if (sendQuote) {
      await sendMutation.mutateAsync(sendQuote.id);
      setSendQuote(null);
    }
  };

  const handleConvert = async () => {
    if (convertQuote) {
      const result = await convertMutation.mutateAsync(convertQuote.id);
      setConvertQuote(null);
      router.push(`/invoices/${result.invoiceId}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newQuote = await duplicateMutation.mutateAsync(id);
    router.push(`/quotes/${newQuote.id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = QUOTE_STATUSES.find(s => s.value === status);
    const badgeClasses: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger',
      expired: 'bg-stone/10 text-stone border border-stone/20',
      converted: 'bg-[hsl(var(--cedar))]/10 text-[hsl(var(--cedar))] border border-[hsl(var(--cedar))]/20',
    };
    return (
      <Badge className={badgeClasses[status] || 'bg-muted text-muted-foreground'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const isExpiringSoon = (validUntil: string) => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const quotesArray = Array.isArray(quotes) ? quotes : [];
  const filteredQuotes = quotesArray.filter(quote => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      quote.number?.toLowerCase().includes(searchLower) ||
      quote.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground">Create and manage customer quotes</p>
        </div>
        <Link href="/quotes/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-warm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {QUOTE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--cedar))] border-t-transparent" />
                    Loading quotes...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredQuotes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No quotes found. Create your first quote to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes?.map((quote) => (
                <TableRow key={quote.id} className="animate-slide-up">
                  <TableCell>
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="font-medium text-[hsl(var(--cedar))] hover:underline"
                    >
                      {quote.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{quote.customer?.name || '-'}</div>
                    {quote.customer?.nameAr && (
                      <div className="text-sm text-muted-foreground" dir="rtl">
                        {quote.customer.nameAr}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{quote.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {quote.validUntil}
                      {quote.status === 'sent' && isExpiringSoon(quote.validUntil) && (
                        <Badge variant="outline" className="text-xs badge-warning">
                          Expiring soon
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(parseFloat(quote.total ?? '0'), quote.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/quotes/${quote.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        </Link>
                        {quote.status === 'draft' && (
                          <>
                            <Link href={`/quotes/${quote.id}/edit`}>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => setSendQuote(quote)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send to Customer
                            </DropdownMenuItem>
                          </>
                        )}
                        {quote.status === 'accepted' && (
                          <DropdownMenuItem onClick={() => setConvertQuote(quote)}>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Convert to Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(quote.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {quote.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteQuote(quote)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteQuote} onOpenChange={() => setDeleteQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quote &quot;{deleteQuote?.number}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuote(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <Dialog open={!!sendQuote} onOpenChange={() => setSendQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
            <DialogDescription>
              Send quote &quot;{sendQuote?.number}&quot; to {sendQuote?.customer?.name}? Once sent, the quote cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendQuote(null)}>
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

      {/* Convert to Invoice Confirmation */}
      <Dialog open={!!convertQuote} onOpenChange={() => setConvertQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              Convert quote &quot;{convertQuote?.number}&quot; to a sales invoice? The quote status will be changed to converted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertQuote(null)}>
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
