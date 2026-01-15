'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePriceLists, useDeletePriceList } from '@/hooks/use-price-lists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Tag,
  Filter,
  Star,
  DollarSign,
} from 'lucide-react';
import type { PriceList } from '@/lib/api/price-lists';

export default function PriceListsPage() {
  const [search, setSearch] = useState('');
  const [deletePriceList, setDeletePriceList] = useState<PriceList | null>(null);

  const { data: priceLists, isLoading } = usePriceLists();
  const deleteMutation = useDeletePriceList();

  const handleDelete = async () => {
    if (deletePriceList) {
      await deleteMutation.mutateAsync(deletePriceList.id);
      setDeletePriceList(null);
    }
  };

  const getStatusBadge = (priceList: PriceList) => {
    if (!priceList.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-200 text-warm-700 border border-warm-300">
          Inactive
        </span>
      );
    }
    if (priceList.isDefault) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700 border border-gold-300">
          <Star className="h-3 w-3 mr-1" />
          Default
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium badge-success">
        Active
      </span>
    );
  };

  const priceListsArray = Array.isArray(priceLists) ? priceLists : [];
  const filteredPriceLists = priceListsArray.filter(priceList => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      priceList.name.toLowerCase().includes(searchLower) ||
      priceList.nameAr?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cedar-100 rounded-lg">
            <Tag className="h-6 w-6 text-cedar-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-cedar-800">Price Lists</h1>
            <p className="text-sm text-warm-600">Manage product pricing for different customers</p>
          </div>
        </div>
        <Link href="/price-lists/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            New Price List
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gold-600" />
          <span className="text-sm font-medium text-cedar-700">Filters</span>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-500" />
            <Input
              placeholder="Search price lists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-warm-300 focus:border-cedar-500 focus:ring-cedar-500"
            />
          </div>
        </div>
      </div>

      {/* Price Lists Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-warm-100/50 border-b border-warm-200">
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gold-600" />
                  Name
                </div>
              </TableHead>
              <TableHead className="text-cedar-700 font-semibold">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gold-600" />
                  Currency
                </div>
              </TableHead>
              <TableHead className="text-cedar-700 font-semibold">Status</TableHead>
              <TableHead className="text-cedar-700 font-semibold">Created</TableHead>
              <TableHead className="w-16 text-cedar-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin h-8 w-8 border-4 border-cedar-200 border-t-cedar-600 rounded-full"></div>
                    <span className="text-warm-600">Loading price lists...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPriceLists?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-warm-100 rounded-full">
                      <Tag className="h-8 w-8 text-warm-400" />
                    </div>
                    <div>
                      <p className="text-warm-700 font-medium">No price lists found</p>
                      <p className="text-sm text-warm-500">Create your first price list to get started</p>
                    </div>
                    <Link href="/price-lists/new">
                      <Button className="btn-gold mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Price List
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPriceLists?.map((priceList, index) => (
                <TableRow
                  key={priceList.id}
                  className="hover:bg-warm-50 border-b border-warm-100 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-cedar-800">{priceList.name}</div>
                      {priceList.nameAr && (
                        <div className="text-sm text-warm-500" dir="rtl">
                          {priceList.nameAr}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      priceList.currency === 'USD'
                        ? 'bg-sage-100 text-sage-700 border border-sage-200'
                        : 'bg-gold-100 text-gold-700 border border-gold-200'
                    }`}>
                      {priceList.currency}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(priceList)}</TableCell>
                  <TableCell className="text-warm-700">
                    {new Date(priceList.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-warm-100">
                          <MoreHorizontal className="h-4 w-4 text-warm-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-warm-200">
                        <Link href={`/price-lists/${priceList.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2 text-cedar-600" />
                            <span className="text-cedar-700">View</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/price-lists/${priceList.id}?edit=true`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Pencil className="h-4 w-4 mr-2 text-cedar-600" />
                            <span className="text-cedar-700">Edit</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/price-lists/new?duplicate=${priceList.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Copy className="h-4 w-4 mr-2 text-gold-600" />
                            <span className="text-gold-700">Duplicate</span>
                          </DropdownMenuItem>
                        </Link>
                        {!priceList.isDefault && (
                          <DropdownMenuItem
                            className="cursor-pointer text-terracotta-600 focus:text-terracotta-700 focus:bg-terracotta-50"
                            onClick={() => setDeletePriceList(priceList)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePriceList} onOpenChange={() => setDeletePriceList(null)}>
        <DialogContent className="border-warm-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-terracotta-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-terracotta-600" />
              </div>
              <DialogTitle className="font-display text-xl text-cedar-800">Delete Price List</DialogTitle>
            </div>
            <DialogDescription className="text-warm-600">
              Are you sure you want to delete &quot;{deletePriceList?.name}&quot;? This action cannot be undone.
              Any customer assignments to this price list will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePriceList(null)} className="border-warm-300 text-warm-700 hover:bg-warm-50">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Price List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
