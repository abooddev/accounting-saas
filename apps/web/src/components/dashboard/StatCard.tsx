'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatCardColor = 'cedar' | 'gold' | 'sage' | 'terracotta';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: StatCardColor;
  className?: string;
}

const colorStyles: Record<StatCardColor, { border: string; iconBg: string; iconColor: string }> = {
  cedar: {
    border: 'border-l-cedar',
    iconBg: 'bg-cedar/10',
    iconColor: 'text-cedar',
  },
  gold: {
    border: 'border-l-gold',
    iconBg: 'bg-gold/10',
    iconColor: 'text-gold',
  },
  sage: {
    border: 'border-l-sage',
    iconBg: 'bg-sage/10',
    iconColor: 'text-sage',
  },
  terracotta: {
    border: 'border-l-terracotta',
    iconBg: 'bg-terracotta/10',
    iconColor: 'text-terracotta',
  },
};

export function StatCard({
  icon: Icon,
  title,
  value,
  change,
  color = 'cedar',
  className,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        'stat-card animate-slide-up',
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {change.type === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-sage" />
              ) : (
                <TrendingDown className="h-4 w-4 text-terracotta" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-sage' : 'text-terracotta'
                )}
              >
                {change.type === 'increase' ? '+' : '-'}
                {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-6 w-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
