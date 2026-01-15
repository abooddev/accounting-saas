'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreatePriceList, usePriceList, useAddPriceListItems } from '@/hooks/use-price-lists';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Save,
  Tag,
  Package,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CreatePriceListInput, AddPriceListItemInput } from '@/lib/api/price-lists';

interface PriceItem {
  productId: string;
  productName: string;
  price: string;
  minQuantity: string;
}

export default function NewPriceListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');

  const { data: duplicateFrom, isLoading: isDuplicateLoading } = usePriceList(duplicateId || '');
  const { data: products } = useProducts();
  const createPriceList = useCreatePriceList();
  const addItems = useAddPriceListItems();

  const [form, setForm] = useState<CreatePriceListInput>({
    name: '',
    nameAr: '',
    currency: 'USD',
    isDefault: false,
    isActive: true,
  });

  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newMinQty, setNewMinQty] = useState<string>('1');

  // Load data from duplicate if provided
  useEffect(() => {
    if (duplicateFrom && !isDuplicateLoading) {
      setForm({
        name: `${duplicateFrom.name} (Copy)`,
        nameAr: duplicateFrom.nameAr ? `${duplicateFrom.nameAr} (نسخة)` : '',
        currency: duplicateFrom.currency,
        isDefault: false, // Never duplicate as default
        isActive: true,
      });

      setPriceItems(
        duplicateFrom.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          price: item.price,
          minQuantity: item.minQuantity.toString(),
        }))
      );
    }
  }, [duplicateFrom, isDuplicateLoading]);

  const handleAddItem = () => {
    if (!selectedProduct || !newPrice) return;

    const product = products?.find((p) => p.id === selectedProduct);
    if (!product) return;

    // Check if already added
    if (priceItems.some((item) => item.productId === selectedProduct)) {
      return;
    }

    setPriceItems([
      ...priceItems,
      {
        productId: selectedProduct,
        productName: product.name,
        price: newPrice,
        minQuantity: newMinQty || '1',
      },
    ]);

    setSelectedProduct('');
    setNewPrice('');
    setNewMinQty('1');
  };

  const handleRemoveItem = (productId: string) => {
    setPriceItems(priceItems.filter((item) => item.productId !== productId));
  };

  const handleUpdateItemPrice = (productId: string, price: string) => {
    setPriceItems(
      priceItems.map((item) =>
        item.productId === productId ? { ...item, price } : item
      )
    );
  };

  const handleUpdateItemMinQty = (productId: string, minQuantity: string) => {
    setPriceItems(
      priceItems.map((item) =>
        item.productId === productId ? { ...item, minQuantity } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create the price list
      const priceList = await createPriceList.mutateAsync(form);

      // Add items if there are any
      if (priceItems.length > 0) {
        const items: AddPriceListItemInput[] = priceItems.map((item) => ({
          productId: item.productId,
          price: parseFloat(item.price),
          minQuantity: parseInt(item.minQuantity, 10) || 1,
        }));

        await addItems.mutateAsync({ priceListId: priceList.id, items });
      }

      router.push('/price-lists');
    } catch (error) {
      console.error('Failed to create price list:', error);
    }
  };

  // Filter out already added products
  const availableProducts = products?.filter(
    (p) => !priceItems.some((item) => item.productId === p.id)
  ) || [];

  const isSubmitting = createPriceList.isPending || addItems.isPending;

  if (duplicateId && isDuplicateLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-cedar-200 border-t-cedar-600 rounded-full"></div>
          <span className="text-warm-600">Loading price list to duplicate...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/price-lists">
            <Button variant="ghost" size="icon" className="hover:bg-warm-100">
              <ArrowLeft className="h-4 w-4 text-cedar-600" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cedar-100 rounded-lg">
              <Tag className="h-6 w-6 text-cedar-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar-800">
                {duplicateId ? 'Duplicate Price List' : 'New Price List'}
              </h1>
              <p className="text-sm text-warm-600">
                {duplicateId ? 'Create a copy of an existing price list' : 'Create a new price list for your products'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Card */}
        <div className="card-premium p-6">
          <h2 className="font-display text-lg font-semibold text-cedar-800 mb-4">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-cedar-700">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-warm"
                placeholder="e.g., Retail Price List"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Arabic Name</Label>
              <Input
                value={form.nameAr || ''}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="input-warm"
                placeholder="الاسم بالعربية"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value: 'USD' | 'LBP') => setForm({ ...form, currency: value })}
              >
                <SelectTrigger className="border-warm-300 focus:border-cedar-500 focus:ring-cedar-500">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div>
                  <Label className="text-cedar-700">Set as Default</Label>
                  <p className="text-xs text-warm-500">Use this price list as the default for all customers</p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(checked: boolean) => setForm({ ...form, isDefault: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                <div>
                  <Label className="text-cedar-700">Active</Label>
                  <p className="text-xs text-warm-500">Enable this price list for use</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked: boolean) => setForm({ ...form, isActive: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Prices Card */}
        <div className="card-premium overflow-hidden">
          <div className="p-4 border-b border-warm-200">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gold-600" />
              <h2 className="font-display text-lg font-semibold text-cedar-800">Product Prices</h2>
            </div>
            <p className="text-sm text-warm-500 mt-1">Add products and set their prices for this price list</p>
          </div>

          {/* Add Product Row */}
          <div className="p-4 bg-warm-50 border-b border-warm-200">
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-cedar-700 text-sm">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="border-warm-300 bg-white">
                    <SelectValue placeholder="Select a product to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-2">
                <Label className="text-cedar-700 text-sm">Price ({form.currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="input-warm"
                  placeholder="0.00"
                />
              </div>
              <div className="w-32 space-y-2">
                <Label className="text-cedar-700 text-sm">Min Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={newMinQty}
                  onChange={(e) => setNewMinQty(e.target.value)}
                  className="input-warm"
                  placeholder="1"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct || !newPrice}
                className="btn-gold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <Table className="table-warm">
            <TableHeader>
              <TableRow className="bg-warm-100/50 border-b border-warm-200">
                <TableHead className="text-cedar-700 font-semibold">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gold-600" />
                    Product
                  </div>
                </TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">
                  <div className="flex items-center justify-end gap-2">
                    <DollarSign className="h-4 w-4 text-gold-600" />
                    Price ({form.currency})
                  </div>
                </TableHead>
                <TableHead className="text-right text-cedar-700 font-semibold">Min Quantity</TableHead>
                <TableHead className="w-20 text-cedar-700 font-semibold">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-warm-100 rounded-full">
                        <Package className="h-8 w-8 text-warm-400" />
                      </div>
                      <div>
                        <p className="text-warm-700 font-medium">No products added yet</p>
                        <p className="text-sm text-warm-500">Use the form above to add products to this price list</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                priceItems.map((item, index) => (
                  <TableRow
                    key={item.productId}
                    className="hover:bg-warm-50 border-b border-warm-100 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <span className="font-medium text-cedar-800">{item.productName}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleUpdateItemPrice(item.productId, e.target.value)}
                        className="w-32 ml-auto input-warm text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="1"
                        value={item.minQuantity}
                        onChange={(e) => handleUpdateItemMinQty(item.productId, e.target.value)}
                        className="w-24 ml-auto input-warm text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="hover:bg-terracotta-100 hover:text-terracotta-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/price-lists">
            <Button type="button" variant="outline" className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !form.name} className="btn-cedar">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Price List'}
          </Button>
        </div>
      </form>
    </div>
  );
}
