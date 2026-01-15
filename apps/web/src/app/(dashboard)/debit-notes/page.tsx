'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Filter,
  ReceiptText,
  ArrowUpRight,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

// Debit Note Status Constants
const DEBIT_NOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'applied', label: 'Applied' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Mock data for demonstration - replace with actual API hooks
interface DebitNote {
  id: string;
  noteNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  date: string;
  status: 'draft' | 'issued' | 'applied' | 'cancelled';
  currency: string;
  subtotal: string;
  total: string;
  appliedAmount: string;
  balance: string;
  reason: string | null;
  createdAt: string;
}

// Mock data
const mockDebitNotes: DebitNote[] = [
  {
    id: '1',
    noteNumber: 'DN-2024-0001',
    supplierId: '1',
    supplierName: 'Global Suppliers Inc.',
    invoiceId: '1',
    invoiceNumber: 'SUP-INV-2024-0001',
    date: '2024-01-15',
    status: 'issued',
    currency: 'USD',
    subtotal: '750.00',
    total: '750.00',
    appliedAmount: '0.00',
    balance: '750.00',
    reason: 'Returned defective materials',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    noteNumber: 'DN-2024-0002',
    supplierId: '2',
    supplierName: 'Premium Parts Ltd.',
    invoiceId: '2',
    invoiceNumber: 'SUP-INV-2024-0002',
    date: '2024-01-18',
    status: 'applied',
    currency: 'USD',
    subtotal: '320.00',
    total: '320.00',
    appliedAmount: '320.00',
    balance: '0.00',
    reason: 'Price difference correction',
    createdAt: '2024-01-18T14:30:00Z',
  },
  {
    id: '3',
    noteNumber: 'DN-2024-0003',
    supplierId: '3',
    supplierName: 'Lebanese Materials Co.',
    invoiceId: null,
    invoiceNumber: null,
    date: '2024-01-20',
    status: 'draft',
    currency: 'LBP',
    subtotal: '22500000',
    total: '22500000',
    appliedAmount: '0',
    balance: '22500000',
    reason: 'Overcharge on previous order',
    createdAt: '2024-01-20T09:15:00Z',
  },
];

