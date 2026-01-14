'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfitLoss } from '@/hooks/use-reports';
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
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ProfitLossPage() {
  const defaultRange = getDateRange('this_month');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const { data: report, isLoading } = useProfitLoss({ startDate, endDate });

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

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
            <h1 className="text-2xl font-bold">Profit & Loss</h1>
            <p className="text-muted-foreground">
              Financial performance for the selected period
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
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(report.revenue.total, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cost of Goods Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatMoney(report.costOfGoodsSold.total, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gross Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(report.grossProfit, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Net Profit
                  {report.netProfit > 0 && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {report.netProfit < 0 && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {report.netProfit === 0 && <Minus className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(report.netProfit, report.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Sales</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.revenue.sales, report.currency)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Income</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.revenue.otherIncome, report.currency)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatMoney(report.revenue.total, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cost of Goods Sold */}
            <Card>
              <CardHeader>
                <CardTitle>Cost of Goods Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Purchases</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.costOfGoodsSold.purchases, report.currency)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total COGS</TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatMoney(report.costOfGoodsSold.total, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {report.expenses.byCategory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No expenses in this period</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Amount (USD)</TableHead>
                      <TableHead className="text-right">Amount (LBP)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.expenses.byCategory.map((expense) => (
                      <TableRow key={expense.category}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{expense.categoryLabel}</span>
                            {expense.categoryLabelAr && (
                              <span className="text-muted-foreground ml-2" dir="rtl">
                                ({expense.categoryLabelAr})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{expense.invoiceCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(expense.amount, 'USD')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatMoney(expense.amountLbp, 'LBP')}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Expenses</TableCell>
                      <TableCell />
                      <TableCell className="text-right text-red-600">
                        {formatMoney(report.expenses.total, report.currency)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Gross Profit</TableCell>
                    <TableCell className={`text-right font-medium ${report.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(report.grossProfit, report.currency)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Less: Operating Expenses</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      ({formatMoney(report.expenses.total, report.currency)})
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t-2 text-lg">
                    <TableCell>Net Profit</TableCell>
                    <TableCell className={`text-right ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(report.netProfit, report.currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
