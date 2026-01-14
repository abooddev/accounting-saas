'use client';

import Link from 'next/link';
import { usePayment } from '@/hooks/use-payments';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { formatMoney, PAYMENT_METHODS } from '@accounting/shared';

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: payment, isLoading } = usePayment(id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!payment) {
    return <div className="flex items-center justify-center h-64">Payment not found</div>;
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{payment.paymentNumber}</h1>
          <p className="text-muted-foreground">{getTypeLabel(payment.type)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{payment.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{getPaymentMethodLabel(payment.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-medium">{payment.reference || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exchange Rate</p>
                <p className="font-medium">{payment.exchangeRate} LBP/USD</p>
              </div>
              {payment.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{payment.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatMoney(parseFloat(payment.amount ?? '0'), payment.currency)}
            </div>
            {payment.currency === 'USD' && (
              <p className="text-muted-foreground mt-2">
                = {formatMoney(parseFloat(payment.amount ?? '0') * parseFloat(payment.exchangeRate ?? '1'), 'LBP')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {payment.contact && (
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{payment.contact.name}</p>
              {payment.contact.nameAr && (
                <p className="text-muted-foreground" dir="rtl">{payment.contact.nameAr}</p>
              )}
            </CardContent>
          </Card>
        )}

        {payment.account && (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{payment.account.name}</p>
              <Badge variant="outline" className="mt-1">
                {payment.account.type === 'cash' ? 'Cash' : 'Bank'} - {payment.account.currency}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
