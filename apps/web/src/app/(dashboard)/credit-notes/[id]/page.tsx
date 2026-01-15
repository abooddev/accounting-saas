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
  ArrowDownLeft,
  FileText,
  User,
  Calendar,
  Hash,
  DollarSign,
  ClipboardList,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

// Credit Note Status Constants
const CREDIT_NOTE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'applied', label: 'Applied' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface CreditNoteItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  total: string;
  notes: string | null;
}

interface CreditNote {
  id: string;
  noteNumber: string;
  customerId: string;
  customerName: string;
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
  items: CreditNoteItem[];
}

// Mock data for demonstration
const mockCreditNote: CreditNote = {
  id: '1',
  noteNumber: 'CN-2024-0001',
  customerId: '1',
  customerName: 'ABC Trading Co.',
  invoiceId: '1',
  invoiceNumber: 'INV-2024-0001',
  date: '2024-01-15',
  status: 'issued',
  currency: 'USD',
  exchangeRate: '89500',
  subtotal: '500.00',
  discountAmount: '0.00',
  total: '500.00',
  appliedAmount: '0.00',
  balance: '500.00',
  reason: 'Returned goods - defective items',
  notes: 'Customer returned 5 units due to quality issues.',
  createdAt: '2024-01-15T10:00:00Z',
  items: [
    {
      id: '1',
      description: 'Product A - Defective Return',
      quantity: '3',
      unitPrice: '100.00',
      discountPercent: '0',
      total: '300.00',
      notes: 'Packaging damage',
    },
    {
      id: '2',
      description: 'Product B - Price Adjustment',
      quantity: '2',
      unitPrice: '100.00',
      discountPercent: '0',
      total: '200.00',
      notes: null,
    },
  ],
};

// Mock available invoices for application
const mockAvailableInvoices = [
  { id: '1', number: 'INV-2024-0001', balance: '1500.00', currency: 'USD' },
  { id: '2', number: 'INV-2024-0002', balance: '800.00', currency: 'USD' },
  { id: '3', number: 'INV-2024-0003', balance: '2000.00', currency: 'USD' },
];

export default function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const creditNote = mockCreditNote;
  const isLoading = false;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsGeneratingPDF(false);
    console.log('Download PDF for credit note:', id);
  };

  const handleIssue = async () => {
    console.log('Issue credit note:', id);
    setIssueDialog(false);
  };

  const handleCancel = async () => {
    console.log('Cancel credit note:', id);
    setCancelDialog(false);
  };

  const handleApply = async () => {
    console.log('Apply credit note:', id, 'to invoice:', selectedInvoice, 'amount:', applyAmount);
    setApplyDialog(false);
    setSelectedInvoice('');
    setApplyAmount('');
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = CREDIT_NOTE_STATUSES.find(s => s.value === status);
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
          <span className="text-warm-600">Loading credit note...</span>
        </div>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-warm-100 rounded-full">
            <ArrowDownLeft className="h-8 w-8 text-warm-400" />
          </div>
          <p className="text-warm-700 font-medium">Credit note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/credit-notes">
            <Button variant="ghost" size="icon" className="hover:bg-warm-100">
              <ArrowLeft className="h-4 w-4 text-cedar-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cedar-100 rounded-lg">
              <ArrowDownLeft className="h-6 w-6 text-cedar-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar-800">{creditNote.noteNumber}</h1>
              <p className="text-sm text-warm-600">Credit Note</p>
            </div>
          </div>
          {getStatusBadge(creditNote.status)}
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
          {creditNote.status === 'draft' && (
            <>
              <Link href={`/credit-notes/${id}?edit=true`}>
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
          {creditNote.status === 'issued' && parseFloat(creditNote.balance) > 0 && (
            <Button onClick={() => setApplyDialog(true)} className="btn-gold">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Apply to Invoice
            </Button>
          )}
          {['draft', 'issued'].includes(creditNote.status) && (
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
                  <User className="h-4 w-4" />
                  Customer
                </div>
                <p className="font-medium text-cedar-800">{creditNote.customerName}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <FileText className="h-4 w-4" />
                  Related Invoice
                </div>
                {creditNote.invoiceNumber ? (
                  <Link href={`/invoices/${creditNote.invoiceId}`} className="font-medium text-cedar-600 hover:text-cedar-700 underline">
                    {creditNote.invoiceNumber}
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
                <p className="font-medium text-cedar-800">{creditNote.date}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-warm-600">
                  <Hash className="h-4 w-4" />
                  Exchange Rate
                </div>
                <p className="font-medium text-cedar-800">{creditNote.exchangeRate} LBP/USD</p>
              </div>
              {creditNote.reason && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-warm-600">Reason</p>
                  <p className="font-medium text-cedar-800">{creditNote.reason}</p>
                </div>
              )}
              {creditNote.notes && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-warm-600">Notes</p>
                  <p className="font-medium text-cedar-800">{creditNote.notes}</p>
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
                {formatMoney(parseFloat(creditNote.subtotal), creditNote.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">Discount</span>
              <span className="font-medium text-cedar-800">
                -{formatMoney(parseFloat(creditNote.discountAmount), creditNote.currency)}
              </span>
            </div>
            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-cedar-800">Total</span>
                <span className="text-cedar-800">
                  {formatMoney(parseFloat(creditNote.total), creditNote.currency)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-600">Applied</span>
              <span className="font-medium text-sage">
                -{formatMoney(parseFloat(creditNote.appliedAmount), creditNote.currency)}
              </span>
            </div>
            <div className="border-t border-warm-200 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-cedar-800">Balance</span>
                <span className={parseFloat(creditNote.balance) > 0 ? 'text-gold-600' : 'text-sage'}>
                  {formatMoney(parseFloat(creditNote.balance), creditNote.currency)}
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
              {creditNote.items.map((item) => (
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
                    {formatMoney(parseFloat(item.unitPrice), creditNote.currency)}
                  </TableCell>
                  <TableCell className="text-right text-warm-700">{item.discountPercent}%</TableCell>
                  <TableCell className="text-right font-medium text-cedar-800">
                    {formatMoney(parseFloat(item.total), creditNote.currency)}
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
              <DialogTitle className="font-display text-xl text-cedar-800">Issue Credit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Issuing this credit note will make it available to apply against customer invoices. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIssueDialog(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button onClick={handleIssue} className="btn-cedar">
              Issue Credit Note
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
              <DialogTitle className="font-display text-xl text-cedar-800">Cancel Credit Note</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to cancel this credit note? This action will void the credit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialog(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Keep Credit Note
            </Button>
            <Button onClick={handleCancel} className="btn-gold">
              Cancel Credit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Invoice Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="border-warm-200 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cedar-100 rounded-lg">
                <ArrowDownLeft className="h-5 w-5 text-cedar-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Apply to Invoice</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Apply this credit note to an outstanding customer invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-cedar-700">Available Credit</Label>
              <p className="text-lg font-bold text-gold-600">
                {formatMoney(parseFloat(creditNote.balance), creditNote.currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Select Invoice</Label>
              <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                <SelectTrigger className="border-warm-300">
                  <SelectValue placeholder="Select an invoice" />
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
              Apply Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
