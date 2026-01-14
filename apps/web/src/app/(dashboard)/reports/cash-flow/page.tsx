'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCashFlow } from '@/hooks/use-reports';
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
import { ArrowLeft, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function CashFlowPage() {
  const defaultRange = getDateRange('this_month');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const { data: report, isLoading } = useCashFlow({ startDate, endDate });

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
            <h1 className="text-2xl font-bold">Cash Flow</h1>
            <p className="text-muted-foreground">
              Track money in and out of your accounts
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Opening Balance (USD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(report.openingBalances.usd, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                  Money In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(report.moneyIn.total, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  Money Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatMoney(report.moneyOut.total, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Net Cash Flow
                  {report.netCashFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(report.netCashFlow, 'USD')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Statement */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Money In */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ArrowDownRight className="h-5 w-5" />
                  Money In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Customer Payments</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.moneyIn.customerPayments, 'USD')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Other Income</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.moneyIn.otherIncome, 'USD')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Money In</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatMoney(report.moneyIn.total, 'USD')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Money Out */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <ArrowUpRight className="h-5 w-5" />
                  Money Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Supplier Payments</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.moneyOut.supplierPayments, 'USD')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Expense Payments</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.moneyOut.expensePayments, 'USD')}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total Money Out</TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatMoney(report.moneyOut.total, 'USD')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow by Account */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow by Account</CardTitle>
            </CardHeader>
            <CardContent>
              {report.byAccount.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No account activity in this period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Opening</TableHead>
                      <TableHead className="text-right">Money In</TableHead>
                      <TableHead className="text-right">Money Out</TableHead>
                      <TableHead className="text-right">Closing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byAccount.map((account) => (
                      <TableRow key={account.accountId}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell>{account.currency}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(account.opening, account.currency)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatMoney(account.totalIn, account.currency)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatMoney(account.totalOut, account.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(account.closing, account.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Closing Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Closing Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">USD Balance</p>
                  <p className="text-2xl font-bold">
                    {formatMoney(report.closingBalances.usd, 'USD')}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">LBP Balance</p>
                  <p className="text-2xl font-bold">
                    {formatMoney(report.closingBalances.lbp, 'LBP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
