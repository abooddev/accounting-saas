'use client';

import Link from 'next/link';
import { usePaymentsDue } from '@/hooks/use-reports';
import { formatMoney } from '@accounting/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, AlertTriangle, Clock, CalendarDays, ExternalLink } from 'lucide-react';

export default function PaymentsDuePage() {
  const { data: report, isLoading } = usePaymentsDue();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Payments Due</h1>
            <p className="text-muted-foreground">
              Upcoming and overdue invoice payments
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report && report.totals ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatMoney(report.totals.overdueAmount, 'USD')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.overdue.length} invoice{report.overdue.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Due This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatMoney(report.totals.dueThisWeekAmount, 'USD')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.dueThisWeek.length} invoice{report.dueThisWeek.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatMoney(report.totals.upcomingAmount, 'USD')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.upcoming.length} invoice{report.upcoming.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(report.totals.totalDue, 'USD')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {report.overdue.length + report.dueThisWeek.length + report.upcoming.length} invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Invoices */}
          {report.overdue.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue
                </CardTitle>
                <CardDescription>Invoices past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.overdue.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.internalNumber}</TableCell>
                        <TableCell>
                          {invoice.supplier.name || '-'}
                          {invoice.supplier.nameAr && (
                            <span className="text-muted-foreground ml-1" dir="rtl">
                              ({invoice.supplier.nameAr})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="text-red-600">{invoice.dueDate}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(invoice.balance, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{invoice.daysOverdue} days</Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Due This Week */}
          {report.dueThisWeek.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  Due This Week
                </CardTitle>
                <CardDescription>Invoices due within 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.dueThisWeek.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.internalNumber}</TableCell>
                        <TableCell>
                          {invoice.supplier.name || '-'}
                          {invoice.supplier.nameAr && (
                            <span className="text-muted-foreground ml-1" dir="rtl">
                              ({invoice.supplier.nameAr})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="text-orange-600 font-medium">{invoice.dueDate}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(invoice.balance, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          {report.upcoming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <CalendarDays className="h-5 w-5" />
                  Upcoming
                </CardTitle>
                <CardDescription>Invoices due after this week</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.upcoming.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.internalNumber}</TableCell>
                        <TableCell>
                          {invoice.supplier.name || '-'}
                          {invoice.supplier.nameAr && (
                            <span className="text-muted-foreground ml-1" dir="rtl">
                              ({invoice.supplier.nameAr})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(invoice.balance, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* No Invoices */}
          {report.overdue.length === 0 && report.dueThisWeek.length === 0 && report.upcoming.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  No outstanding invoices
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