export default function DebitNotesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDebitNote, setDeleteDebitNote] = useState<DebitNote | null>(null);
  const [issueDebitNote, setIssueDebitNote] = useState<DebitNote | null>(null);
  const [cancelDebitNote, setCancelDebitNote] = useState<DebitNote | null>(null);

  // Replace with actual hooks
  const debitNotes = mockDebitNotes;
  const isLoading = false;

  const handleDelete = async () => {
    if (deleteDebitNote) {
      // await deleteMutation.mutateAsync(deleteDebitNote.id);
      console.log('Delete debit note:', deleteDebitNote.id);
      setDeleteDebitNote(null);
    }
  };

  const handleIssue = async () => {
    if (issueDebitNote) {
      // await issueMutation.mutateAsync(issueDebitNote.id);
      console.log('Issue debit note:', issueDebitNote.id);
      setIssueDebitNote(null);
    }
  };

  const handleCancel = async () => {
    if (cancelDebitNote) {
      // await cancelMutation.mutateAsync(cancelDebitNote.id);
      console.log('Cancel debit note:', cancelDebitNote.id);
      setCancelDebitNote(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = DEBIT_NOTE_STATUSES.find(s => s.value === status);
    const badgeClasses: Record<string, string> = {
      draft: 'bg-warm-200 text-warm-700 border-warm-300',
      issued: 'bg-gold-100 text-gold-700 border-gold-300',
      applied: 'badge-success',
      cancelled: 'badge-danger',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[status] || 'bg-warm-100 text-warm-600'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const filteredDebitNotes = debitNotes?.filter(note => {
    if (statusFilter !== 'all' && note.status !== statusFilter) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      note.noteNumber?.toLowerCase().includes(searchLower) ||
      note.supplierName?.toLowerCase().includes(searchLower) ||
      note.invoiceNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cedar-100 rounded-lg">
            <ArrowUpRight className="h-6 w-6 text-cedar-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cedar-800">Debit Notes</h1>
            <p className="text-sm text-warm-600">Manage supplier debit notes and adjustments</p>
          </div>
        </div>
        <Link href="/debit-notes/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            New Debit Note
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warm-100 rounded-lg">
              <FileText className="h-5 w-5 text-warm-600" />
            </div>
            <div>
              <p className="text-sm text-warm-600">Draft</p>
              <p className="text-xl font-display font-bold text-cedar-800">
                {debitNotes.filter(n => n.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-100 rounded-lg">
              <ReceiptText className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <p className="text-sm text-warm-600">Issued</p>
              <p className="text-xl font-display font-bold text-cedar-800">
                {debitNotes.filter(n => n.status === 'issued').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sage/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-sage" />
            </div>
            <div>
              <p className="text-sm text-warm-600">Applied</p>
              <p className="text-xl font-display font-bold text-cedar-800">
                {debitNotes.filter(n => n.status === 'applied').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terracotta/10 rounded-lg">
              <XCircle className="h-5 w-5 text-terracotta" />
            </div>
            <div>
              <p className="text-sm text-warm-600">Cancelled</p>
              <p className="text-xl font-display font-bold text-cedar-800">
                {debitNotes.filter(n => n.status === 'cancelled').length}
              </p>
            </div>
          </div>
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
              placeholder="Search debit notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 border-warm-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {DEBIT_NOTE_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debit Notes Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-warm-100/50 border-b border-warm-200">
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold-600" />
                  Note Number
                </div>
              </TableHead>
              <TableHead className="text-cedar-700 font-semibold">Supplier</TableHead>
              <TableHead className="text-cedar-700 font-semibold">Related Invoice</TableHead>
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gold-600" />
                  Date
                </div>
              </TableHead>
              <TableHead className="text-right text-cedar-700 font-semibold">
                <div className="flex items-center justify-end gap-2">
                  <DollarSign className="h-4 w-4 text-gold-600" />
                  Amount
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
                    <span className="text-warm-600">Loading debit notes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDebitNotes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-warm-100 rounded-full">
                      <ArrowUpRight className="h-8 w-8 text-warm-400" />
                    </div>
                    <div>
                      <p className="text-warm-700 font-medium">No debit notes found</p>
                      <p className="text-sm text-warm-500">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDebitNotes?.map((note, index) => (
                <TableRow
                  key={note.id}
                  className="hover:bg-warm-50 border-b border-warm-100 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="font-medium text-cedar-800">{note.noteNumber}</div>
                  </TableCell>
                  <TableCell className="text-warm-700">{note.supplierName}</TableCell>
                  <TableCell>
                    {note.invoiceNumber ? (
                      <Link href={`/invoices/${note.invoiceId}`} className="text-cedar-600 hover:text-cedar-700 underline">
                        {note.invoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-warm-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-warm-700">{note.date}</TableCell>
                  <TableCell className="text-right font-medium text-cedar-800">
                    {formatMoney(parseFloat(note.total), note.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={parseFloat(note.balance) > 0 ? 'text-gold-600 font-medium' : 'text-sage'}>
                      {formatMoney(parseFloat(note.balance), note.currency)}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(note.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-warm-100">
                          <MoreHorizontal className="h-4 w-4 text-warm-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-warm-200">
                        <Link href={`/debit-notes/${note.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2 text-cedar-600" />
                            <span className="text-cedar-700">View</span>
                          </DropdownMenuItem>
                        </Link>
                        {note.status === 'draft' && (
                          <>
                            <Link href={`/debit-notes/${note.id}?edit=true`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2 text-cedar-600" />
                                <span className="text-cedar-700">Edit</span>
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => setIssueDebitNote(note)} className="cursor-pointer">
                              <CheckCircle className="h-4 w-4 mr-2 text-sage" />
                              <span className="text-sage">Issue</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {note.status === 'issued' && (
                          <Link href={`/debit-notes/${note.id}?apply=true`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <ArrowUpRight className="h-4 w-4 mr-2 text-gold-600" />
                              <span className="text-gold-700">Apply to Invoice</span>
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {['draft', 'issued'].includes(note.status) && (
                          <DropdownMenuItem onClick={() => setCancelDebitNote(note)} className="cursor-pointer">
                            <XCircle className="h-4 w-4 mr-2 text-gold-600" />
                            <span className="text-gold-700">Cancel</span>
                          </DropdownMenuItem>
                        )}
                        {note.status === 'draft' && (
                          <DropdownMenuItem
                            className="cursor-pointer text-terracotta focus:text-terracotta focus:bg-terracotta/10"
                            onClick={() => setDeleteDebitNote(note)}
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
      <Dialog open={!!deleteDebitNote} onOpenChange={() => setDeleteDebitNote(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-terracotta/10 rounded-lg">
                <Trash2 className="h-5 w-5 text-terracotta" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Delete Debit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to delete debit note &quot;{deleteDebitNote?.noteNumber}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDebitNote(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              Delete Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={!!issueDebitNote} onOpenChange={() => setIssueDebitNote(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sage/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-sage" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Issue Debit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Issuing this debit note will make it available to apply against supplier invoices. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIssueDebitNote(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button onClick={handleIssue} className="btn-cedar">
              Issue Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDebitNote} onOpenChange={() => setCancelDebitNote(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold-100 rounded-lg">
                <XCircle className="h-5 w-5 text-gold-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Cancel Debit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to cancel debit note &quot;{cancelDebitNote?.noteNumber}&quot;? This action will void the debit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDebitNote(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Keep Debit Note
            </Button>
            <Button onClick={handleCancel} className="btn-gold">
              Cancel Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
