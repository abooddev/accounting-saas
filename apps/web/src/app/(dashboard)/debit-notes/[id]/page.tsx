'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Loader2,
  ArrowUpRight,
  FileText,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  ClipboardList,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

// Debit Note Status Constants
const DEBIT_NOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'applied', label: 'Applied' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface DebitNoteItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  total: string;
  notes: string | null;
}

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
  exchangeRate: string;
  subtotal: string;
  discountAmount: string;
  total: string;
  appliedAmount: string;
  balance: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  items: DebitNoteItem[];
}

// Mock data for demonstration
const mockDebitNote: DebitNote = {
  id: '1',
  noteNumber: 'DN-2024-0001',
  supplierId: '1',
  supplierName: 'Global Suppliers Inc.',
  invoiceId: '1',
  invoiceNumber: 'SUP-INV-2024-0001',
  date: '2024-01-15',
  status: 'issued',
  currency: 'USD',
  exchangeRate: '89500',
  subtotal: '750.00',
  discountAmount: '0.00',
  total: '750.00',
  appliedAmount: '0.00',
  balance: '750.00',
  reason: 'Returned defective materials',
  notes: 'Materials did not meet quality specifications. Returning to supplier for credit.',
  createdAt: '2024-01-15T10:00:00Z',
  items: [
    {
      id: '1',
      description: 'Raw Material A - Defective Batch',
      quantity: '5',
      unitPrice: '100.00',
      discountPercent: '0',
      total: '500.00',
      notes: 'Quality test failed',
    },
    {
      id: '2',
      description: 'Component B - Wrong Specifications',
      quantity: '10',
      unitPrice: '25.00',
      discountPercent: '0',
      total: '250.00',
      notes: null,
    },
  ],
};

// Mock available supplier invoices (bills) for application
const mockAvailableInvoices = [
  { id: '1', number: 'SUP-INV-2024-0001', balance: '2500.00', currency: 'USD' },
  { id: '2', number: 'SUP-INV-2024-0002', balance: '1200.00', currency: 'USD' },
  { id: '3', number: 'SUP-INV-2024-0003', balance: '3000.00', currency: 'USD' },
];

