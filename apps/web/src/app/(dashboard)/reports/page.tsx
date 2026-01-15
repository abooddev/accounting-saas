'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp,
  Users,
  PieChart,
  Clock,
  DollarSign,
  Package,
  ArrowRight,
  Scale,
  FileSpreadsheet,
} from 'lucide-react';

const reports = [
  {
    title: 'Profit & Loss',
    description: 'View revenue, expenses, and net profit for a period',
    href: '/reports/profit-loss',
    icon: TrendingUp,
    color: 'text-green-600',
  },
  {
    title: 'Supplier Balances',
    description: 'Outstanding balances with all suppliers',
    href: '/reports/supplier-balances',
    icon: Users,
    color: 'text-blue-600',
  },
  {
    title: 'Expenses by Category',
    description: 'Analyze spending patterns by expense category',
    href: '/reports/expenses',
    icon: PieChart,
    color: 'text-purple-600',
  },
  {
    title: 'Payments Due',
    description: 'Upcoming and overdue invoice payments',
    href: '/reports/payments-due',
    icon: Clock,
    color: 'text-orange-600',
  },
  {
    title: 'Cash Flow',
    description: 'Track money in and out of your accounts',
    href: '/reports/cash-flow',
    icon: DollarSign,
    color: 'text-emerald-600',
  },
  {
    title: 'Inventory Value',
    description: 'Stock value by category and low stock alerts',
    href: '/reports/inventory',
    icon: Package,
    color: 'text-indigo-600',
  },
  {
    title: 'Balance Sheet',
    description: 'Financial position showing assets, liabilities, and equity',
    href: '/reports/balance-sheet',
    icon: FileSpreadsheet,
    color: 'text-cyan-600',
  },
  {
    title: 'Trial Balance',
    description: 'All accounts with debit and credit balances',
    href: '/reports/trial-balance',
    icon: Scale,
    color: 'text-amber-600',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          View financial reports and analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <Icon className={`h-5 w-5 ${report.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    View Report <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
