'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateSalesOrder } from '@/hooks/use-sales-orders';
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
  Plus,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  User,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

interface SalesOrderItem {
  productId: string;
  description: string;
  quantityOrdered: string;
  unitPrice: string;
  discountPercent: string;
  lineTotal: string;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const createMutation = useCreateSalesOrder();

  const { data: contacts } = useContacts({ type: 'customer' });
  const { data: products } = useProducts();
  const { data: exchangeRate } = useCurrentExchangeRate();

  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    currency: 'USD',
    exchangeRate: '89500',
    notes: '',
  });

  const [items, setItems] = useState<SalesOrderItem[]>([
    { productId: '', description: '', quantityOrdered: '1', unitPrice: '0', discountPercent: '0', lineTotal: '0' },
  ]);

  // Update exchange rate when loaded
  useEffect(() => {
    if (exchangeRate?.rate) {
      setFormData(prev => ({ ...prev, exchangeRate: exchangeRate.rate.toString() }));
    }
  }, [exchangeRate]);

  const calculateItemTotal = (item: SalesOrderItem) => {
    const qty = parseFloat(item.quantityOrdered) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    const subtotal = qty * price;
    return subtotal - (subtotal * discount / 100);
  };

  const updateItem = (index: number, field: keyof SalesOrderItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, fill in details
    if (field === 'productId' && value) {
      const product = products?.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.sellingPrice?.toString() || '0';
      }
    }

    // Recalculate total
    newItems[index].lineTotal = calculateItemTotal(newItems[index]).toString();
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: '', description: '', quantityOrdered: '1', unitPrice: '0', discountPercent: '0', lineTotal: '0' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantityOrdered) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    return sum + (qty * price * discount / 100);
  }, 0);
  const total = subtotal;

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = true) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (items.every(item => !item.productId && !item.description)) {
      alert('Please add at least one item');
      return;
    }

    const validItems = items.filter(item => item.productId || item.description);

    await createMutation.mutateAsync({
      customerId: formData.customerId,
      date: formData.date,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      status: saveAsDraft ? 'draft' : 'confirmed',
      currency: formData.currency as 'USD' | 'LBP',
      exchangeRate: parseFloat(formData.exchangeRate),
      notes: formData.notes || undefined,
      items: validItems.map(item => ({
        productId: item.productId,
        description: item.description,
        quantityOrdered: parseFloat(item.quantityOrdered),
        unitPrice: parseFloat(item.unitPrice),
        discountPercent: parseFloat(item.discountPercent),
      })),
    });

    router.push('/sales-orders');
  };

  const customers = contacts?.filter(c => c.type === 'customer' || c.type === 'both') || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/sales-orders">
          <Button variant="ghost" size="icon" className="hover:bg-cedar/10 hover:text-cedar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cedar/10">
            <ShoppingCart className="h-6 w-6 text-cedar" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cedar">New Sales Order</h1>
            <p className="text-sm text-muted-foreground">Create a new customer order</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, true)}>
        <div className="grid grid-cols-3 gap-6">
          {/* Main Form Card */}
          <Card className="card-premium col-span-2">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display text-lg text-cedar flex items-center gap-2">
                <Package className="h-5 w-5 text-gold" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-cedar">
                  <User className="h-4 w-4" />
                  Customer *
                </Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                >
                  <SelectTrigger className="input-warm">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex items-center gap-2">
                          <span>{customer.name}</span>
                          {customer.nameAr && (
                            <span className="text-muted-foreground text-sm" dir="rtl">
                              ({customer.nameAr})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar">
                    <Calendar className="h-4 w-4" />
                    Order Date *
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-warm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar">
                    <Calendar className="h-4 w-4" />
                    Expected Delivery Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="input-warm"
                  />
                </div>
              </div>

              {/* Currency Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-cedar">
                    <DollarSign className="h-4 w-4" />
                    Currency
                  </Label>
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
                <div className="space-y-2">
                  <Label className="text-cedar">Exchange Rate (LBP per USD)</Label>
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
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-display text-lg text-cedar">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (before discount)</span>
                <span className="font-mono">
                  {formatMoney(subtotal + totalDiscount, formData.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Discount</span>
                <span className="font-mono text-terracotta">
                  -{formatMoney(totalDiscount, formData.currency)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-cedar">Total</span>
                  <span className="font-mono text-cedar">{formatMoney(total, formData.currency)}</span>
                </div>
              </div>
              {formData.currency === 'USD' && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total (LBP)</span>
                  <span className="font-mono">
                    {formatMoney(total * parseFloat(formData.exchangeRate || '0'), 'LBP')}
                  </span>
                </div>
              )}
              <div className="pt-4 space-y-2">
                <Button
                  type="submit"
                  className="w-full btn-cedar"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Save as Draft'}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  className="w-full btn-gold"
                  disabled={createMutation.isPending}
                >
                  Save & Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items Card */}
        <Card className="card-premium mt-6">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg text-cedar flex items-center gap-2">
              <Package className="h-5 w-5 text-gold" />
              Line Items
            </CardTitle>
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
                  <TableHead className="w-24 text-cedar font-semibold">Qty</TableHead>
                  <TableHead className="w-32 text-cedar font-semibold">Unit Price</TableHead>
                  <TableHead className="w-24 text-cedar font-semibold">Disc %</TableHead>
                  <TableHead className="w-32 text-right text-cedar font-semibold">Total</TableHead>
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
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(product => (
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
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(index, 'discountPercent', e.target.value)}
                        className="border-cedar/20 focus:border-cedar focus:ring-cedar/20"
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-cedar">
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
              <Label className="text-cedar">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or special instructions for this order..."
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
