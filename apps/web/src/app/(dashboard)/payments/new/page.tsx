'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreatePayment } from '@/hooks/use-payments';
import { useAccounts } from '@/hooks/use-accounts';
import { useContacts } from '@/hooks/use-contacts';
import { useInvoice, useInvoices } from '@/hooks/use-invoices';
import { useCurrentExchangeRate } from '@/hooks/use-exchange-rates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, PAYMENT_METHODS } from '@accounting/shared';

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');

  const createMutation = useCreatePayment();

  const { data: accounts } = useAccounts();
  const { data: contacts } = useContacts({ type: 'supplier' });
  const { data: exchangeRate } = useCurrentExchangeRate();
  const { data: invoices } = useInvoices({ status: 'pending' });
  const { data: preselectedInvoice } = useInvoice(invoiceIdParam || '');

  const [formData, setFormData] = useState({
    type: 'supplier_payment' as 'supplier_payment' | 'expense_payment' | 'customer_receipt',
    contactId: '',
    invoiceId: invoiceIdParam || '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'USD',
    exchangeRate: exchangeRate?.rate?.toString() || '89500',
    paymentMethod: 'cash',
    reference: '',
    notes: '',
  });

  // Pre-fill from invoice if provided
  useEffect(() => {
    if (preselectedInvoice) {
      setFormData(prev => ({
        ...prev,
        contactId: preselectedInvoice.contactId || '',
        currency: preselectedInvoice.currency,
        amount: preselectedInvoice.balance || '',
      }));
    }
  }, [preselectedInvoice]);

  // Update exchange rate when loaded
  useEffect(() => {
    if (exchangeRate?.rate) {
      setFormData(prev => ({ ...prev, exchangeRate: exchangeRate.rate.toString() }));
    }
  }, [exchangeRate]);

  const selectedAccount = accounts?.find(a => a.id === formData.accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createMutation.mutateAsync({
      type: formData.type,
      contactId: formData.contactId || undefined,
      invoiceId: formData.invoiceId || undefined,
      accountId: formData.accountId,
      date: formData.date,
      amount: parseFloat(formData.amount),
      currency: formData.currency as 'USD' | 'LBP',
      exchangeRate: parseFloat(formData.exchangeRate),
      paymentMethod: formData.paymentMethod as any,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
    });

    router.push('/payments');
  };

  // Filter invoices for selected contact
  const contactInvoices = invoices?.filter(inv =>
    (!formData.contactId || inv.contactId === formData.contactId) &&
    ['pending', 'partial'].includes(inv.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">New Payment</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                      <SelectItem value="expense_payment">Expense Payment</SelectItem>
                      <SelectItem value="customer_receipt">Customer Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier/Contact</Label>
                  <Select
                    value={formData.contactId}
                    onValueChange={(v) => setFormData({ ...formData, contactId: v, invoiceId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Invoice (Optional)</Label>
                  <Select
                    value={formData.invoiceId}
                    onValueChange={(v) => {
                      const invoice = contactInvoices?.find(inv => inv.id === v);
                      setFormData({
                        ...formData,
                        invoiceId: v,
                        currency: invoice?.currency || formData.currency,
                        amount: invoice?.balance || formData.amount,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactInvoices?.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.internalNumber} - Balance: {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pay From Account</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(v) => {
                    const account = accounts?.find(a => a.id === v);
                    setFormData({ ...formData, accountId: v, currency: account?.currency || formData.currency });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({formatMoney(parseFloat(account.currentBalance ?? '0'), account.currency)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="LBP">LBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input
                    type="number"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference (Check #, Transfer ID, etc.)</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="Optional reference"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAccount && (
                <div>
                  <p className="text-sm text-muted-foreground">Account Balance</p>
                  <p className="text-lg font-medium">
                    {formatMoney(parseFloat(selectedAccount.currentBalance ?? '0'), selectedAccount.currency)}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Payment Amount</p>
                <p className="text-2xl font-bold">
                  {formData.amount ? formatMoney(parseFloat(formData.amount), formData.currency) : '-'}
                </p>
              </div>

              {selectedAccount && formData.amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Balance After</p>
                  <p className="text-lg font-medium">
                    {formatMoney(
                      parseFloat(selectedAccount.currentBalance ?? '0') - parseFloat(formData.amount),
                      selectedAccount.currency
                    )}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
