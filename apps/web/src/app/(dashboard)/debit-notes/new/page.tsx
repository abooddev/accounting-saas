'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  Trash2,
  ArrowLeft,
  ArrowUpRight,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

// Mock data for suppliers
const mockSuppliers = [
  { id: '1', name: 'Global Suppliers Inc.' },
  { id: '2', name: 'Premium Parts Ltd.' },
  { id: '3', name: 'Lebanese Materials Co.' },
];

// Mock data for supplier invoices (bills)
const mockSupplierInvoices = [
  { id: '1', number: 'SUP-INV-2024-0001', total: '3500.00', balance: '2500.00', currency: 'USD', supplierId: '1' },
  { id: '2', number: 'SUP-INV-2024-0002', total: '1800.00', balance: '1200.00', currency: 'USD', supplierId: '2' },
  { id: '3', number: 'SUP-INV-2024-0003', total: '75000000', balance: '75000000', currency: 'LBP', supplierId: '3' },
];

// Debit note reason options (supplier-focused)
const DEBIT_NOTE_REASONS = [
  { value: 'returned_goods', label: 'Returned Goods to Supplier' },
  { value: 'price_adjustment', label: 'Price Adjustment' },
  { value: 'damaged_goods', label: 'Damaged Goods Received' },
  { value: 'billing_error', label: 'Billing Error by Supplier' },
  { value: 'quantity_shortage', label: 'Quantity Shortage' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other' },
];

interface DebitNoteItem {
  productId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  total: string;
}

export default function NewDebitNotePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceId: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    exchangeRate: '89500',
    reason: '',
    notes: '',
  });

  const [items, setItems] = useState<DebitNoteItem[]>([
    { productId: '', description: '', quantity: '1', unitPrice: '0', discountPercent: '0', total: '0' },
  ]);

  // Filter invoices by selected supplier
  const supplierInvoices = formData.supplierId
    ? mockSupplierInvoices.filter(inv => inv.supplierId === formData.supplierId)
    : [];

  const calculateItemTotal = (item: DebitNoteItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    const subtotal = qty * price;
    return subtotal - (subtotal * discount / 100);
  };

  const updateItem = (index: number, field: keyof DebitNoteItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = calculateItemTotal(newItems[index]).toString();
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: '', description: '', quantity: '1', unitPrice: '0', discountPercent: '0', total: '0' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to create debit note
      // Note: Uses the same /credit-notes endpoint with type: 'debit'
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'debit',
          contactType: 'supplier',
          contactId: formData.supplierId,
          invoiceId: formData.invoiceId || null,
          date: formData.date,
          currency: formData.currency,
          exchangeRate: parseFloat(formData.exchangeRate),
          reason: formData.reason,
          notes: formData.notes,
          items: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            discountPercent: parseFloat(item.discountPercent),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create debit note');
      }

      router.push('/debit-notes');
    } catch (error) {
      console.error('Error creating debit note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // When supplier changes, reset invoice selection
  const handleSupplierChange = (value: string) => {
    setFormData({ ...formData, supplierId: value, invoiceId: '' });
  };

  // When invoice is selected, auto-fill currency
  const handleInvoiceChange = (value: string) => {
    const invoice = mockSupplierInvoices.find(inv => inv.id === value);
    if (invoice) {
      setFormData({
        ...formData,
        invoiceId: value,
        currency: invoice.currency,
      });
    } else {
      setFormData({ ...formData, invoiceId: value });
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
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
            <h1 className="font-display text-2xl font-bold text-cedar-800">New Debit Note</h1>
            <p className="text-sm text-warm-600">Create a debit note for a supplier</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* Main Form Card */}
          <Card className="card-premium col-span-2">
            <CardHeader className="border-b border-warm-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gold-600" />
                <CardTitle className="font-display text-lg text-cedar-800">Debit Note Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar-700">
                    <Building2 className="h-4 w-4 text-gold-600" />
                    Supplier
                  </Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={handleSupplierChange}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSuppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar-700">
                    <FileText className="h-4 w-4 text-gold-600" />
                    Related Invoice (Optional)
                  </Label>
                  <Select
                    value={formData.invoiceId}
                    onValueChange={handleInvoiceChange}
                    disabled={!formData.supplierId}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue placeholder={formData.supplierId ? "Select invoice" : "Select supplier first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierInvoices.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.number} - {formatMoney(parseFloat(invoice.balance), invoice.currency)} balance
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar-700">
                    <Calendar className="h-4 w-4 text-gold-600" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="input-warm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-cedar-700">Reason</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(v) => setFormData({ ...formData, reason: v })}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEBIT_NOTE_REASONS.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cedar-700">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="LBP">LBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cedar-700">Exchange Rate (LBP per USD)</Label>
                  <Input
                    type="number"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                    className="input-warm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="card-premium h-fit">
            <CardHeader className="border-b border-warm-100">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold-600" />
                <CardTitle className="font-display text-lg text-cedar-800">Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-lg">
                <span className="text-warm-600">Subtotal</span>
                <span className="font-bold text-cedar-800">{formatMoney(subtotal, formData.currency)}</span>
              </div>
              <div className="border-t border-warm-200 pt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span className="text-cedar-800">Total</span>
                  <span className="text-gold-600">{formatMoney(subtotal, formData.currency)}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="btn-cedar w-full mt-4"
                disabled={isSubmitting || !formData.supplierId}
              >
                {isSubmitting ? 'Creating...' : 'Create Debit Note'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Line Items Card */}
        <Card className="card-premium mt-6">
          <CardHeader className="border-b border-warm-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold-600" />
              <CardTitle className="font-display text-lg text-cedar-800">Line Items</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-warm-300 text-cedar-700 hover:bg-warm-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-warm">
              <TableHeader>
                <TableRow className="bg-warm-100/50 border-b border-warm-200">
                  <TableHead className="text-cedar-700 font-semibold">Description</TableHead>
                  <TableHead className="w-24 text-cedar-700 font-semibold">Qty</TableHead>
                  <TableHead className="w-32 text-cedar-700 font-semibold">Unit Price</TableHead>
                  <TableHead className="w-24 text-cedar-700 font-semibold">Disc %</TableHead>
                  <TableHead className="w-32 text-right text-cedar-700 font-semibold">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="border-b border-warm-100">
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        required
                        className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                        className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium text-cedar-800">
                      {formatMoney(calculateItemTotal(item), formData.currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="hover:bg-terracotta/10 hover:text-terracotta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="card-premium mt-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-cedar-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for this debit note..."
                rows={3}
                className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
