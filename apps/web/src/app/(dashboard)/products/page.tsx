'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProducts, useDeleteProduct } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
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
import { Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import type { ProductWithCategory, CategoryWithChildren } from '@accounting/shared';
import { formatMoney } from '@accounting/shared';

const flattenCategories = (cats: CategoryWithChildren[], depth = 0): { id: string; name: string; depth: number }[] => {
  return cats.flatMap((cat) => [
    { id: cat.id, name: cat.name, depth },
    ...flattenCategories(cat.children, depth + 1),
  ]);
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteProduct, setDeleteProduct] = useState<ProductWithCategory | null>(null);

  const { data: categories } = useCategories();
  const flatCategories = flattenCategories(categories ?? []);

  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const deleteMutation = useDeleteProduct();

  const handleDelete = async () => {
    if (deleteProduct) {
      await deleteMutation.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    }
  };

  const isLowStock = (product: ProductWithCategory) => {
    return (
      product.trackStock &&
      Number(product.currentStock) < Number(product.minStockLevel)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {flatCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {'  '.repeat(cat.depth)}{cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Barcode/SKU</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Selling</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {product.name}
                        {isLowStock(product) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      {product.nameAr && (
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          {product.nameAr}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {product.barcode && <div>BC: {product.barcode}</div>}
                      {product.sku && <div>SKU: {product.sku}</div>}
                      {!product.barcode && !product.sku && '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {product.costPrice
                      ? formatMoney(Number(product.costPrice), product.costCurrency)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.sellingPrice
                      ? formatMoney(Number(product.sellingPrice), product.sellingCurrency)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.trackStock ? (
                      <span className={isLowStock(product) ? 'text-orange-500' : ''}>
                        {Number(product.currentStock).toFixed(
                          ['piece', 'box', 'pack', 'dozen'].includes(product.unit) ? 0 : 2
                        )}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/products/${product.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteProduct?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
