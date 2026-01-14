'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useExpensesByCategory } from '@/hooks/use-reports';
import { getDateRange } from '@accounting/shared';
import { formatMoney } from '@accounting/shared';
import { DateRangePicker } from '@/components/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';

export default function ExpensesPage() {
  const defaultRange = getDateRange('this_month');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const { data: report, isLoading } = useExpensesByCategory({ startDate, endDate });

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Calculate max percentage for visual bar
  const maxPercentage = report?.categories.reduce((max, c) => Math.max(max, c.percentage), 0) || 100;

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
            <h1 className="text-2xl font-bold">Expenses by Category</h1>
            <p className="text-muted-foreground">
              Analyze spending patterns by expense category
            </p>
          </div>
        </div>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatMoney(report.totals.amount, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses (LBP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  {formatMoney(report.totals.amountLbp, 'LBP')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.totals.invoiceCount}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {report.categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No expenses in this period
                </p>
              ) : (
                <div className="space-y-4">
                  {report.categories.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{category.categoryLabel}</span>
                          {category.categoryLabelAr && (
                            <span className="text-muted-foreground ml-2" dir="rtl">
                              ({category.categoryLabelAr})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatMoney(category.amount, 'USD')}</span>
                          <span className="text-muted-foreground ml-2">
                            ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(category.percentage / maxPercentage) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.invoiceCount} invoice{category.invoiceCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed View</CardTitle>
            </CardHeader>
            <CardContent>
              {report.categories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No expenses in this period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Amount (USD)</TableHead>
                      <TableHead className="text-right">Amount (LBP)</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.categories.map((category) => (
                      <TableRow key={category.category}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{category.categoryLabel}</span>
                            {category.categoryLabelAr && (
                              <span className="text-muted-foreground ml-2" dir="rtl">
                                ({category.categoryLabelAr})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {category.invoiceCount}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(category.amount, 'USD')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatMoney(category.amountLbp, 'LBP')}
                        </TableCell>
                        <TableCell className="text-right">
                          {category.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {report.totals.invoiceCount}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatMoney(report.totals.amount, 'USD')}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMoney(report.totals.amountLbp, 'LBP')}
                      </TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
