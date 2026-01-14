'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useContacts } from '@/hooks/use-contacts';
import { useProducts } from '@/hooks/use-products';
import {
  useDashboardSummary,
  useSupplierPayables,
  useRecentActivity,
  useDueThisWeek,
} from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Banknote,
  AlertTriangle,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { formatMoney } from '@accounting/shared';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { data: products } = useProducts();
  const { data: lowStockProducts } = useProducts({ lowStock: true });
  const { data: summary } = useDashboardSummary();
  const { data: payables } = useSupplierPayables();
  const { data: recentActivity } = useRecentActivity();
  const { data: dueThisWeek } = useDueThisWeek();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of {tenant?.name}
        </p>
      </div>

      {/* Cash Position & Payables Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash (USD)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary?.cashPosition.usd ?? 0, 'USD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash (LBP)
            </CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatMoney(summary?.cashPosition.lbp ?? 0, 'LBP')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payables
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(summary?.payables.total ?? 0, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.payables.count ?? 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMoney(summary?.payables.overdue ?? 0, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.payables.overdueCount ?? 0} invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Due This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Due This Week</CardTitle>
              <CardDescription>Invoices due in the next 7 days</CardDescription>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dueThisWeek?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No invoices due this week</p>
            ) : (
              <div className="space-y-3">
                {dueThisWeek?.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invoice.internalNumber}</p>
                      <p className="text-sm text-muted-foreground">{invoice.contactName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">{invoice.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Supplier Payables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Payables</CardTitle>
              <CardDescription>Suppliers with highest balances</CardDescription>
            </div>
            <Link href="/contacts">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {payables?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No outstanding payables</p>
            ) : (
              <div className="space-y-3">
                {payables?.slice(0, 5).map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.nameAr && (
                        <p className="text-sm text-muted-foreground" dir="rtl">{supplier.nameAr}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {supplier.balanceUsd > 0 && (
                        <p className="font-medium">{formatMoney(supplier.balanceUsd, 'USD')}</p>
                      )}
                      {supplier.balanceLbp > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {formatMoney(supplier.balanceLbp, 'LBP')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoice activity</CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity?.invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent invoices</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity?.invoices.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.internalNumber}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(parseFloat(invoice.total), invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment activity</CardDescription>
            </div>
            <Link href="/payments">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity?.payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent payments</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity?.payments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>{payment.contactName || '-'}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(parseFloat(payment.amount), payment.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            {(lowStockProducts?.length ?? 0) > 0 && (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(lowStockProducts?.length ?? 0) > 0 ? 'text-orange-600' : ''}`}>
              {lowStockProducts?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
