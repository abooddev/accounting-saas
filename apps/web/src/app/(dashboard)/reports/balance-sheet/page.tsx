'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBalanceSheet } from '@/hooks/use-reports';
import { formatMoney } from '@accounting/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Wallet,
  Package,
  Users,
  TrendingUp,
} from 'lucide-react';
import { exportBalanceSheetToExcel } from '@/lib/excel';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCashDetail, setShowCashDetail] = useState(false);
  const [showReceivablesDetail, setShowReceivablesDetail] = useState(false);
  const [showPayablesDetail, setShowPayablesDetail] = useState(false);

  const { data: report, isLoading } = useBalanceSheet(asOfDate);

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
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground">
              Financial position as of a specific date
            </p>
          </div>
        </div>
        {report && (
          <Button
            variant="outline"
            onClick={() => exportBalanceSheetToExcel(report)}
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
            className="w-[200px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Balance Status Banner */}
          <Card className={report.isBalanced ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}>
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                {report.isBalanced ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-700">Balance Sheet is Balanced</p>
                      <p className="text-sm text-muted-foreground">
                        Assets ({formatMoney(report.assets.totalAssets, report.currency)}) = Liabilities + Equity ({formatMoney(report.liabilities.totalLiabilities + report.equity.totalEquity, report.currency)})
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-700">Balance Sheet is Not Balanced</p>
                      <p className="text-sm text-muted-foreground">
                        There is a discrepancy in the accounting equation
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-[hsl(var(--cedar))] to-[hsl(var(--cedar-light))] text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(report.assets.totalAssets, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[hsl(var(--terracotta))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Liabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[hsl(var(--terracotta))]">
                  {formatMoney(report.liabilities.totalLiabilities, report.currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-light))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(var(--charcoal))] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Equity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[hsl(var(--charcoal))]">
                  {formatMoney(report.equity.totalEquity, report.currency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Sheet Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Assets Section */}
            <Card>
              <CardHeader className="bg-[hsl(var(--cedar))] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  ASSETS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    {/* Current Assets Header */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-semibold text-[hsl(var(--cedar))]">
                        Current Assets
                      </TableCell>
                    </TableRow>

                    {/* Cash and Bank */}
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setShowCashDetail(!showCashDetail)}
                    >
                      <TableCell className="flex items-center gap-2">
                        {showCashDetail ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Building2 className="h-4 w-4 text-[hsl(var(--sage))]" />
                        Cash and Bank
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.assets.currentAssets.cashAndBank, report.currency)}
                      </TableCell>
                    </TableRow>
                    {showCashDetail && report.detail.cashAndBankAccounts.map((acc) => (
                      <TableRow key={acc.id} className="bg-muted/20">
                        <TableCell className="pl-12 text-sm text-muted-foreground">
                          {acc.name} ({acc.currency})
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatMoney(acc.balance, acc.currency)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Accounts Receivable */}
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setShowReceivablesDetail(!showReceivablesDetail)}
                    >
                      <TableCell className="flex items-center gap-2">
                        {showReceivablesDetail ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Users className="h-4 w-4 text-[hsl(var(--sage))]" />
                        Accounts Receivable
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.assets.currentAssets.accountsReceivable, report.currency)}
                      </TableCell>
                    </TableRow>
                    {showReceivablesDetail && (
                      report.detail.accountsReceivableDetail.length === 0 ? (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={2} className="pl-12 text-sm text-muted-foreground italic">
                            No outstanding receivables
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.detail.accountsReceivableDetail.map((customer) => (
                          <TableRow key={customer.id} className="bg-muted/20">
                            <TableCell className="pl-12 text-sm text-muted-foreground">
                              {customer.name}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatMoney(customer.balance, report.currency)}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}

                    {/* Inventory */}
                    <TableRow>
                      <TableCell className="flex items-center gap-2 pl-6">
                        <Package className="h-4 w-4 text-[hsl(var(--sage))]" />
                        Inventory
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.assets.currentAssets.inventory, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Total Current Assets */}
                    <TableRow className="border-t-2 border-[hsl(var(--cedar))]">
                      <TableCell className="font-semibold">Total Current Assets</TableCell>
                      <TableCell className="text-right font-bold text-[hsl(var(--cedar))]">
                        {formatMoney(report.assets.currentAssets.totalCurrentAssets, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Total Assets */}
                    <TableRow className="bg-[hsl(var(--cedar))]/10">
                      <TableCell className="font-bold text-lg">TOTAL ASSETS</TableCell>
                      <TableCell className="text-right font-bold text-lg text-[hsl(var(--cedar))]">
                        {formatMoney(report.assets.totalAssets, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Liabilities & Equity Section */}
            <Card>
              <CardHeader className="bg-[hsl(var(--gold))] rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--charcoal))]">
                  <Users className="h-5 w-5" />
                  LIABILITIES & EQUITY
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Table>
                  <TableBody>
                    {/* Current Liabilities Header */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-semibold text-[hsl(var(--terracotta))]">
                        Current Liabilities
                      </TableCell>
                    </TableRow>

                    {/* Accounts Payable */}
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setShowPayablesDetail(!showPayablesDetail)}
                    >
                      <TableCell className="flex items-center gap-2">
                        {showPayablesDetail ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Users className="h-4 w-4 text-[hsl(var(--terracotta))]" />
                        Accounts Payable
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.liabilities.currentLiabilities.accountsPayable, report.currency)}
                      </TableCell>
                    </TableRow>
                    {showPayablesDetail && (
                      report.detail.accountsPayableDetail.length === 0 ? (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={2} className="pl-12 text-sm text-muted-foreground italic">
                            No outstanding payables
                          </TableCell>
                        </TableRow>
                      ) : (
                        report.detail.accountsPayableDetail.map((supplier) => (
                          <TableRow key={supplier.id} className="bg-muted/20">
                            <TableCell className="pl-12 text-sm text-muted-foreground">
                              {supplier.name}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatMoney(supplier.balance, report.currency)}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}

                    {/* Total Current Liabilities */}
                    <TableRow className="border-t-2 border-[hsl(var(--terracotta))]">
                      <TableCell className="font-semibold">Total Current Liabilities</TableCell>
                      <TableCell className="text-right font-bold text-[hsl(var(--terracotta))]">
                        {formatMoney(report.liabilities.currentLiabilities.totalCurrentLiabilities, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Total Liabilities */}
                    <TableRow className="bg-[hsl(var(--terracotta))]/10">
                      <TableCell className="font-bold">TOTAL LIABILITIES</TableCell>
                      <TableCell className="text-right font-bold text-[hsl(var(--terracotta))]">
                        {formatMoney(report.liabilities.totalLiabilities, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Spacer */}
                    <TableRow>
                      <TableCell colSpan={2} className="h-4"></TableCell>
                    </TableRow>

                    {/* Equity Header */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="font-semibold text-[hsl(var(--gold))]">
                        Equity
                      </TableCell>
                    </TableRow>

                    {/* Retained Earnings */}
                    <TableRow>
                      <TableCell className="flex items-center gap-2 pl-6">
                        <TrendingUp className="h-4 w-4 text-[hsl(var(--gold))]" />
                        Retained Earnings
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(report.equity.retainedEarnings, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Total Equity */}
                    <TableRow className="bg-[hsl(var(--gold))]/10">
                      <TableCell className="font-bold">TOTAL EQUITY</TableCell>
                      <TableCell className="text-right font-bold text-[hsl(var(--gold))]">
                        {formatMoney(report.equity.totalEquity, report.currency)}
                      </TableCell>
                    </TableRow>

                    {/* Spacer */}
                    <TableRow>
                      <TableCell colSpan={2} className="h-4"></TableCell>
                    </TableRow>

                    {/* Total Liabilities & Equity */}
                    <TableRow className="bg-[hsl(var(--cedar))]/10 border-t-2">
                      <TableCell className="font-bold text-lg">TOTAL LIABILITIES & EQUITY</TableCell>
                      <TableCell className="text-right font-bold text-lg text-[hsl(var(--cedar))]">
                        {formatMoney(report.liabilities.totalLiabilities + report.equity.totalEquity, report.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Accounting Equation Verification */}
          <Card>
            <CardHeader>
              <CardTitle>Accounting Equation Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div className="p-4 bg-[hsl(var(--cedar))]/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Assets</p>
                  <p className="text-2xl font-bold text-[hsl(var(--cedar))]">
                    {formatMoney(report.assets.totalAssets, report.currency)}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">=</span>
                </div>
                <div className="p-4 bg-[hsl(var(--gold))]/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Liabilities + Equity</p>
                  <p className="text-2xl font-bold text-[hsl(var(--gold))]">
                    {formatMoney(report.liabilities.totalLiabilities + report.equity.totalEquity, report.currency)}
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
