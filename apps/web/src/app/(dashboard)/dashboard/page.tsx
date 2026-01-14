'use client';

import { useAuth } from '@/hooks/use-auth';
import { useContacts } from '@/hooks/use-contacts';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FolderTree, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const { data: contacts } = useContacts();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const { data: lowStockProducts } = useProducts({ lowStock: true });

  const stats = [
    {
      title: 'Total Contacts',
      value: contacts?.length ?? 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Products',
      value: products?.length ?? 0,
      icon: Package,
      color: 'text-green-600',
    },
    {
      title: 'Categories',
      value: categories?.length ?? 0,
      icon: FolderTree,
      color: 'text-purple-600',
    },
    {
      title: 'Low Stock',
      value: lowStockProducts?.length ?? 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of {tenant?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
