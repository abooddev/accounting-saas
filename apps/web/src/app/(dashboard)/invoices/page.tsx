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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Filter,
  Scan,
} from 'lucide-react';
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
    const badgeClasses: Record<string, string> = {
      draft: 'bg-warm-200 text-warm-700 border-warm-300',
      pending: 'badge-warning',
      partial: 'bg-gold-100 text-gold-700 border-gold-300',
      paid: 'badge-success',
      cancelled: 'badge-danger',
      overdue: 'badge-danger',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[status] || 'bg-warm-100 text-warm-600'}`}>
        {statusInfo?.label || status}
      </span>
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
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cedar-100 rounded-lg">
            <FileText className="h-6 w-6 text-cedar-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cedar-800">Invoices</h1>
            <p className="text-sm text-warm-600">Manage purchase and expense invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/invoices/scan">
            <Button variant="outline" className="border-gold-300 text-gold-700 hover:bg-gold-50">
              <Scan className="h-4 w-4 mr-2" />
              Scan Invoice
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="btn-cedar">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gold-600" />
          <span className="text-sm font-medium text-cedar-700">Filters</span>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-500" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 border-warm-300">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-warm-300">
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
      </div>

      {/* Invoices Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-warm-100/50 border-b border-warm-200">
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold-600" />
                  Number
                </div>
              </TableHead>
              <TableHead className="text-cedar-700 font-semibold">Type</TableHead>
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gold-600" />
                  Date
                </div>
              </TableHead>
              <TableHead className="text-cedar-700 font-semibold">Due Date</TableHead>
              <TableHead className="text-right text-cedar-700 font-semibold">
                <div className="flex items-center justify-end gap-2">
                  <DollarSign className="h-4 w-4 text-gold-600" />
                  Total
                </div>
              </TableHead>
              <TableHead className="text-right text-cedar-700 font-semibold">Balance</TableHead>
              <TableHead className="text-cedar-700 font-semibold">Status</TableHead>
              <TableHead className="w-16 text-cedar-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-8 w-8 border-4 border-cedar-200 border-t-cedar-600 rounded-full"></div>
                    <span className="text-warm-600">Loading invoices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-warm-100 rounded-full">
                      <FileText className="h-8 w-8 text-warm-400" />
                    </div>
                    <div>
                      <p className="text-warm-700 font-medium">No invoices found</p>
                      <p className="text-sm text-warm-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice, index) => (
                <TableRow
                  key={invoice.id}
                  className="hover:bg-warm-50 border-b border-warm-100 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-cedar-800">{invoice.internalNumber}</div>
                      {invoice.supplierInvoiceNumber && (
                        <div className="text-sm text-warm-500">
                          Sup: {invoice.supplierInvoiceNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.type === 'purchase'
                        ? 'bg-cedar-100 text-cedar-700 border border-cedar-200'
                        : 'bg-gold-100 text-gold-700 border border-gold-200'
                    }`}>
                      {invoice.type === 'purchase' ? 'Purchase' : 'Expense'}
                    </span>
                  </TableCell>
                  <TableCell className="text-warm-700">{invoice.date}</TableCell>
                  <TableCell className="text-warm-700">{invoice.dueDate || '-'}</TableCell>
                  <TableCell className="text-right font-medium text-cedar-800">
                    {formatMoney(parseFloat(invoice.total ?? '0'), invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={parseFloat(invoice.balance ?? '0') > 0 ? 'text-terracotta-600 font-medium' : 'text-sage-600'}>
                      {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-warm-100">
                          <MoreHorizontal className="h-4 w-4 text-warm-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-warm-200">
                        <Link href={`/invoices/${invoice.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2 text-cedar-600" />
                            <span className="text-cedar-700">View</span>
                          </DropdownMenuItem>
                        </Link>
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem onClick={() => setConfirmInvoice(invoice)} className="cursor-pointer">
                            <CheckCircle className="h-4 w-4 mr-2 text-sage-600" />
                            <span className="text-sage-700">Confirm</span>
                          </DropdownMenuItem>
                        )}
                        {['draft', 'pending', 'partial'].includes(invoice.status) && (
                          <DropdownMenuItem onClick={() => setCancelInvoice(invoice)} className="cursor-pointer">
                            <XCircle className="h-4 w-4 mr-2 text-gold-600" />
                            <span className="text-gold-700">Cancel</span>
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'draft' && (
                          <DropdownMenuItem
                            className="cursor-pointer text-terracotta-600 focus:text-terracotta-700 focus:bg-terracotta-50"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-terracotta-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-terracotta-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Delete Invoice</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to delete invoice &quot;{deleteInvoice?.internalNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteInvoice(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmInvoice} onOpenChange={() => setConfirmInvoice(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sage-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-sage-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Confirm Invoice</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Confirming this invoice will update supplier balances and product stock. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmInvoice(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={confirmMutation.isPending} className="btn-cedar">
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelInvoice} onOpenChange={() => setCancelInvoice(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold-100 rounded-lg">
                <XCircle className="h-5 w-5 text-gold-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Cancel Invoice</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Cancelling this invoice will reverse supplier balances and product stock changes. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelInvoice(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Keep Invoice
            </Button>
            <Button onClick={handleCancel} disabled={cancelMutation.isPending} className="btn-gold">
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
