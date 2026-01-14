'use client';

import Link from 'next/link';
import { useInventoryValue } from '@/hooks/use-reports';
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
import { ArrowLeft, Package, AlertTriangle, ExternalLink } from 'lucide-react';

export default function InventoryPage() {
  const { data: report, isLoading } = useInventoryValue();

  // Calculate max percentage for visual bar
  const maxPercentage = report?.byCategory.reduce((max, c) => Math.max(max, c.percentage), 0) || 100;

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
            <h1 className="text-2xl font-bold">Inventory Value</h1>
            <p className="text-muted-foreground">
              Stock value by category and low stock alerts
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.totals.productCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Quantity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.totals.totalQuantity.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Stock Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(report.totals.stockValue, 'USD')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          {report.lowStock.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>
                  Products that need restocking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.lowStock.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.productName}</span>
                            {item.productNameAr && (
                              <span className="text-muted-foreground ml-2" dir="rtl">
                                ({item.productNameAr})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.minStockLevel}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/products/${item.productId}`}>
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

          {/* Value by Category - Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {report.byCategory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No inventory data
                </p>
              ) : (
                <div className="space-y-4">
                  {report.byCategory.map((category) => (
                    <div key={category.categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.categoryName}</span>
                        <div className="text-right">
                          <span className="font-medium">{formatMoney(category.stockValue, 'USD')}</span>
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
                        {category.productCount} product{category.productCount !== 1 ? 's' : ''}, {category.totalQuantity.toLocaleString()} units
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
              {report.byCategory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No inventory data
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.byCategory.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell className="font-medium">{category.categoryName}</TableCell>
                        <TableCell className="text-right">
                          {category.productCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {category.totalQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(category.stockValue, 'USD')}
                        </TableCell>
                        <TableCell className="text-right">
                          {category.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {report.totals.productCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.totals.totalQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatMoney(report.totals.stockValue, 'USD')}
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
