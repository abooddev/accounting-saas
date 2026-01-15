'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useSalesOrders,
  useDeleteSalesOrder,
  useConfirmSalesOrder,
  useCancelSalesOrder,
  useConvertSalesOrderToInvoice,
} from '@/hooks/use-sales-orders';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Trash2,
  Truck,
  FileText,
  Filter,
  ShoppingCart,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { SalesOrder } from '@/lib/api/sales-orders';

const SALES_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-stone/10 text-stone border-stone/20' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-cedar/10 text-cedar border-cedar/20' },
  { value: 'partial', label: 'Partially Delivered', color: 'bg-gold/10 text-gold border-gold/20' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'bg-sage/10 text-sage border-sage/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-terracotta/10 text-terracotta border-terracotta/20' },
];

export default function SalesOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteOrder, setDeleteOrder] = useState<SalesOrder | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<SalesOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<SalesOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<SalesOrder | null>(null);

  const { data: salesOrders, isLoading } = useSalesOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const deleteMutation = useDeleteSalesOrder();
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const invoiceMutation = useConvertSalesOrderToInvoice();

  const handleDelete = async () => {
    if (deleteOrder) {
      await deleteMutation.mutateAsync(deleteOrder.id);
      setDeleteOrder(null);
    }
  };

  const handleConfirm = async () => {
    if (confirmOrder) {
      await confirmMutation.mutateAsync(confirmOrder.id);
      setConfirmOrder(null);
    }
  };

  const handleCancel = async () => {
    if (cancelOrder) {
      await cancelMutation.mutateAsync(cancelOrder.id);
      setCancelOrder(null);
    }
  };

  const handleConvertToInvoice = async () => {
    if (invoiceOrder) {
      const result = await invoiceMutation.mutateAsync(invoiceOrder.id);
      setInvoiceOrder(null);
      router.push(`/invoices/${result.invoiceId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = SALES_ORDER_STATUSES.find(s => s.value === status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo?.color || 'bg-muted text-muted-foreground'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const getDeliveryProgress = (order: SalesOrder) => {
    if (!order.items || order.items.length === 0) return null;

    const totalOrdered = order.items.reduce((sum, item) => sum + parseFloat(item.quantityOrdered), 0);
    const totalDelivered = order.items.reduce((sum, item) => sum + parseFloat(item.quantityDelivered), 0);

    if (totalOrdered === 0) return null;

    const percentage = Math.round((totalDelivered / totalOrdered) * 100);

    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-cedar rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
    );
  };

  const ordersArray = Array.isArray(salesOrders) ? salesOrders : [];
  const filteredOrders = ordersArray.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.number?.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cedar/10">
            <ShoppingCart className="h-6 w-6 text-cedar" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-cedar">Sales Orders</h1>
            <p className="text-sm text-muted-foreground">Manage customer orders and deliveries</p>
          </div>
        </div>
        <Link href="/sales-orders/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            New Sales Order
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
              placeholder="Search by order number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-cedar/20 focus:border-cedar focus:ring-cedar/20"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 border-cedar/20 focus:border-cedar focus:ring-cedar/20">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {SALES_ORDER_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-cedar/5 hover:bg-cedar/5">
              <TableHead className="text-cedar font-semibold">Order Number</TableHead>
              <TableHead className="text-cedar font-semibold">Customer</TableHead>
              <TableHead className="text-cedar font-semibold">Date</TableHead>
              <TableHead className="text-cedar font-semibold">Delivery Date</TableHead>
              <TableHead className="text-right text-cedar font-semibold">Total</TableHead>
              <TableHead className="text-cedar font-semibold">Status</TableHead>
              <TableHead className="text-cedar font-semibold">Delivery</TableHead>
              <TableHead className="w-16 text-cedar font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar"></div>
                    <span className="text-muted-foreground">Loading sales orders...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                    <span className="text-muted-foreground">No sales orders found</span>
                    <Link href="/sales-orders/new">
                      <Button className="btn-gold mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Sales Order
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders?.map((order, index) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-gold/5 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <Link
                      href={`/sales-orders/${order.id}`}
                      className="font-medium text-cedar hover:underline"
                    >
                      {order.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer?.name || '-'}</div>
                      {order.customer?.nameAr && (
                        <div className="text-sm text-muted-foreground" dir="rtl">
                          {order.customer.nameAr}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.date}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.expectedDeliveryDate || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-cedar">
                    {formatMoney(parseFloat(order.total ?? '0'), order.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getDeliveryProgress(order)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-cedar/10 hover:text-cedar"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <Link href={`/sales-orders/${order.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        {order.status === 'draft' && (
                          <Link href={`/sales-orders/${order.id}?edit=true`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                        )}
                        <DropdownMenuSeparator />
                        {order.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => setConfirmOrder(order)}
                            className="cursor-pointer text-cedar"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Order
                          </DropdownMenuItem>
                        )}
                        {(order.status === 'confirmed' || order.status === 'partial') && (
                          <Link href={`/sales-orders/${order.id}?deliver=true`}>
                            <DropdownMenuItem className="cursor-pointer text-gold">
                              <Truck className="h-4 w-4 mr-2" />
                              Record Delivery
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {(order.status === 'confirmed' || order.status === 'partial' || order.status === 'fulfilled') && (
                          <DropdownMenuItem
                            onClick={() => setInvoiceOrder(order)}
                            className="cursor-pointer text-sage"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Create Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {['draft', 'confirmed', 'partial'].includes(order.status) && (
                          <DropdownMenuItem
                            onClick={() => setCancelOrder(order)}
                            className="cursor-pointer text-terracotta"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        )}
                        {order.status === 'draft' && (
                          <DropdownMenuItem
                            className="cursor-pointer text-terracotta"
                            onClick={() => setDeleteOrder(order)}
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
      <Dialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-terracotta" />
              Delete Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete sales order &quot;{deleteOrder?.number}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOrder(null)}
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

      {/* Confirm Order Dialog */}
      <Dialog open={!!confirmOrder} onOpenChange={() => setConfirmOrder(null)}>
        <DialogContent className="card-premium border-cedar/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-cedar" />
              Confirm Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confirming this order will verify stock availability. Once confirmed, the order cannot be edited directly. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOrder(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="btn-cedar"
            >
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={!!cancelOrder} onOpenChange={() => setCancelOrder(null)}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <XCircle className="h-5 w-5 text-terracotta" />
              Cancel Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cancelling this order will reverse any stock changes from deliveries. This action cannot be undone. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelOrder(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Keep Order
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={() => setInvoiceOrder(null)}>
        <DialogContent className="card-premium border-sage/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <FileText className="h-5 w-5 text-sage" />
              Create Invoice from Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will create a new sales invoice from order &quot;{invoiceOrder?.number}&quot;. You will be redirected to the new invoice. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInvoiceOrder(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToInvoice}
              disabled={invoiceMutation.isPending}
              className="bg-sage hover:bg-sage/90 text-white"
            >
              {invoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
