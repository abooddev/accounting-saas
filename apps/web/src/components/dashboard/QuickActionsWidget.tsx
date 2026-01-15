'use client';

import { LucideIcon, FileText, CreditCard, ShoppingCart, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'cedar' | 'gold';
}

interface QuickActionsWidgetProps {
  title?: string;
  actions?: QuickAction[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const defaultActions: QuickAction[] = [
  {
    id: 'new-invoice',
    icon: FileText,
    label: 'New Invoice',
    description: 'Create a new invoice',
    href: '/invoices/new',
    variant: 'cedar',
  },
  {
    id: 'new-payment',
    icon: CreditCard,
    label: 'New Payment',
    description: 'Record a payment',
    href: '/payments/new',
    variant: 'gold',
  },
  {
    id: 'pos',
    icon: ShoppingCart,
    label: 'POS',
    description: 'Point of Sale',
    href: '/pos',
    variant: 'cedar',
  },
  {
    id: 'reports',
    icon: BarChart3,
    label: 'Reports',
    description: 'View reports',
    href: '/reports',
    variant: 'gold',
  },
];

export function QuickActionsWidget({
  title = 'Quick Actions',
  actions = defaultActions,
  className,
  columns = 2,
}: QuickActionsWidgetProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('card-premium p-6 animate-slide-up', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>

      <div className={cn('grid gap-3', gridCols[columns])}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isCedar = action.variant === 'cedar';

          const buttonContent = (
            <>
              <div
                className={cn(
                  'p-3 rounded-lg mb-3 transition-colors',
                  isCedar ? 'bg-cedar/10 group-hover:bg-cedar/20' : 'bg-gold/10 group-hover:bg-gold/20'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isCedar ? 'text-cedar' : 'text-gold'
                  )}
                />
              </div>
              <span className="font-medium text-foreground group-hover:text-cedar transition-colors">
                {action.label}
              </span>
              {action.description && (
                <span className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </span>
              )}
            </>
          );

          const baseClasses = cn(
            'group flex flex-col items-center text-center p-4 rounded-lg',
            'border border-border/50 hover:border-cedar/30',
            'bg-card hover:bg-muted/30 transition-all duration-200',
            'hover:shadow-warm-md',
            `stagger-${Math.min(index + 1, 5)}`
          );

          if (action.href) {
            return (
              <a
                key={action.id}
                href={action.href}
                className={baseClasses}
              >
                {buttonContent}
              </a>
            );
          }

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={baseClasses}
            >
              {buttonContent}
            </button>
          );
        })}
      </div>
    </div>
  );
}
