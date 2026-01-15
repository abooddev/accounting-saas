'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useSalesOrder,
  useConfirmSalesOrder,
  useCancelSalesOrder,
  useDeliverSalesOrder,
  useConvertSalesOrderToInvoice,
} from '@/hooks/use-sales-orders';
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
  CheckCircle,
  XCircle,
  FileText,
  Truck,
  Package,
  User,
  Calendar,
  DollarSign,
  ShoppingCart,
  Pencil,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { SalesOrderItem } from '@/lib/api/sales-orders';

const SALES_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-stone/10 text-stone border-stone/20' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-cedar/10 text-cedar border-cedar/20' },
  { value: 'partial', label: 'Partially Delivered', color: 'bg-gold/10 text-gold border-gold/20' },
  { value: 'fulfilled', label: 'Fulfilled', color: 'bg-sage/10 text-sage border-sage/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-terracotta/10 text-terracotta border-terracotta/20' },
];

interface DeliveryQuantity {
  itemId: string;
  quantity: string;
  maxQuantity: number;
}

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDeliveryModal = searchParams.get('deliver') === 'true';

  const { data: salesOrder, isLoading } = useSalesOrder(id);
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const deliverMutation = useDeliverSalesOrder();
  const invoiceMutation = useConvertSalesOrderToInvoice();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(showDeliveryModal);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [deliveryQuantities, setDeliveryQuantities] = useState<DeliveryQuantity[]>([]);

  const initializeDeliveryQuantities = () => {
    if (salesOrder?.items) {
      const quantities = salesOrder.items.map(item => ({
        itemId: item.id,
        quantity: '',
        maxQuantity: parseFloat(item.quantityOrdered) - parseFloat(item.quantityDelivered),
      }));
      setDeliveryQuantities(quantities);
    }
  };

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync(id);
    setShowConfirmDialog(false);
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(id);
    setShowCancelDialog(false);
  };

  const handleDelivery = async () => {
    const items = deliveryQuantities
      .filter(dq => parseFloat(dq.quantity) > 0)
      .map(dq => ({
        itemId: dq.itemId,
        quantityDelivered: parseFloat(dq.quantity),
      }));

    if (items.length === 0) {
      return;
    }

    await deliverMutation.mutateAsync({ id, items });
    setShowDeliveryDialog(false);
    router.replace(`/sales-orders/${id}`);
  };

  const handleConvertToInvoice = async () => {
    const result = await invoiceMutation.mutateAsync(id);
    setShowInvoiceDialog(false);
    router.push(`/invoices/${result.invoiceId}`);
  };

  const updateDeliveryQuantity = (itemId: string, quantity: string) => {
    setDeliveryQuantities(prev =>
      prev.map(dq =>
        dq.itemId === itemId ? { ...dq, quantity } : dq
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = SALES_ORDER_STATUSES.find(s => s.value === status);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo?.color || 'bg-muted text-muted-foreground'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const getItemDeliveryStatus = (item: SalesOrderItem) => {
    const ordered = parseFloat(item.quantityOrdered);
    const delivered = parseFloat(item.quantityDelivered);
    const percentage = Math.round((delivered / ordered) * 100);

    return (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${percentage === 100 ? 'bg-sage' : percentage > 0 ? 'bg-gold' : 'bg-muted'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[80px]">
          {delivered} / {ordered}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedar"></div>
          <span className="text-muted-foreground">Loading sales order...</span>
        </div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
          <span className="text-muted-foreground">Sales order not found</span>
          <Link href="/sales-orders">
            <Button className="btn-cedar mt-2">Back to Sales Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = SALES_ORDER_STATUSES.find(s => s.value === salesOrder.status);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales-orders">
            <Button variant="ghost" size="icon" className="hover:bg-cedar/10 hover:text-cedar">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cedar/10">
              <ShoppingCart className="h-6 w-6 text-cedar" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-cedar">{salesOrder.number}</h1>
              <p className="text-sm text-muted-foreground">Sales Order</p>
            </div>
          </div>
          {getStatusBadge(salesOrder.status)}
        </div>

        <div className="flex gap-2">
          {salesOrder.status === 'draft' && (
            <>
              <Link href={`/sales-orders/${id}?edit=true`}>
                <Button variant="outline" className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setShowConfirmDialog(true)} className="btn-cedar">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Order
              </Button>
            </>
          )}
          {(salesOrder.status === 'confirmed' || salesOrder.status === 'partial') && (
            <Button
              onClick={() => {
                initializeDeliveryQuantities();
                setShowDeliveryDialog(true);
              }}
              className="btn-gold"
            >
              <Truck className="h-4 w-4 mr-2" />
              Record Delivery
            </Button>
          )}
          {(salesOrder.status === 'confirmed' || salesOrder.status === 'partial' || salesOrder.status === 'fulfilled') && (
            <Button
              onClick={() => setShowInvoiceDialog(true)}
              className="bg-sage hover:bg-sage/90 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
          {['draft', 'confirmed', 'partial'].includes(salesOrder.status) && (
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              className="border-terracotta/20 hover:bg-terracotta/5 hover:text-terracotta"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="card-premium col-span-2">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="font-display text-lg text-cedar flex items-center gap-2">
              <Package className="h-5 w-5 text-gold" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-cedar mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium text-cedar">{salesOrder.customer?.name || '-'}</p>
                    {salesOrder.customer?.nameAr && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{salesOrder.customer.nameAr}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-cedar mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{salesOrder.date}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-gold mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">{salesOrder.expectedDeliveryDate || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-sage mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Exchange Rate</p>
                    <p className="font-medium">{parseFloat(salesOrder.exchangeRate).toLocaleString()} LBP/USD</p>
                  </div>
                </div>
              </div>
              {salesOrder.notes && (
                <div className="col-span-2 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-muted-foreground">{salesOrder.notes}</p>
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">
                {formatMoney(parseFloat(salesOrder.subtotal ?? '0'), salesOrder.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-mono text-terracotta">
                -{formatMoney(parseFloat(salesOrder.discountAmount ?? '0'), salesOrder.currency)}
              </span>
            </div>
            {parseFloat(salesOrder.taxAmount ?? '0') > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">
                  {formatMoney(parseFloat(salesOrder.taxAmount ?? '0'), salesOrder.currency)}
                </span>
              </div>
            )}
            <div className="border-t border-border/50 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-cedar">Total</span>
                <span className="font-mono text-cedar">
                  {formatMoney(parseFloat(salesOrder.total ?? '0'), salesOrder.currency)}
                </span>
              </div>
            </div>
            {salesOrder.currency === 'USD' && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total (LBP)</span>
                <span className="font-mono">
                  {formatMoney(
                    parseFloat(salesOrder.total ?? '0') * parseFloat(salesOrder.exchangeRate),
                    'LBP'
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items Card */}
      <Card className="card-premium">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="font-display text-lg text-cedar flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-warm">
            <TableHeader>
              <TableRow className="bg-cedar/5 hover:bg-cedar/5">
                <TableHead className="text-cedar font-semibold">Description</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Qty Ordered</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Unit Price</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Discount</TableHead>
                <TableHead className="text-right text-cedar font-semibold">Total</TableHead>
                <TableHead className="text-cedar font-semibold">Delivery Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrder.items?.map((item) => (
                <TableRow key={item.id} className="hover:bg-gold/5">
                  <TableCell>
                    <div className="font-medium text-cedar">{item.description}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {parseFloat(item.quantityOrdered)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(parseFloat(item.unitPrice ?? '0'), salesOrder.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {parseFloat(item.discountPercent ?? '0')}%
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-cedar">
                    {formatMoney(parseFloat(item.lineTotal ?? '0'), salesOrder.currency)}
                  </TableCell>
                  <TableCell>{getItemDeliveryStatus(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="card-premium border-cedar/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-cedar" />
              Confirm Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confirming this order will verify stock availability. Once confirmed, the order cannot be edited directly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
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
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="card-premium border-terracotta/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <XCircle className="h-5 w-5 text-terracotta" />
              Cancel Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cancelling this order will reverse any stock changes from deliveries. This action cannot be undone.
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
              disabled={cancelMutation.isPending}
              className="bg-terracotta hover:bg-terracotta/90 text-white"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={(open) => {
        setShowDeliveryDialog(open);
        if (!open) router.replace(`/sales-orders/${id}`);
      }}>
        <DialogContent className="card-premium border-gold/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <Truck className="h-5 w-5 text-gold" />
              Record Delivery
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the quantity delivered for each item. Leave blank or zero for items not being delivered.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-cedar/5">
                  <TableHead className="text-cedar">Item</TableHead>
                  <TableHead className="text-right text-cedar">Ordered</TableHead>
                  <TableHead className="text-right text-cedar">Already Delivered</TableHead>
                  <TableHead className="text-right text-cedar">Remaining</TableHead>
                  <TableHead className="text-right text-cedar">Deliver Now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrder.items?.map((item) => {
                  const ordered = parseFloat(item.quantityOrdered);
                  const delivered = parseFloat(item.quantityDelivered);
                  const remaining = ordered - delivered;
                  const deliveryQty = deliveryQuantities.find(dq => dq.itemId === item.id);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right font-mono">{ordered}</TableCell>
                      <TableCell className="text-right font-mono text-sage">{delivered}</TableCell>
                      <TableCell className="text-right font-mono text-gold">{remaining}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          step="0.001"
                          value={deliveryQty?.quantity || ''}
                          onChange={(e) => updateDeliveryQuantity(item.id, e.target.value)}
                          className="w-24 ml-auto border-cedar/20 focus:border-cedar focus:ring-cedar/20"
                          placeholder="0"
                          disabled={remaining <= 0}
                        />
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
              onClick={() => {
                setShowDeliveryDialog(false);
                router.replace(`/sales-orders/${id}`);
              }}
              className="border-cedar/20 hover:bg-cedar/5 hover:text-cedar"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelivery}
              disabled={deliverMutation.isPending || deliveryQuantities.every(dq => !dq.quantity || parseFloat(dq.quantity) <= 0)}
              className="btn-gold"
            >
              {deliverMutation.isPending ? 'Recording...' : 'Record Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="card-premium border-sage/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-cedar flex items-center gap-2">
              <FileText className="h-5 w-5 text-sage" />
              Create Invoice from Sales Order
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will create a new sales invoice from this order. You will be redirected to the new invoice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
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