export default function DebitNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showApplyDialog = searchParams.get('apply') === 'true';

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [applyDialog, setApplyDialog] = useState(showApplyDialog);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [applyAmount, setApplyAmount] = useState('');

  // Replace with actual hook
  const debitNote = mockDebitNote;
  const isLoading = false;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsGeneratingPDF(false);
    console.log('Download PDF for debit note:', id);
  };

  const handleIssue = async () => {
    console.log('Issue debit note:', id);
    setIssueDialog(false);
  };

  const handleCancel = async () => {
    console.log('Cancel debit note:', id);
    setCancelDialog(false);
  };

  const handleApply = async () => {
    console.log('Apply debit note:', id, 'to supplier invoice:', selectedInvoice, 'amount:', applyAmount);
    setApplyDialog(false);
    setSelectedInvoice('');
    setApplyAmount('');
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badgeClasses[status] || 'bg-warm-100 text-warm-600'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-cedar-200 border-t-cedar-600 rounded-full"></div>
          <span className="text-warm-600">Loading debit note...</span>
        </div>
      </div>
    );
  }

  if (!debitNote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-warm-100 rounded-full">
            <ArrowUpRight className="h-8 w-8 text-warm-400" />
          </div>
          <p className="text-warm-700 font-medium">Debit note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/debit-notes">
            <Button variant="ghost" size="icon" className="hover:bg-warm-100">
              <ArrowLeft className="h-4 w-4 text-cedar-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cedar-100 rounded-lg">
              <ArrowUpRight className="h-6 w-6 text-cedar-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar-800">{debitNote.noteNumber}</h1>
              <p className="text-sm text-warm-600">Debit Note</p>
            </div>
          </div>
          {getStatusBadge(debitNote.status)}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="border-warm-300 text-warm-700 hover:bg-warm-50"
          >
            {isGeneratingPDF ? (
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
          {debitNote.status === 'draft' && (
            <>
              <Link href={`/debit-notes/${id}?edit=true`}>
                <Button variant="outline" className="border-warm-300 text-warm-700 hover:bg-warm-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setIssueDialog(true)} className="btn-cedar">
                <CheckCircle className="h-4 w-4 mr-2" />
                Issue
              </Button>
            </>
          )}
          {debitNote.status === 'issued' && parseFloat(debitNote.balance) > 0 && (
            <Button onClick={() => setApplyDialog(true)} className="btn-gold">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Apply to Invoice
            </Button>
          )}
          {['draft', 'issued'].includes(debitNote.status) && (
            <Button
              variant="outline"
              onClick={() => setCancelDialog(true)}
              className="border-warm-300 text-warm-700 hover:bg-warm-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="card-premium col-span-2">
          <CardHeader className="border-b border-warm-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gold-600" />
              <CardTitle className="font-display text-lg text-cedar-800">Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <Building2 className="h-4 w-4" />
                  Supplier
                </div>
                <p className="font-medium text-cedar-800">{debitNote.supplierName}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <FileText className="h-4 w-4" />
                  Related Invoice
                </div>
                {debitNote.invoiceNumber ? (
                  <Link href={`/bills/${debitNote.invoiceId}`} className="font-medium text-cedar-600 hover:text-cedar-700 underline">
                    {debitNote.invoiceNumber}
                  </Link>
                ) : (
                  <p className="font-medium text-warm-400">-</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
                <p className="font-medium text-cedar-800">{debitNote.date}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <Hash className="h-4 w-4" />
                  Exchange Rate
                </div>
                <p className="font-medium text-cedar-800">{debitNote.exchangeRate} LBP/USD</p>
              </div>
              {debitNote.reason && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-warm-600">Reason</p>
                  <p className="font-medium text-cedar-800">{debitNote.reason}</p>
                </div>
              )}
              {debitNote.notes && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-warm-600">Notes</p>
                  <p className="font-medium text-cedar-800">{debitNote.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="card-premium">
          <CardHeader className="border-b border-warm-100">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold-600" />
              <CardTitle className="font-display text-lg text-cedar-800">Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-warm-600">Subtotal</span>
              <span className="font-medium text-cedar-800">
                {formatMoney(parseFloat(debitNote.subtotal), debitNote.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">Discount</span>
              <span className="font-medium text-cedar-800">
                -{formatMoney(parseFloat(debitNote.discountAmount), debitNote.currency)}
              </span>
            </div>
            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-cedar-800">Total</span>
                <span className="text-cedar-800">
                  {formatMoney(parseFloat(debitNote.total), debitNote.currency)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">Applied</span>
              <span className="font-medium text-sage">
                -{formatMoney(parseFloat(debitNote.appliedAmount), debitNote.currency)}
              </span>
            </div>
            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-cedar-800">Balance</span>
                <span className={parseFloat(debitNote.balance) > 0 ? 'text-gold-600' : 'text-sage'}>
                  {formatMoney(parseFloat(debitNote.balance), debitNote.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Card */}
      <Card className="card-premium overflow-hidden">
        <CardHeader className="border-b border-warm-100">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold-600" />
            <CardTitle className="font-display text-lg text-cedar-800">Line Items</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-warm">
            <TableHeader>
              <TableRow className="bg-warm-100/50 border-b border-warm-200">
                <TableHead className="text-cedar-700 font-semibold">Description</TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">Quantity</TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">Unit Price</TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">Discount</TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debitNote.items.map((item) => (
                <TableRow key={item.id} className="hover:bg-warm-50 border-b border-warm-100">
                  <TableCell>
                    <div>
                      <div className="font-medium text-cedar-800">{item.description}</div>
                      {item.notes && (
                        <div className="text-sm text-warm-500">{item.notes}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-warm-700">{item.quantity}</TableCell>
                  <TableCell className="text-right text-warm-700">
                    {formatMoney(parseFloat(item.unitPrice), debitNote.currency)}
                  </TableCell>
                  <TableCell className="text-right text-warm-700">{item.discountPercent}%</TableCell>
                  <TableCell className="text-right font-medium text-cedar-800">
                    {formatMoney(parseFloat(item.total), debitNote.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Issue Dialog */}
      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
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
            <Button variant="outline" onClick={() => setIssueDialog(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button onClick={handleIssue} className="btn-cedar">
              Issue Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold-100 rounded-lg">
                <XCircle className="h-5 w-5 text-gold-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Cancel Debit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to cancel this debit note? This action will void the debit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialog(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Keep Debit Note
            </Button>
            <Button onClick={handleCancel} className="btn-gold">
              Cancel Debit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Supplier Invoice Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="border-warm-200 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cedar-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-cedar-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Apply to Supplier Invoice</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Apply this debit note to an outstanding supplier invoice (bill).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-cedar-700">Available Credit</Label>
              <p className="text-lg font-bold text-gold-600">
                {formatMoney(parseFloat(debitNote.balance), debitNote.currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Select Supplier Invoice</Label>
              <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                <SelectTrigger className="border-warm-300">
                  <SelectValue placeholder="Select a supplier invoice" />
                </SelectTrigger>
                <SelectContent>
                  {mockAvailableInvoices.map(invoice => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.number} - Balance: {formatMoney(parseFloat(invoice.balance), invoice.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Amount to Apply</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={applyAmount}
                onChange={(e) => setApplyAmount(e.target.value)}
                className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApplyDialog(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedInvoice || !applyAmount || parseFloat(applyAmount) <= 0}
              className="btn-cedar"
            >
              Apply Debit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
