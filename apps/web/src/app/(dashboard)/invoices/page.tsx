'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInvoices, useDeleteInvoice, useConfirmInvoice, useCancelInvoice } from '@/hooks/use-invoices';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MoreHorizontal, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatMoney, INVOICE_STATUSES } from '@accounting/shared';
import type { Invoice } from '@accounting/shared';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useInvoices({
    type: typeFilter === 'all' ? undefined : typeFilter as 'purchase' | 'expense',
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  const deleteMutation = useDeleteInvoice();
  const confirmMutation = useConfirmInvoice();
  const cancelMutation = useCancelInvoice();

  const handleDelete = async () => {
    if (deleteInvoice) {
      await deleteMutation.mutateAsync(deleteInvoice.id);
      setDeleteInvoice(null);
    }
  };

  const handleConfirm = async () => {
    if (confirmInvoice) {
      await confirmMutation.mutateAsync(confirmInvoice.id);
      setConfirmInvoice(null);
    }
  };

  const handleCancel = async () => {
    if (cancelInvoice) {
      await cancelMutation.mutateAsync(cancelInvoice.id);
      setCancelInvoice(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = INVOICE_STATUSES.find(s => s.value === status);
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      pending: 'default',
      partial: 'outline',
      paid: 'default',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const filteredInvoices = invoices?.filter(invoice => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      invoice.internalNumber?.toLowerCase().includes(searchLower) ||
      invoice.supplierInvoiceNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {INVOICE_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.internalNumber}</div>
                      {invoice.supplierInvoiceNumber && (
                        <div className="text-sm text-muted-foreground">
                          Sup: {invoice.supplierInvoiceNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invoice.type === 'purchase' ? 'Purchase' : 'Expense'}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate || '-'}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(parseFloat(invoice.total ?? '0'), invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/invoices/${invoice.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                        </Link>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => setConfirmInvoice(invoice)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </DropdownMenuItem>
                        )}
                        {['draft', 'pending', 'partial'].includes(invoice.status) && (
                          <DropdownMenuItem onClick={() => setCancelInvoice(invoice)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteInvoice(invoice)}
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
      <Dialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice &quot;{deleteInvoice?.internalNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteInvoice(null)}>
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

      {/* Confirm Dialog */}
      <Dialog open={!!confirmInvoice} onOpenChange={() => setConfirmInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Invoice</DialogTitle>
            <DialogDescription>
              Confirming this invoice will update supplier balances and product stock. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmInvoice(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelInvoice} onOpenChange={() => setCancelInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invoice</DialogTitle>
            <DialogDescription>
              Cancelling this invoice will reverse supplier balances and product stock changes. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelInvoice(null)}>
              Keep Invoice
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
