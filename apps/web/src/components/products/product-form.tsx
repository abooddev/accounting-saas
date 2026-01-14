'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import type { ProductWithCategory, CategoryWithChildren } from '@accounting/shared';
import { PRODUCT_UNITS } from '@accounting/shared';

const productSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.enum(['piece', 'kg', 'g', 'liter', 'ml', 'box', 'pack', 'dozen']),
  costPrice: z.number().min(0).optional(),
  costCurrency: z.enum(['USD', 'LBP']),
  sellingPrice: z.number().min(0).optional(),
  sellingCurrency: z.enum(['USD', 'LBP']),
  trackStock: z.boolean(),
  currentStock: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductWithCategory;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

const flattenCategories = (cats: CategoryWithChildren[], depth = 0): { id: string; name: string; depth: number }[] => {
  return cats.flatMap((cat) => [
    { id: cat.id, name: cat.name, depth },
    ...flattenCategories(cat.children, depth + 1),
  ]);
};

export function ProductForm({ product, onSubmit, isLoading }: ProductFormProps) {
  const { data: categories } = useCategories();
  const flatCategories = flattenCategories(categories ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: product?.categoryId ?? undefined,
      name: product?.name ?? '',
      nameAr: product?.nameAr ?? '',
      barcode: product?.barcode ?? '',
      sku: product?.sku ?? '',
      unit: product?.unit ?? 'piece',
      costPrice: product?.costPrice ? Number(product.costPrice) : undefined,
      costCurrency: product?.costCurrency ?? 'USD',
      sellingPrice: product?.sellingPrice ? Number(product.sellingPrice) : undefined,
      sellingCurrency: product?.sellingCurrency ?? 'USD',
      trackStock: product?.trackStock ?? true,
      currentStock: product?.currentStock ? Number(product.currentStock) : 0,
      minStockLevel: product?.minStockLevel ? Number(product.minStockLevel) : 0,
    },
  });

  const categoryId = watch('categoryId');
  const unit = watch('unit');
  const costCurrency = watch('costCurrency');
  const sellingCurrency = watch('sellingCurrency');
  const trackStock = watch('trackStock');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameAr">Name (Arabic)</Label>
          <Input id="nameAr" dir="rtl" {...register('nameAr')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId ?? 'none'}
            onValueChange={(value) => setValue('categoryId', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {'  '.repeat(cat.depth)}{cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" {...register('barcode')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register('sku')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Unit</Label>
        <Select value={unit} onValueChange={(value) => setValue('unit', value as ProductFormData['unit'])}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRODUCT_UNITS).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name} ({value.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price</Label>
          <div className="flex gap-2">
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('costPrice', { valueAsNumber: true })}
              className="flex-1"
            />
            <Select
              value={costCurrency}
              onValueChange={(value) => setValue('costCurrency', value as 'USD' | 'LBP')}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="LBP">LBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling Price</Label>
          <div className="flex gap-2">
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              min="0"
              {...register('sellingPrice', { valueAsNumber: true })}
              className="flex-1"
            />
            <Select
              value={sellingCurrency}
              onValueChange={(value) => setValue('sellingCurrency', value as 'USD' | 'LBP')}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="LBP">LBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="trackStock"
            {...register('trackStock')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="trackStock">Track inventory</Label>
        </div>

        {trackStock && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                min="0"
                {...register('currentStock', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                step="0.01"
                min="0"
                {...register('minStockLevel', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );
}
