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
  Package,
  PackageX,
  TrendingUp,
  Users,
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
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold text-cedar">
          Welcome back, {user?.name}
        </h1>
        <p className="text-cedar/70 mt-1">
          Here&apos;s an overview of {tenant?.name}
        </p>
      </div>

      {/* Cash Position & Payables Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <Card className="card-premium border-l-4 border-l-sage">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Cash (USD)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-sage" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sage">
                {formatMoney(summary?.cashPosition.usd ?? 0, 'USD')}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Card className="card-premium border-l-4 border-l-gold">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Cash (LBP)
              </CardTitle>
              <Banknote className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">
                {formatMoney(summary?.cashPosition.lbp ?? 0, 'LBP')}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '150ms' }}>
          <Card className="card-premium border-l-4 border-l-cedar">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Total Payables
              </CardTitle>
              <FileText className="h-4 w-4 text-cedar" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cedar">
                {formatMoney(summary?.payables.total ?? 0, 'USD')}
              </div>
              <p className="text-xs text-cedar/60">
                {summary?.payables.count ?? 0} invoices
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Card className="card-premium border-l-4 border-l-terracotta">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Overdue
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-terracotta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-terracotta">
                {formatMoney(summary?.payables.overdue ?? 0, 'USD')}
              </div>
              <p className="text-xs text-cedar/60">
                {summary?.payables.overdueCount ?? 0} invoices
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Due This Week & Top Payables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Due This Week */}
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg text-cedar">Due This Week</CardTitle>
                <CardDescription className="text-cedar/60">Invoices due in the next 7 days</CardDescription>
              </div>
              <Clock className="h-5 w-5 text-gold" />
            </CardHeader>
            <CardContent>
              {dueThisWeek?.length === 0 ? (
                <p className="text-cedar/60 text-center py-4">No invoices due this week</p>
              ) : (
                <div className="space-y-3">
                  {dueThisWeek?.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-cedar/5 transition-colors">
                      <div>
                        <p className="font-medium text-cedar">{invoice.internalNumber}</p>
                        <p className="text-sm text-cedar/60">{invoice.contactName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-cedar">
                          {formatMoney(parseFloat(invoice.balance ?? '0'), invoice.currency)}
                        </p>
                        <p className="text-sm text-cedar/60">{invoice.dueDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Supplier Payables */}
        <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg text-cedar">Top Payables</CardTitle>
                <CardDescription className="text-cedar/60">Suppliers with highest balances</CardDescription>
              </div>
              <Link href="/contacts">
                <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80 hover:bg-gold/10">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {payables?.length === 0 ? (
                <p className="text-cedar/60 text-center py-4">No outstanding payables</p>
              ) : (
                <div className="space-y-3">
                  {payables?.slice(0, 5).map((supplier) => (
                    <div key={supplier.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-cedar/5 transition-colors">
                      <div>
                        <p className="font-medium text-cedar">{supplier.name}</p>
                        {supplier.nameAr && (
                          <p className="text-sm text-cedar/60" dir="rtl">{supplier.nameAr}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {supplier.balanceUsd > 0 && (
                          <p className="font-medium text-cedar">{formatMoney(supplier.balanceUsd, 'USD')}</p>
                        )}
                        {supplier.balanceLbp > 0 && (
                          <p className="text-sm text-cedar/60">
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
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Invoices */}
        <div className="animate-slide-up" style={{ animationDelay: '350ms' }}>
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg text-cedar">Recent Invoices</CardTitle>
                <CardDescription className="text-cedar/60">Latest invoice activity</CardDescription>
              </div>
              <Link href="/invoices">
                <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80 hover:bg-gold/10">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity?.invoices.length === 0 ? (
                <p className="text-cedar/60 text-center py-4">No recent invoices</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-cedar/10">
                      <TableHead className="text-cedar/70">Number</TableHead>
                      <TableHead className="text-cedar/70">Date</TableHead>
                      <TableHead className="text-right text-cedar/70">Total</TableHead>
                      <TableHead className="text-cedar/70">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity?.invoices.slice(0, 5).map((invoice) => (
                      <TableRow key={invoice.id} className="border-cedar/10 hover:bg-cedar/5">
                        <TableCell className="font-medium text-cedar">{invoice.internalNumber}</TableCell>
                        <TableCell className="text-cedar/80">{invoice.date}</TableCell>
                        <TableCell className="text-right text-cedar">
                          {formatMoney(parseFloat(invoice.total), invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <span className={
                            invoice.status === 'paid'
                              ? 'badge-success'
                              : invoice.status === 'overdue'
                                ? 'badge-danger'
                                : 'badge-warning'
                          }>
                            {invoice.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Card className="card-premium">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg text-cedar">Recent Payments</CardTitle>
                <CardDescription className="text-cedar/60">Latest payment activity</CardDescription>
              </div>
              <Link href="/payments">
                <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80 hover:bg-gold/10">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity?.payments.length === 0 ? (
                <p className="text-cedar/60 text-center py-4">No recent payments</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-cedar/10">
                      <TableHead className="text-cedar/70">Number</TableHead>
                      <TableHead className="text-cedar/70">Date</TableHead>
                      <TableHead className="text-cedar/70">Contact</TableHead>
                      <TableHead className="text-right text-cedar/70">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity?.payments.slice(0, 5).map((payment) => (
                      <TableRow key={payment.id} className="border-cedar/10 hover:bg-cedar/5">
                        <TableCell className="font-medium text-cedar">{payment.paymentNumber}</TableCell>
                        <TableCell className="text-cedar/80">{payment.date}</TableCell>
                        <TableCell className="text-cedar/80">{payment.contactName || '-'}</TableCell>
                        <TableCell className="text-right text-cedar">
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
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '450ms' }}>
          <Card className="card-premium border-l-4 border-l-cedar">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-cedar" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cedar">{products?.length ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '500ms' }}>
          <Card className={`card-premium border-l-4 ${(lowStockProducts?.length ?? 0) > 0 ? 'border-l-terracotta' : 'border-l-sage'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cedar/70">
                Low Stock Items
              </CardTitle>
              {(lowStockProducts?.length ?? 0) > 0 ? (
                <PackageX className="h-4 w-4 text-terracotta" />
              ) : (
                <Package className="h-4 w-4 text-sage" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(lowStockProducts?.length ?? 0) > 0 ? 'text-terracotta' : 'text-sage'}`}>
                {lowStockProducts?.length ?? 0}
              </div>
              {(lowStockProducts?.length ?? 0) > 0 && (
                <span className="badge-warning text-xs mt-1 inline-block">Needs attention</span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
