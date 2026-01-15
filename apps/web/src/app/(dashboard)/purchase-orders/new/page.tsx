'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreatePurchaseOrder } from '@/hooks/use-purchase-orders';
import { useContacts } from '@/hooks/use-contacts';
import { useProducts } from '@/hooks/use-products';
import { useCurrentExchangeRate } from '@/hooks/use-exchange-rates';
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
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Building2,
  Calendar,
  Truck,
  FileText,
  Save,
  Send,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

interface OrderItem {
  productId?: string;
  description: string;
  quantityOrdered: string;
  unitPrice: string;
  lineTotal: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const createMutation = useCreatePurchaseOrder();

  const { data: contacts } = useContacts({ type: 'supplier' });
  const { data: products } = useProducts();
  const { data: exchangeRate } = useCurrentExchangeRate();

  const [formData, setFormData] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    currency: 'USD',
    exchangeRate: exchangeRate?.rate?.toString() || '89500',
    taxAmount: '0',
    notes: '',
  });

  const [items, setItems] = useState<OrderItem[]>([
    { productId: '', description: '', quantityOrdered: '1', unitPrice: '0', lineTotal: '0' },
  ]);

  const [saveAsDraft, setSaveAsDraft] = useState(true);

  const calculateItemTotal = (item: OrderItem) => {
    const qty = parseFloat(item.quantityOrdered) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, fill in details
    if (field === 'productId' && value) {
      const product = products?.find((p) => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.costPrice?.toString() || '0';
      }
    }

    // Recalculate total
    newItems[index].lineTotal = calculateItemTotal(newItems[index]).toString();
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: '', description: '', quantityOrdered: '1', unitPrice: '0', lineTotal: '0' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const taxAmount = parseFloat(formData.taxAmount) || 0;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      supplierId: formData.supplierId || undefined,
      date: formData.date,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      status: saveAsDraft ? 'draft' : 'sent',
      currency: formData.currency as 'USD' | 'LBP',
      exchangeRate: parseFloat(formData.exchangeRate),
      taxAmount: taxAmount || undefined,
      notes: formData.notes || undefined,
      items: items.map((item) => ({
        productId: item.productId || undefined,
        description: item.description,
        quantityOrdered: parseFloat(item.quantityOrdered),
        unitPrice: parseFloat(item.unitPrice),
      })),
    });

    router.push('/purchase-orders');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-cedar/10 hover:text-cedar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cedar/10">
            <ClipboardList className="h-6 w-6 text-cedar" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cedar">
              New Purchase Order
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a new order for your supplier
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* Main Form Card */}
          <Card className="col-span-2 card-premium">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display text-lg text-cedar flex items-center gap-2">
                <FileText className="h-5 w-5 text-gold" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Supplier Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cedar font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier
                  </Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
                  >
                    <SelectTrigger className="input-warm">
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

                <div className="space-y-2">
                  <Label className="text-cedar font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Order Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-warm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cedar font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Expected Delivery Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedDeliveryDate: e.target.value })
                    }
                    className="input-warm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-cedar font-medium">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cedar font-medium">Exchange Rate (LBP per USD)</Label>
                  <Input
                    type="number"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                    className="input-warm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-cedar font-medium">Tax Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    className="input-warm font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="card-premium">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display text-lg text-cedar">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">
                  {formatMoney(subtotal, formData.currency)}
                </span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">
                    {formatMoney(taxAmount, formData.currency)}
                  </span>
                </div>
              )}

              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-cedar">Total</span>
                  <span className="text-xl font-bold text-cedar font-mono">
                    {formatMoney(total, formData.currency)}
                  </span>
                </div>
              </div>

              {formData.currency === 'USD' && (
                <div className="text-sm text-muted-foreground text-right">
                  {formatMoney(total * parseFloat(formData.exchangeRate || '0'), 'LBP')} LBP
                </div>
              )}

              <div className="border-t border-border/50 pt-4 space-y-2">
                <Button
                  type="submit"
                  className="w-full btn-cedar"
                  disabled={createMutation.isPending}
                  onClick={() => setSaveAsDraft(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Save as Draft'}
                </Button>
                <Button
                  type="submit"
                  className="w-full btn-gold"
                  disabled={createMutation.isPending}
                  onClick={() => setSaveAsDraft(false)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Save & Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Table Card */}
        <Card className="mt-6 card-premium">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg text-cedar">Order Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-warm">
              <TableHeader>
                <TableRow className="bg-cedar/5 hover:bg-cedar/5">
                  <TableHead className="w-48 text-cedar font-semibold">Product</TableHead>
                  <TableHead className="text-cedar font-semibold">Description</TableHead>
                  <TableHead className="w-24 text-cedar font-semibold">Quantity</TableHead>
                  <TableHead className="w-32 text-cedar font-semibold">Unit Price</TableHead>
                  <TableHead className="w-32 text-right text-cedar font-semibold">
                    Line Total
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-gold/5">
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => updateItem(index, 'productId', v)}
                      >
                        <SelectTrigger className="border-cedar/20 focus:border-cedar focus:ring-cedar/20">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={item.quantityOrdered}
                        onChange={(e) => updateItem(index, 'quantityOrdered', e.target.value)}
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20 font-mono"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20 font-mono"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
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
        <Card className="mt-6 card-premium">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label className="text-cedar font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for this purchase order..."
                rows={3}
                className="input-warm resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
