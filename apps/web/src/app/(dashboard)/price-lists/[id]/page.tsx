'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  usePriceList,
  useUpdatePriceList,
  useUpdatePriceListItem,
  useRemovePriceListItem,
  useAddPriceListItems,
} from '@/hooks/use-price-lists';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  ArrowLeft,
  Save,
  Pencil,
  Trash2,
  Tag,
  Package,
  DollarSign,
  Plus,
  X,
  Check,
  Star,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { PriceListItem, UpdatePriceListInput } from '@/lib/api/price-lists';

export default function PriceListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const { data: priceList, isLoading } = usePriceList(id);
  const { data: products } = useProducts();
  const updatePriceListMutation = useUpdatePriceList();
  const updateItemMutation = useUpdatePriceListItem();
  const removeItemMutation = useRemovePriceListItem();
  const addItemsMutation = useAddPriceListItems();

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingMinQty, setEditingMinQty] = useState<string>('');
  const [deleteItem, setDeleteItem] = useState<PriceListItem | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductId, setNewProductId] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<string>('');
  const [newProductMinQty, setNewProductMinQty] = useState<string>('1');

  // Edit mode state for price list details
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdatePriceListInput>({});

  useEffect(() => {
    if (isEditMode) {
      setIsEditing(true);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (priceList) {
      setEditForm({
        name: priceList.name,
        nameAr: priceList.nameAr || '',
        currency: priceList.currency,
        isDefault: priceList.isDefault,
        isActive: priceList.isActive,
      });
    }
  }, [priceList]);

  const handleStartEditItem = (item: PriceListItem) => {
    setEditingItem(item.id);
    setEditingPrice(item.price);
    setEditingMinQty(item.minQuantity.toString());
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;

    await updateItemMutation.mutateAsync({
      itemId: editingItem,
      data: {
        price: parseFloat(editingPrice),
        minQuantity: parseInt(editingMinQty, 10),
      },
      priceListId: id,
    });

    setEditingItem(null);
  };

  const handleCancelEditItem = () => {
    setEditingItem(null);
    setEditingPrice('');
    setEditingMinQty('');
  };

  const handleDeleteItem = async () => {
    if (deleteItem) {
      await removeItemMutation.mutateAsync({
        itemId: deleteItem.id,
        priceListId: id,
      });
      setDeleteItem(null);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductId || !newProductPrice) return;

    await addItemsMutation.mutateAsync({
      priceListId: id,
      items: [{
        productId: newProductId,
        price: parseFloat(newProductPrice),
        minQuantity: parseInt(newProductMinQty, 10) || 1,
      }],
    });

    setShowAddProduct(false);
    setNewProductId('');
    setNewProductPrice('');
    setNewProductMinQty('1');
  };

  const handleSavePriceList = async () => {
    await updatePriceListMutation.mutateAsync({ id, data: editForm });
    setIsEditing(false);
    router.replace(`/price-lists/${id}`);
  };

  // Filter out products that are already in the price list
  const existingProductIds = new Set(priceList?.items.map(item => item.productId) || []);
  const availableProducts = products?.filter(p => !existingProductIds.has(p.id)) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-cedar-200 border-t-cedar-600 rounded-full"></div>
          <span className="text-warm-600">Loading price list...</span>
        </div>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="p-4 bg-warm-100 rounded-full">
          <Tag className="h-8 w-8 text-warm-400" />
        </div>
        <p className="text-warm-700 font-medium">Price list not found</p>
        <Link href="/price-lists">
          <Button variant="outline" className="border-cedar-300 text-cedar-700">
            Back to Price Lists
          </Button>
        </Link>
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
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-cedar-800">{priceList.name}</h1>
                {priceList.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700 border border-gold-300">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-warm-600">
                {priceList.currency} - {priceList.items.length} products
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  router.replace(`/price-lists/${id}`);
                }}
                className="border-warm-300 text-warm-700 hover:bg-warm-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePriceList}
                disabled={updatePriceListMutation.isPending}
                className="btn-cedar"
              >
                <Save className="h-4 w-4 mr-2" />
                {updatePriceListMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="btn-cedar">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Price List
            </Button>
          )}
        </div>
      </div>

      {/* Price List Details Card */}
      <div className="card-premium p-6">
        <h2 className="font-display text-lg font-semibold text-cedar-800 mb-4">Details</h2>
        {isEditing ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-cedar-700">Name</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input-warm"
                placeholder="Price list name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Arabic Name</Label>
              <Input
                value={editForm.nameAr || ''}
                onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })}
                className="input-warm"
                placeholder="Arabic name (optional)"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Currency</Label>
              <Select
                value={editForm.currency}
                onValueChange={(value: 'USD' | 'LBP') => setEditForm({ ...editForm, currency: value })}
              >
                <SelectTrigger className="border-warm-300">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="LBP">LBP - Lebanese Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-cedar-700">Set as Default</Label>
                <Switch
                  checked={editForm.isDefault}
                  onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, isDefault: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-cedar-700">Active</Label>
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, isActive: checked })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-warm-500">Name</p>
              <p className="font-medium text-cedar-800">{priceList.name}</p>
            </div>
            {priceList.nameAr && (
              <div>
                <p className="text-sm text-warm-500">Arabic Name</p>
                <p className="font-medium text-cedar-800" dir="rtl">{priceList.nameAr}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-warm-500">Currency</p>
              <p className="font-medium text-cedar-800">{priceList.currency}</p>
            </div>
            <div>
              <p className="text-sm text-warm-500">Status</p>
              <p className="font-medium text-cedar-800">
                {priceList.isActive ? (
                  <span className="badge-success">Active</span>
                ) : (
                  <span className="bg-warm-200 text-warm-700 px-2 py-0.5 rounded text-sm">Inactive</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-4 border-b border-warm-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gold-600" />
            <h2 className="font-display text-lg font-semibold text-cedar-800">Product Prices</h2>
          </div>
          <Button onClick={() => setShowAddProduct(true)} className="btn-gold">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
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
                  Price
                </div>
              </TableHead>
              <TableHead className="text-right text-cedar-700 font-semibold">Min Quantity</TableHead>
              <TableHead className="w-32 text-cedar-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priceList.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-warm-100 rounded-full">
                      <Package className="h-8 w-8 text-warm-400" />
                    </div>
                    <div>
                      <p className="text-warm-700 font-medium">No products in this price list</p>
                      <p className="text-sm text-warm-500">Add products to start pricing</p>
                    </div>
                    <Button onClick={() => setShowAddProduct(true)} className="btn-gold mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              priceList.items.map((item, index) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-warm-50 border-b border-warm-100 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-cedar-800">{item.product.name}</div>
                      {item.product.nameAr && (
                        <div className="text-sm text-warm-500" dir="rtl">
                          {item.product.nameAr}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingItem === item.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="w-32 ml-auto input-warm text-right"
                      />
                    ) : (
                      <span className="font-mono font-medium text-cedar-800">
                        {formatMoney(parseFloat(item.price), priceList.currency)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingItem === item.id ? (
                      <Input
                        type="number"
                        min="1"
                        value={editingMinQty}
                        onChange={(e) => setEditingMinQty(e.target.value)}
                        className="w-24 ml-auto input-warm text-right"
                      />
                    ) : (
                      <span className="text-warm-700">{item.minQuantity}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItem === item.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveItem}
                          disabled={updateItemMutation.isPending}
                          className="hover:bg-sage-100 hover:text-sage-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEditItem}
                          className="hover:bg-warm-100 hover:text-warm-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEditItem(item)}
                          className="hover:bg-cedar-100 hover:text-cedar-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                          className="hover:bg-terracotta-100 hover:text-terracotta-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gold-100 rounded-lg">
                <Plus className="h-5 w-5 text-gold-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Add Product</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Add a product to this price list with a custom price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-cedar-700">Product</Label>
              <Select value={newProductId} onValueChange={setNewProductId}>
                <SelectTrigger className="border-warm-300">
                  <SelectValue placeholder="Select a product" />
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
            <div className="space-y-2">
              <Label className="text-cedar-700">Price ({priceList.currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="input-warm"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-cedar-700">Minimum Quantity</Label>
              <Input
                type="number"
                min="1"
                value={newProductMinQty}
                onChange={(e) => setNewProductMinQty(e.target.value)}
                className="input-warm"
                placeholder="1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddProduct(false)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={addItemsMutation.isPending || !newProductId || !newProductPrice}
              className="btn-cedar"
            >
              {addItemsMutation.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-terracotta-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-terracotta-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Remove Product</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to remove &quot;{deleteItem?.product.name}&quot; from this price list?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteItem}
              disabled={removeItemMutation.isPending}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white"
            >
              {removeItemMutation.isPending ? 'Removing...' : 'Remove Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
