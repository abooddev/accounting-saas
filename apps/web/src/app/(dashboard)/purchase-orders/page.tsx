'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useConvertToInvoice,
} from '@/hooks/use-purchase-orders';
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
  Send,
  Package,
  FileText,
  Trash2,
  XCircle,
  Filter,
  ClipboardList,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { PurchaseOrder } from '@/lib/api/purchase-orders';

const PURCHASE_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteOrder, setDeleteOrder] = useState<PurchaseOrder | null>(null);
  const [sendOrder, setSendOrder] = useState<PurchaseOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PurchaseOrder | null>(null);
  const [convertOrder, setConvertOrder] = useState<PurchaseOrder | null>(null);

  const { data: purchaseOrders, isLoading } = usePurchaseOrders({
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  const deleteMutation = useDeletePurchaseOrder();
  const updateStatusMutation = useUpdatePurchaseOrderStatus();
  const convertMutation = useConvertToInvoice();

  const handleDelete = async () => {
    if (deleteOrder) {
      await deleteMutation.mutateAsync(deleteOrder.id);
      setDeleteOrder(null);
    }
  };

  const handleSend = async () => {
    if (sendOrder) {
      await updateStatusMutation.mutateAsync({ id: sendOrder.id, status: 'sent' });
      setSendOrder(null);
    }
  };

  const handleCancel = async () => {
    if (cancelOrder) {
      await updateStatusMutation.mutateAsync({ id: cancelOrder.id, status: 'cancelled' });
      setCancelOrder(null);
    }
  };

  const handleConvert = async () => {
    if (convertOrder) {
      const result = await convertMutation.mutateAsync(convertOrder.id);
      setConvertOrder(null);
      if (result.invoiceId) {
        router.push(`/invoices/${result.invoiceId}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = PURCHASE_ORDER_STATUSES.find((s) => s.value === status);
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    const variants: Record<string, string> = {
      draft: 'bg-stone/10 text-stone border border-stone/20',
      sent: 'bg-cedar/10 text-cedar border border-cedar/20',
      partial: 'bg-gold/10 text-gold border border-gold/20',
      received: 'bg-sage/10 text-sage border border-sage/20',
      cancelled: 'bg-terracotta/10 text-terracotta border border-terracotta/20',
    };

    return (
      <span className={`${baseClasses} ${variants[status] || variants.draft}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const ordersArray = Array.isArray(purchaseOrders) ? purchaseOrders : [];
  const filteredOrders = ordersArray.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.number?.toLowerCase().includes(searchLower) ||
      order.supplier?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cedar/10">
            <ClipboardList className="h-6 w-6 text-cedar" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-cedar">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage supplier orders and track deliveries
            </p>
          </div>
        </div>
        <Link href="/purchase-orders/new">
          <Button className="btn-cedar">
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
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
              placeholder="Search orders..."
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
              {PURCHASE_ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card-premium overflow-hidden">
        <Table className="table-warm">
          <TableHeader>
            <TableRow className="bg-cedar/5 hover:bg-cedar/5">
              <TableHead className="text-cedar font-semibold">Order #</TableHead>
              <TableHead className="text-cedar font-semibold">Supplier</TableHead>
              <TableHead className="text-cedar font-semibold">Date</TableHead>
              <TableHead className="text-cedar font-semibold">Expected Delivery</TableHead>
              <TableHead className="text-right text-cedar font-semibold">Total</TableHead>
              <TableHead className="text-cedar font-semibold">Status</TableHead>
              <TableHead className="w-16 text-cedar font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar"></div>
                    <span className="text-muted-foreground">Loading purchase orders...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                    <span className="text-muted-foreground">No purchase orders found</span>
                    <Link href="/purchase-orders/new">
                      <Button className="btn-gold mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Order
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
                    <div className="font-medium text-cedar font-mono">{order.number}</div>
                  </TableCell>
                  <TableCell>
                    {order.supplier?.name ? (
                      <span className="text-foreground">{order.supplier.name}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    {order.expectedDeliveryDate || (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatMoney(parseFloat(order.total ?? '0'), order.currency)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
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
                        <Link href={`/purchase-orders/${order.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        {order.status === 'draft' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setSendOrder(order)}
                              className="cursor-pointer"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send to Supplier
                            </DropdownMenuItem>
                            <Link href={`/purchase-orders/${order.id}?edit=true`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <FileText className="h-4 w-4 mr-2" />
                                Edit Order
                              </DropdownMenuItem>
                            </Link>
                          </>
                        )}
                        {['sent', 'partial'].includes(order.status) && (
                          <Link href={`/purchase-orders/${order.id}?receive=true`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Package className="h-4 w-4 mr-2" />
                              Receive Goods
                            </DropdownMenuItem>
                          </Link>
                        )}
                        {['received', 'partial'].includes(order.status) && (
                          <DropdownMenuItem
                            onClick={() => setConvertOrder(order)}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Create Bill
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {!['received', 'cancelled'].includes(order.status) && (
                          <DropdownMenuItem
                            onClick={() => setCancelOrder(order)}
                            className="cursor-pointer text-terracotta focus:text-terracotta"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Order
                          </DropdownMenuItem>
                        )}
                        {order.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => setDeleteOrder(order)}
                            className="cursor-pointer text-terracotta focus:text-terracotta"
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
              Delete Purchase Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete order &quot;{deleteOrder?.number}&quot;? This action
              cannot be undone.
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

      {/* Send to Supplier Dialog */}
      <Dialog open={!!sendOrder} onOpenChange={() => setSendOrder(null)}>
        <DialogContent className="card-premium border-cedar/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Send className="h-5 w-5 text-cedar" />
              Send to Supplier
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Mark order &quot;{sendOrder?.number}&quot; as sent to supplier? This indicates the
              order has been communicated and is awaiting delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSendOrder(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={updateStatusMutation.isPending}
              className="btn-cedar"
            >
              {updateStatusMutation.isPending ? 'Sending...' : 'Mark as Sent'}
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
              Cancel Purchase Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to cancel order &quot;{cancelOrder?.number}&quot;? This action
              will mark the order as cancelled.
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
              disabled={updateStatusMutation.isPending}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              {updateStatusMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={!!convertOrder} onOpenChange={() => setConvertOrder(null)}>
        <DialogContent className="card-premium border-gold/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" />
              Create Bill from Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a purchase invoice (bill) from order &quot;{convertOrder?.number}&quot;? This
              will generate an invoice based on the received goods.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConvertOrder(null)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={convertMutation.isPending} className="btn-gold">
              {convertMutation.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
