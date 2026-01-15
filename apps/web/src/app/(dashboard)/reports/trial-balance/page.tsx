'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTrialBalance } from '@/hooks/use-reports';
import { formatMoney } from '@accounting/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { exportTrialBalanceToExcel } from '@/lib/excel';

export default function TrialBalancePage() {
  const today = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(today);

  const { data: report, isLoading } = useTrialBalance(asOfDate);

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'liability':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'revenue':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expense':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'equity':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

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
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <p className="text-muted-foreground">
              All accounts with their debit and credit balances
            </p>
          </div>
        </div>
        {report && (
          <Button
            variant="outline"
            onClick={() => exportTrialBalanceToExcel(report)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        )}
      </div>

      {/* Date Picker */}
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>As of Date</Label>
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Debits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatMoney(report.totals.debit, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatMoney(report.totals.credit, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Difference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${report.totals.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatMoney(report.totals.difference, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Balance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.totals.isBalanced ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-xl font-bold">Balanced</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xl font-bold">Unbalanced</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary by Account Type */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {formatMoney(report.summary.assets, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Liabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                  {formatMoney(report.summary.liabilities, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-900 dark:text-green-100">
                  {formatMoney(report.summary.revenue, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-900 dark:text-red-100">
                  {formatMoney(report.summary.expenses, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Net Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${report.summary.netIncome >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {formatMoney(report.summary.netIncome, report.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trial Balance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Account Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {report.entries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No account balances found for this date
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{entry.accountName}</span>
                            {entry.accountNameAr && (
                              <span className="text-muted-foreground ml-2 text-sm" dir="rtl">
                                ({entry.accountNameAr})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getAccountTypeColor(entry.accountType)}>
                            {capitalizeFirst(entry.accountType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.category}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.currency}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {entry.debit > 0 ? formatMoney(entry.debit, entry.currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {entry.credit > 0 ? formatMoney(entry.credit, entry.currency) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="font-bold border-t-2 bg-muted/50">
                      <TableCell colSpan={4}>
                        <span className="text-lg">Total</span>
                      </TableCell>
                      <TableCell className="text-right text-lg text-amber-700">
                        {formatMoney(report.totals.debit, report.currency)}
                      </TableCell>
                      <TableCell className="text-right text-lg text-emerald-700">
                        {formatMoney(report.totals.credit, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Accounting Equation */}
          <Card>
            <CardHeader>
              <CardTitle>Accounting Equation Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Assets</p>
                  <p className="text-2xl font-bold">
                    {formatMoney(report.summary.assets, report.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  =
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Liabilities + Equity</p>
                  <p className="text-2xl font-bold">
                    {formatMoney(report.summary.liabilities + (report.summary.revenue - report.summary.expenses), report.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({formatMoney(report.summary.liabilities, report.currency)} + {formatMoney(report.summary.revenue - report.summary.expenses, report.currency)})
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
