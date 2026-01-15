'use client';

import { cn } from '@/lib/utils';

export interface RevenueDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

interface RevenueChartProps {
  title?: string;
  subtitle?: string;
  data?: RevenueDataPoint[];
  currency?: string;
  className?: string;
  showComparison?: boolean;
}

const defaultData: RevenueDataPoint[] = [
  { label: 'Jan', value: 12500, previousValue: 10000 },
  { label: 'Feb', value: 15000, previousValue: 12000 },
  { label: 'Mar', value: 18000, previousValue: 14500 },
  { label: 'Apr', value: 14000, previousValue: 16000 },
  { label: 'May', value: 22000, previousValue: 18000 },
  { label: 'Jun', value: 25000, previousValue: 20000 },
  { label: 'Jul', value: 28000, previousValue: 22000 },
  { label: 'Aug', value: 24000, previousValue: 25000 },
  { label: 'Sep', value: 30000, previousValue: 26000 },
  { label: 'Oct', value: 32000, previousValue: 28000 },
  { label: 'Nov', value: 35000, previousValue: 30000 },
  { label: 'Dec', value: 38000, previousValue: 33000 },
];

export function RevenueChart({
  title = 'Revenue Overview',
  subtitle = 'Monthly revenue performance',
  data = defaultData,
  currency = 'USD',
  className,
  showComparison = true,
}: RevenueChartProps) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.previousValue || 0)));
  const totalCurrent = data.reduce((sum, d) => sum + d.value, 0);
  const totalPrevious = data.reduce((sum, d) => sum + (d.previousValue || 0), 0);
  const percentChange = totalPrevious > 0
    ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
    : 0;

  return (
    <div className={cn('card-premium p-6 animate-slide-up', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {currency} {totalCurrent.toLocaleString()}
          </p>
          {showComparison && (
            <p
              className={cn(
                'text-sm font-medium',
                percentChange >= 0 ? 'text-sage' : 'text-terracotta'
              )}
            >
              {percentChange >= 0 ? '+' : ''}
              {percentChange.toFixed(1)}% vs last year
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      {showComparison && (
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-cedar" />
            <span className="text-sm text-muted-foreground">Current Year</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gold/50" />
            <span className="text-sm text-muted-foreground">Previous Year</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[4, 3, 2, 1, 0].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12 text-right">
                {((maxValue / 4) * i / 1000).toFixed(0)}k
              </span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          ))}
        </div>

        {/* Bars container */}
        <div className="absolute inset-0 pl-14 flex items-end gap-1 pb-6">
          {data.map((point, index) => {
            const currentHeight = (point.value / maxValue) * 100;
            const previousHeight = point.previousValue
              ? (point.previousValue / maxValue) * 100
              : 0;

            return (
              <div
                key={point.label}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1',
                  `stagger-${Math.min(index + 1, 5)}`
                )}
              >
                <div className="w-full flex items-end justify-center gap-0.5 h-52">
                  {/* Previous year bar */}
                  {showComparison && point.previousValue && (
                    <div
                      className="w-2 bg-gold/40 rounded-t transition-all duration-500 ease-out"
                      style={{ height: `${previousHeight}%` }}
                      title={`Previous: ${currency} ${point.previousValue.toLocaleString()}`}
                    />
                  )}
                  {/* Current year bar */}
                  <div
                    className="w-3 bg-gradient-cedar rounded-t transition-all duration-500 ease-out hover:opacity-80"
                    style={{ height: `${currentHeight}%` }}
                    title={`Current: ${currency} ${point.value.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Highest</p>
          <p className="font-semibold text-foreground">
            {currency} {Math.max(...data.map((d) => d.value)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="font-semibold text-foreground">
            {currency} {Math.round(totalCurrent / data.length).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Lowest</p>
          <p className="font-semibold text-foreground">
            {currency} {Math.min(...data.map((d) => d.value)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
