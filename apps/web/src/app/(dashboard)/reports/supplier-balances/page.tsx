'use client';

import Link from 'next/link';
import { useSupplierBalances } from '@/hooks/use-reports';
import { formatMoney } from '@accounting/shared';
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
import { ArrowLeft, FileText, ExternalLink, Download } from 'lucide-react';
import { exportSupplierBalancesToExcel } from '@/lib/excel';

export default function SupplierBalancesPage() {
  const { data: report, isLoading } = useSupplierBalances();

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
            <h1 className="text-2xl font-bold">Supplier Balances</h1>
            <p className="text-muted-foreground">
              Outstanding balances with all suppliers
            </p>
          </div>
        </div>
        {report && (
          <Button
            variant="outline"
            onClick={() => exportSupplierBalancesToExcel(report)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(report.totals.totalPurchases, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(report.totals.totalPaid, 'USD')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatMoney(report.totals.totalBalance, 'USD')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supplier List */}
          <Card>
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              {report.suppliers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No suppliers with balances</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Total Purchases</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Balance (USD)</TableHead>
                      <TableHead className="text-right">Balance (LBP)</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{supplier.name}</span>
                            {supplier.nameAr && (
                              <span className="text-muted-foreground ml-2" dir="rtl">
                                ({supplier.nameAr})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatMoney(supplier.totalPurchases, 'USD')}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatMoney(supplier.totalPaid, 'USD')}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatMoney(supplier.balanceUsd, 'USD')}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {supplier.balanceLbp > 0 ? formatMoney(supplier.balanceLbp, 'LBP') : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {supplier.lastPurchaseDate || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {supplier.lastPaymentDate || '-'}
                        </TableCell>
                        <TableCell>
                          <Link href={`/reports/supplier-statement?contactId=${supplier.id}`}>
                            <Button variant="ghost" size="icon" title="View Statement">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
