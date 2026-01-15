'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  usePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useReceiveGoods,
  useConvertToInvoice,
  useDeletePurchaseOrder,
} from '@/hooks/use-purchase-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Send,
  Package,
  FileText,
  XCircle,
  Trash2,
  ClipboardList,
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { PurchaseOrderItem } from '@/lib/api/purchase-orders';

const PURCHASE_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showReceiveModal = searchParams.get('receive') === 'true';

  const { data: order, isLoading } = usePurchaseOrder(id);

  const updateStatusMutation = useUpdatePurchaseOrderStatus();
  const receiveGoodsMutation = useReceiveGoods();
  const convertMutation = useConvertToInvoice();
  const deleteMutation = useDeletePurchaseOrder();

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(showReceiveModal);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});

  const handleSend = async () => {
    await updateStatusMutation.mutateAsync({ id, status: 'sent' });
    setShowSendDialog(false);
  };

  const handleCancel = async () => {
    await updateStatusMutation.mutateAsync({ id, status: 'cancelled' });
    setShowCancelDialog(false);
  };

  const handleConvert = async () => {
    const result = await convertMutation.mutateAsync(id);
    setShowConvertDialog(false);
    if (result.invoiceId) {
      router.push(`/invoices/${result.invoiceId}`);
    }
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    setShowDeleteDialog(false);
    router.push('/purchase-orders');
  };

  const handleReceive = async () => {
    const items = Object.entries(receiveQuantities)
      .filter(([_, qty]) => parseFloat(qty) > 0)
      .map(([itemId, qty]) => ({
        itemId,
        quantityReceived: parseFloat(qty),
      }));

    if (items.length === 0) return;

    await receiveGoodsMutation.mutateAsync({ id, items });
    setShowReceiveDialog(false);
    setReceiveQuantities({});
    router.replace(`/purchase-orders/${id}`);
  };

  const initializeReceiveQuantities = () => {
    if (order?.items) {
      const quantities: Record<string, string> = {};
      order.items.forEach((item) => {
        const remaining =
          parseFloat(item.quantityOrdered) - parseFloat(item.quantityReceived);
        quantities[item.id] = remaining > 0 ? remaining.toString() : '0';
      });
      setReceiveQuantities(quantities);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = PURCHASE_ORDER_STATUSES.find((s) => s.value === status);
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';

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

  const getReceiveStatus = (item: PurchaseOrderItem) => {
    const ordered = parseFloat(item.quantityOrdered);
    const received = parseFloat(item.quantityReceived);

    if (received >= ordered) {
      return { status: 'complete', icon: CheckCircle2, color: 'text-sage' };
    }
    if (received > 0) {
      return { status: 'partial', icon: AlertCircle, color: 'text-gold' };
    }
    return { status: 'pending', icon: Package, color: 'text-muted-foreground' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar"></div>
          <span className="text-muted-foreground">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground">Purchase order not found</p>
          <Link href="/purchase-orders">
            <Button className="btn-cedar mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-cedar/10 hover:text-cedar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cedar/10">
              <ClipboardList className="h-6 w-6 text-cedar" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar">{order.number}</h1>
              <p className="text-sm text-muted-foreground">Purchase Order</p>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="flex gap-2">
          {order.status === 'draft' && (
            <>
              <Button
                onClick={() => setShowSendDialog(true)}
                className="btn-cedar"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Supplier
              </Button>
              <Link href={`/purchase-orders/${id}?edit=true`}>
                <Button
                  variant="outline"
                  className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </>
          )}
          {['sent', 'partial'].includes(order.status) && (
            <Button
              onClick={() => {
                initializeReceiveQuantities();
                setShowReceiveDialog(true);
              }}
              className="btn-gold"
            >
              <Package className="h-4 w-4 mr-2" />
              Receive Goods
            </Button>
          )}
          {['received', 'partial'].includes(order.status) && (
            <Button
              onClick={() => setShowConvertDialog(true)}
              className="btn-cedar"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          )}
          {!['received', 'cancelled'].includes(order.status) && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="border-terracotta/20 hover:bg-terracotta/5 hover:text-terracotta"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {order.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-terracotta/20 hover:bg-terracotta/5 hover:text-terracotta"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="col-span-2 card-premium">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="font-display text-lg text-cedar">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cedar/5">
                  <Building2 className="h-4 w-4 text-cedar" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium text-foreground">
                    {order.supplier?.name || <span className="text-muted-foreground">-</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cedar/5">
                  <Calendar className="h-4 w-4 text-cedar" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium text-foreground">{order.date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gold/10">
                  <Truck className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium text-foreground">
                    {order.expectedDeliveryDate || (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cedar/5">
                  <FileText className="h-4 w-4 text-cedar" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exchange Rate</p>
                  <p className="font-medium text-foreground font-mono">
                    {parseFloat(order.exchangeRate).toLocaleString()} LBP/USD
                  </p>
                </div>
              </div>

              {order.notes && (
                <div className="col-span-2 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cedar/5">
                    <FileText className="h-4 w-4 text-cedar" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-foreground">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="card-premium">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="font-display text-lg text-cedar">Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">
                {formatMoney(parseFloat(order.subtotal ?? '0'), order.currency)}
              </span>
            </div>
            {order.taxAmount && parseFloat(order.taxAmount) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">
                  {formatMoney(parseFloat(order.taxAmount), order.currency)}
                </span>
              </div>
            )}
            <div className="border-t border-border/50 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-cedar">Total</span>
                <span className="text-xl font-bold text-cedar font-mono">
                  {formatMoney(parseFloat(order.total ?? '0'), order.currency)}
                </span>
              </div>
            </div>
            {order.currency === 'USD' && (
              <div className="text-sm text-muted-foreground text-right">
                {formatMoney(
                  parseFloat(order.total ?? '0') * parseFloat(order.exchangeRate),
                  'LBP'
                )}{' '}
                LBP
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card className="card-premium">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="font-display text-lg text-cedar">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-warm">
            <TableHeader>
              <TableRow className="bg-cedar/5 hover:bg-cedar/5">
                <TableHead className="text-cedar font-semibold">Product/Description</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Ordered</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Received</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Unit Price</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Line Total</TableHead>
                <TableHead className="text-center text-cedar font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => {
                const receiveStatus = getReceiveStatus(item);
                const StatusIcon = receiveStatus.icon;

                return (
                  <TableRow key={item.id} className="hover:bg-gold/5">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{item.description}</div>
                        {item.product?.sku && (
                          <div className="text-sm text-muted-foreground font-mono">
                            SKU: {item.product.sku}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.quantityOrdered).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.quantityReceived).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMoney(parseFloat(item.unitPrice), order.currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatMoney(parseFloat(item.lineTotal), order.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <StatusIcon className={`h-5 w-5 ${receiveStatus.color}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="card-premium border-cedar/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Send className="h-5 w-5 text-cedar" />
              Send to Supplier
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Mark this order as sent to supplier? This indicates the order has been communicated
              and is awaiting delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
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

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <XCircle className="h-5 w-5 text-terracotta" />
              Cancel Purchase Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to cancel this order? This action will mark the order as
              cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
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

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-terracotta" />
              Delete Purchase Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
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

      {/* Convert to Invoice Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="card-premium border-gold/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" />
              Create Bill from Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a purchase invoice (bill) from this order? This will generate an invoice
              based on the received goods.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConvertDialog(false)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending}
              className="btn-gold"
            >
              {convertMutation.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Goods Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="card-premium border-gold/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Package className="h-5 w-5 text-gold" />
              Receive Goods
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the quantities received for each item. This will update your inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-cedar/5 hover:bg-cedar/5">
                  <TableHead className="text-cedar font-semibold">Item</TableHead>
                  <TableHead className="text-right text-cedar font-semibold">Ordered</TableHead>
                  <TableHead className="text-right text-cedar font-semibold">
                    Already Received
                  </TableHead>
                  <TableHead className="text-right text-cedar font-semibold">
                    Receive Now
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => {
                  const ordered = parseFloat(item.quantityOrdered);
                  const received = parseFloat(item.quantityReceived);
                  const remaining = ordered - received;

                  return (
                    <TableRow key={item.id} className="hover:bg-gold/5">
                      <TableCell>
                        <div className="font-medium">{item.description}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{ordered.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{received.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={remaining}
                            value={receiveQuantities[item.id] || '0'}
                            onChange={(e) =>
                              setReceiveQuantities({
                                ...receiveQuantities,
                                [item.id]: e.target.value,
                              })
                            }
                            className="w-24 text-right font-mono border-cedar/20 focus:border-gold focus:ring-gold/20"
                            disabled={remaining <= 0}
                          />
                          {remaining <= 0 && (
                            <CheckCircle2 className="h-4 w-4 text-sage" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReceiveDialog(false)}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReceive}
              disabled={receiveGoodsMutation.isPending}
              className="btn-gold"
            >
              {receiveGoodsMutation.isPending ? 'Receiving...' : 'Receive Goods'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
