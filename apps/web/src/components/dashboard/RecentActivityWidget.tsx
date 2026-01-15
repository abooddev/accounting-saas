'use client';

import { LucideIcon, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityType = 'income' | 'expense' | 'transfer';

export interface ActivityItem {
  id: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  amount: number;
  type: ActivityType;
  time: string;
  currency?: string;
}

interface RecentActivityWidgetProps {
  title?: string;
  activities: ActivityItem[];
  className?: string;
  maxItems?: number;
  onViewAll?: () => void;
}

const typeStyles: Record<ActivityType, { icon: LucideIcon; color: string; bgColor: string }> = {
  income: {
    icon: ArrowDownLeft,
    color: 'text-sage',
    bgColor: 'bg-sage/10',
  },
  expense: {
    icon: ArrowUpRight,
    color: 'text-terracotta',
    bgColor: 'bg-terracotta/10',
  },
  transfer: {
    icon: RefreshCw,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
  },
};

function formatAmount(amount: number, type: ActivityType, currency: string = 'USD'): string {
  const prefix = type === 'income' ? '+' : type === 'expense' ? '-' : '';
  return `${prefix}${currency} ${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function RecentActivityWidget({
  title = 'Recent Activity',
  activities,
  className,
  maxItems = 5,
  onViewAll,
}: RecentActivityWidgetProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={cn('card-premium p-6 animate-slide-up', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-cedar hover:text-cedar-light transition-colors"
          >
            View All
          </button>
        )}
      </div>

      <div className="space-y-1">
        {displayedActivities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No recent activity
          </p>
        ) : (
          displayedActivities.map((activity, index) => {
            const typeStyle = typeStyles[activity.type];
            const IconComponent = activity.icon || typeStyle.icon;

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors',
                  `stagger-${Math.min(index + 1, 5)}`
                )}
              >
                <div className={cn('p-2 rounded-lg', typeStyle.bgColor)}>
                  <IconComponent className={cn('h-5 w-5', typeStyle.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      activity.type === 'income'
                        ? 'text-sage'
                        : activity.type === 'expense'
                        ? 'text-terracotta'
                        : 'text-foreground'
                    )}
                  >
                    {formatAmount(activity.amount, activity.type, activity.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
