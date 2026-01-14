'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePayments, useVoidPayment } from '@/hooks/use-payments';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { formatMoney, PAYMENT_METHODS } from '@accounting/shared';
import type { Payment } from '@accounting/shared';

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [voidPayment, setVoidPayment] = useState<Payment | null>(null);

  const { data: payments, isLoading } = usePayments({
    type: typeFilter === 'all' ? undefined : typeFilter as any,
  });

  const voidMutation = useVoidPayment();

  const handleVoid = async () => {
    if (voidPayment) {
      await voidMutation.mutateAsync(voidPayment.id);
      setVoidPayment(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      supplier_payment: 'Supplier Payment',
      expense_payment: 'Expense Payment',
      customer_receipt: 'Customer Receipt',
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodInfo = PAYMENT_METHODS.find(m => m.value === method);
    return methodInfo?.label || method;
  };

  const filteredPayments = payments?.filter(payment => {
    if (!search) return true;
    return payment.paymentNumber?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link href="/payments/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
            <SelectItem value="expense_payment">Expense Payment</SelectItem>
            <SelectItem value="customer_receipt">Customer Receipt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reference</TableHead>
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
            ) : filteredPayments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(payment.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(parseFloat(payment.amount ?? '0'), payment.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/payments/${payment.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setVoidPayment(payment)}
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

      {/* Void Confirmation */}
      <Dialog open={!!voidPayment} onOpenChange={() => setVoidPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to void payment &quot;{voidPayment?.paymentNumber}&quot;?
              This will reverse the account balance and invoice payment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidPayment(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={voidMutation.isPending}
            >
              {voidMutation.isPending ? 'Voiding...' : 'Void Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
