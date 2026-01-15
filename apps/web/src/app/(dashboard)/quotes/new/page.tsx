'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateQuote } from '@/hooks/use-quotes';
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
import { Plus, Trash2, ArrowLeft, FileText, User, Calendar, DollarSign } from 'lucide-react';
import { formatMoney } from '@accounting/shared';

interface QuoteItem {
  productId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  total: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const createMutation = useCreateQuote();

  const { data: contacts } = useContacts({ type: 'customer' });
  const { data: products } = useProducts();
  const { data: exchangeRate } = useCurrentExchangeRate();

  // Default valid until is 30 days from today
  const today = new Date();
  const defaultValidUntil = new Date(today);
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

  const [formData, setFormData] = useState({
    customerId: '',
    date: today.toISOString().split('T')[0],
    validUntil: defaultValidUntil.toISOString().split('T')[0],
    currency: 'USD',
    exchangeRate: exchangeRate?.rate?.toString() || '89500',
    terms: '',
    notes: '',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { productId: '', description: '', quantity: '1', unitPrice: '0', discountPercent: '0', total: '0' },
  ]);

  const calculateItemTotal = (item: QuoteItem) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    const subtotal = qty * price;
    return subtotal - (subtotal * discount / 100);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product is selected, fill in details
    if (field === 'productId' && value) {
      const product = products?.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.sellingPrice?.toString() || product.costPrice?.toString() || '0';
      }
    }

    // Recalculate total
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
  const totalDiscount = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discountPercent) || 0;
    return sum + (qty * price * discount / 100);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    const validItems = items.filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    await createMutation.mutateAsync({
      customerId: formData.customerId,
      date: formData.date,
      validUntil: formData.validUntil,
      currency: formData.currency,
      exchangeRate: parseFloat(formData.exchangeRate),
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
      items: validItems.map(item => ({
        productId: item.productId || undefined,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        discountPercent: parseFloat(item.discountPercent),
      })),
    });

    router.push('/quotes');
  };

  const selectedCustomer = contacts?.find(c => c.id === formData.customerId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/quotes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">New Quote</h1>
          <p className="text-muted-foreground">Create a new quote for your customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2 card-premium">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <FileText className="h-5 w-5 text-[hsl(var(--cedar))]" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Customer *
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                  >
                    <SelectTrigger className="input-warm">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col">
                            <span>{contact.name}</span>
                            {contact.nameAr && (
                              <span className="text-xs text-muted-foreground" dir="rtl">{contact.nameAr}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Quote Date
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
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Valid Until *
                  </Label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="input-warm"
                    required
                    min={formData.date}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exchange Rate (LBP per USD)</Label>
                <Input
                  type="number"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  className="input-warm"
                />
              </div>

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Payment terms, delivery conditions, etc."
                  className="input-warm"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="font-display">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(subtotal + totalDiscount, formData.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-[hsl(var(--sage))]">
                    -{formatMoney(totalDiscount, formData.currency)}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-[hsl(var(--cedar))]">
                      {formatMoney(subtotal, formData.currency)}
                    </span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full btn-cedar"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Quote'}
                </Button>
              </CardContent>
            </Card>

            {selectedCustomer && (
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle className="font-display text-sm">Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  {selectedCustomer.nameAr && (
                    <p className="text-sm text-muted-foreground" dir="rtl">{selectedCustomer.nameAr}</p>
                  )}
                  {selectedCustomer.email && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  )}
                  {selectedCustomer.phone && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Card className="mt-6 card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table className="table-warm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Product</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-24">Disc %</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="animate-slide-up">
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={(v) => updateItem(index, 'productId', v)}
                      >
                        <SelectTrigger className="input-warm">
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
                        className="input-warm"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="input-warm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="input-warm"
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
                        className="input-warm"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[hsl(var(--cedar))]">
                      {formatMoney(calculateItemTotal(item), formData.currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="hover:text-destructive"
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

        <Card className="mt-6 card-premium">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes for internal reference..."
                className="input-warm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
