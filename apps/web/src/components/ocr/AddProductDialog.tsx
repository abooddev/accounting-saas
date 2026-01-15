'use client';

import { useState, useEffect } from 'react';
import { Loader2, Package, Tag, DollarSign, Hash, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { ocrApi } from '@/lib/api/ocr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProductInput, ProductUnit, Currency } from '@accounting/shared';

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  ocrDescription: string;
  supplierId?: string;
  defaultPrice?: number;
  defaultCurrency?: 'USD' | 'LBP';
  onProductCreated: (product: { id: string; name: string }) => void;
}

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'g', label: 'Gram' },
  { value: 'liter', label: 'Liter' },
  { value: 'ml', label: 'Milliliter' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
];

export function AddProductDialog({
  open,
  onClose,
  ocrDescription,
  supplierId,
  defaultPrice,
  defaultCurrency = 'USD',
  onProductCreated,
}: AddProductDialogProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [unit, setUnit] = useState<ProductUnit>('piece');
  const [costPrice, setCostPrice] = useState<string>('');
  const [costCurrency, setCostCurrency] = useState<Currency>(defaultCurrency);
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [sellingCurrency, setSellingCurrency] = useState<Currency>(defaultCurrency);
  const [createAlias, setCreateAlias] = useState(true);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Reset form when dialog opens with new OCR description
  useEffect(() => {
    if (open && ocrDescription) {
      // Parse the OCR description to suggest a cleaner product name
      // Remove common patterns like "*12", quantity suffixes
      const cleanName = ocrDescription
        .replace(/\s*\*\d+\s*$/g, '') // Remove "*12" at end
        .replace(/\s*x\d+\s*$/gi, '') // Remove "x12" at end
        .trim();
      setName(cleanName);
      setNameAr('');
      setSku('');
      setBarcode('');
      setCategoryId('');
      setUnit('piece');
      setCostPrice(defaultPrice?.toString() || '');
      setCostCurrency(defaultCurrency);
      setSellingPrice('');
      setSellingCurrency(defaultCurrency);
      setCreateAlias(true);
    }
  }, [open, ocrDescription, defaultPrice, defaultCurrency]);

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const product = await productsApi.create(data);

      // Create alias if checked
      if (createAlias && ocrDescription) {
        await ocrApi.createProductAlias(product.id, ocrDescription, supplierId);
      }

      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['ocr-products'] });
      onProductCreated({ id: product.id, name: product.name });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    createProductMutation.mutate({
      name: name.trim(),
      nameAr: nameAr.trim() || undefined,
      sku: sku.trim() || undefined,
      barcode: barcode.trim() || undefined,
      categoryId: categoryId || undefined,
      unit,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      costCurrency,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      sellingCurrency,
      trackStock: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl bg-gradient-to-br from-warm-50 to-white border-warm-200">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-cedar-800 flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-sage-100 to-cedar-100 rounded-lg">
              <Package className="h-5 w-5 text-sage-600" />
            </span>
            Create New Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* OCR Description Reference */}
          <div className="p-3 bg-warm-100 rounded-lg border border-warm-200">
            <p className="text-xs text-warm-500 mb-1">OCR Description (will be linked as alias)</p>
            <p className="font-medium text-warm-700 text-sm" dir={/[\u0600-\u06FF]/.test(ocrDescription) ? 'rtl' : 'ltr'}>
              {ocrDescription}
            </p>
          </div>

          {/* Product Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-cedar-500" />
                Product Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                className="input-warm"
                required
              />
            </div>
            <div>
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <Languages className="h-4 w-4 text-cedar-500" />
                Arabic Name
              </Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="الاسم بالعربية"
                className="input-warm"
                dir="rtl"
              />
            </div>
          </div>

          {/* SKU and Barcode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-warm-500" />
                SKU
              </Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
                className="input-warm"
              />
            </div>
            <div>
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-warm-500" />
                Barcode
              </Label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="1234567890"
                className="input-warm"
              />
            </div>
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-warm-700 mb-2 block">Category</Label>
              <Select value={categoryId || '__none__'} onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="input-warm">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No category</SelectItem>
                  {categoriesArray.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-warm-700 mb-2 block">Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as ProductUnit)}>
                <SelectTrigger className="input-warm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-cedar-500" />
                Cost Price
              </Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="input-warm"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label className="text-warm-700 mb-2 block">Currency</Label>
              <Select value={costCurrency} onValueChange={(v) => setCostCurrency(v as Currency)}>
                <SelectTrigger className="input-warm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selling Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label className="text-warm-700 flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-sage-500" />
                Selling Price
              </Label>
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="input-warm"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label className="text-warm-700 mb-2 block">Currency</Label>
              <Select value={sellingCurrency} onValueChange={(v) => setSellingCurrency(v as Currency)}>
                <SelectTrigger className="input-warm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="LBP">LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alias Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-sage-50 rounded-lg border border-sage-200">
            <input
              type="checkbox"
              id="createAlias"
              checked={createAlias}
              onChange={(e) => setCreateAlias(e.target.checked)}
              className="h-4 w-4 rounded border-sage-300 text-sage-600 focus:ring-sage-500"
            />
            <Label htmlFor="createAlias" className="text-sm text-sage-700 cursor-pointer">
              Save OCR description as alias for future auto-matching
              {supplierId && <span className="text-sage-500"> (linked to this supplier)</span>}
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-warm-300 text-warm-700 hover:bg-warm-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="btn-cedar"
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
