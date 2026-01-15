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
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Package,
  Filter,
} from 'lucide-react';
import type { ProductWithCategory, CategoryWithChildren } from '@accounting/shared';
import { formatMoney } from '@accounting/shared';

const flattenCategories = (cats: CategoryWithChildren[], depth = 0): { id: string; name: string; depth: number }[] => {
  return cats.flatMap((cat) => [
    { id: cat.id, name: cat.name, depth },
    ...flattenCategories(cat.children, depth + 1),
  ]);
};

const getStockStatus = (product: ProductWithCategory) => {
  if (!product.trackStock) return null;
  const currentStock = Number(product.currentStock);
  const minStock = Number(product.minStockLevel);

  if (currentStock <= 0) return 'out';
  if (currentStock < minStock) return 'low';
  return 'in';
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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cedar/10">
            <Package className="h-6 w-6 text-cedar" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-cedar">Products</h1>
            <p className="text-sm text-muted-foreground">Manage your product inventory</p>
          </div>
        </div>
        <Link href="/products/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-cedar">Filters</span>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-cedar/20 focus:border-cedar focus:ring-cedar/20"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 border-cedar/20 focus:border-cedar focus:ring-cedar/20">
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
      </div>

      {/* Products Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-cedar/5 hover:bg-cedar/5">
              <TableHead className="text-cedar font-semibold">Name</TableHead>
              <TableHead className="text-cedar font-semibold">Category</TableHead>
              <TableHead className="text-cedar font-semibold">Barcode/SKU</TableHead>
              <TableHead className="text-right text-cedar font-semibold">Cost</TableHead>
              <TableHead className="text-right text-cedar font-semibold">Selling</TableHead>
              <TableHead className="text-right text-cedar font-semibold">Stock</TableHead>
              <TableHead className="w-24 text-cedar font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar"></div>
                    <span className="text-muted-foreground">Loading products...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                    <span className="text-muted-foreground">No products found</span>
                    <Link href="/products/new">
                      <Button className="btn-gold mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product, index) => {
                const stockStatus = getStockStatus(product);
                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-gold/5 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-cedar flex items-center gap-2">
                          {product.name}
                          {stockStatus === 'low' && (
                            <AlertTriangle className="h-4 w-4 text-terracotta" />
                          )}
                          {stockStatus === 'out' && (
                            <AlertTriangle className="h-4 w-4 text-terracotta" />
                          )}
                        </div>
                        {product.nameAr && (
                          <div className="text-sm text-muted-foreground" dir="rtl">
                            {product.nameAr}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category?.name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-cedar/10 text-cedar text-sm">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {product.barcode && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">BC:</span>
                            <span className="font-mono text-cedar">{product.barcode}</span>
                          </div>
                        )}
                        {product.sku && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">SKU:</span>
                            <span className="font-mono text-cedar">{product.sku}</span>
                          </div>
                        )}
                        {!product.barcode && !product.sku && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.costPrice
                        ? formatMoney(Number(product.costPrice), product.costCurrency)
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-cedar font-medium">
                      {product.sellingPrice
                        ? formatMoney(Number(product.sellingPrice), product.sellingCurrency)
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.trackStock ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono">
                            {Number(product.currentStock).toFixed(
                              ['piece', 'box', 'pack', 'dozen'].includes(product.unit) ? 0 : 2
                            )}
                          </span>
                          {stockStatus === 'in' && (
                            <span className="badge-success">In Stock</span>
                          )}
                          {stockStatus === 'low' && (
                            <span className="badge-warning">Low Stock</span>
                          )}
                          {stockStatus === 'out' && (
                            <span className="badge-danger">Out of Stock</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/products/${product.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-cedar/10 hover:text-cedar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteProduct(product)}
                          className="hover:bg-terracotta/10 hover:text-terracotta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-terracotta" />
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deleteProduct?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteProduct(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
