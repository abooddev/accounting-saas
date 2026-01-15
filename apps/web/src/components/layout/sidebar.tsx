'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  Settings,
  LogOut,
  Wallet,
  FileText,
  CreditCard,
  BarChart3,
  ShoppingCart,
  TreePine,
  FileCheck,
  ClipboardList,
  Truck,
  Tags,
  FileMinus,
  FilePlus,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const mainNavItems = [
  {
    title: 'POS',
    href: '/pos',
    icon: ShoppingCart,
    highlight: true,
  },
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

const salesNavItems = [
  {
    title: 'Quotes',
    href: '/quotes',
    icon: FileCheck,
  },
  {
    title: 'Sales Orders',
    href: '/sales-orders',
    icon: ClipboardList,
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: FileText,
  },
  {
    title: 'Credit Notes',
    href: '/credit-notes',
    icon: FileMinus,
  },
];

const purchasingNavItems = [
  {
    title: 'Purchase Orders',
    href: '/purchase-orders',
    icon: Truck,
  },
  {
    title: 'Debit Notes',
    href: '/debit-notes',
    icon: FilePlus,
  },
];

const financeNavItems = [
  {
    title: 'Accounts',
    href: '/accounts',
    icon: Wallet,
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: CreditCard,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];

const managementNavItems = [
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Price Lists',
    href: '/price-lists',
    icon: Tags,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: FolderTree,
  },
];

const settingsNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

function NavSection({
  title,
  items,
  pathname
}: {
  title?: string;
  items: typeof mainNavItems;
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const isHighlight = 'highlight' in item && item.highlight;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'nav-item group',
              isActive && 'active',
              isHighlight && !isActive && 'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]'
            )}
          >
            <item.icon className={cn(
              'h-5 w-5 transition-transform group-hover:scale-110',
              isHighlight && !isActive && 'text-[hsl(var(--gold))]'
            )} />
            <span className="font-medium">{item.title}</span>
            {isHighlight && !isActive && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--gold))]/20 px-2 py-0.5 rounded">
                Quick
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { tenant, logout, isLoggingOut } = useAuth();

  return (
    <div className="flex flex-col h-full w-64 bg-gradient-cedar">
      {/* Logo & Brand */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[hsl(var(--gold))] rounded-lg flex items-center justify-center shadow-gold">
            <TreePine className="w-6 h-6 text-[hsl(var(--cedar))]" />
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold text-white">
              {tenant?.name || 'Lebanese Accounting'}
            </h1>
            <p className="text-xs text-white/60">{tenant?.slug || 'Premium Edition'}</p>
          </div>
        </div>
      </div>

      {/* Decorative Line */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin">
        <NavSection items={mainNavItems} pathname={pathname} />
        <NavSection title="Sales" items={salesNavItems} pathname={pathname} />
        <NavSection title="Purchasing" items={purchasingNavItems} pathname={pathname} />
        <NavSection title="Finance" items={financeNavItems} pathname={pathname} />
        <NavSection title="Management" items={managementNavItems} pathname={pathname} />
        <NavSection items={settingsNavItems} pathname={pathname} />
      </nav>

      {/* Decorative Line */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* User Section */}
      <div className="p-4 space-y-1">
        <ThemeToggle />
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="nav-item w-full hover:bg-[hsl(var(--terracotta))]/20 hover:text-[hsl(var(--terracotta))] disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </span>
        </button>
      </div>
    </div>
  );
}
