'use client';

import { useSubscription } from '@/lib/subscription';
import { PlaneTakeoffIcon, CrownIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransportationCounterWidgetProps {
  count: number;
  className?: string;
  compact?: boolean; // For mobile view
}

export default function TransportationCounterWidget({ count, className, compact = false }: TransportationCounterWidgetProps) {
  const { subscription } = useSubscription();

  // Don't show for premium/AI users (they have unlimited transportation)
  if (subscription?.tier === 'premium' || subscription?.tier === 'ai') {
    return (
      <div className={cn(
        compact
          ? "flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-md border border-purple-200/30 dark:border-purple-800/30 shadow-sm h-7"
          : "flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-lg border border-purple-200/30 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 h-9",
        className
      )}>
        <div className={cn(
          "rounded-full bg-purple-100 dark:bg-purple-900/30",
          compact ? "p-0.5" : "p-1"
        )}>
          <CrownIcon className={cn(
            "text-purple-600 dark:text-purple-400",
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
        </div>
        <span className={cn(
          "font-semibold text-purple-700 dark:text-purple-300",
          compact ? "text-xs" : "text-sm"
        )}>
          Unlimited
        </span>
        {!compact && <SparklesIcon className="h-3 w-3 text-purple-500 animate-pulse" />}
      </div>
    );
  }

  // Show counter for free users
  const isNearLimit = count >= 4; // Show warning when at 4/5
  const isAtLimit = count >= 5;

  return (
    <div className={cn(
      "relative flex items-center transition-all duration-300 shadow-sm cursor-default group",
      compact
        ? "gap-2 px-2 py-1.5 rounded-md border hover:shadow-md h-7"
        : "gap-3 px-3 py-2 rounded-lg border-2 hover:scale-105 hover:shadow-md h-9",
      isAtLimit
        ? "bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-300 dark:border-red-700/50 shadow-red-100 dark:shadow-red-900/20"
        : isNearLimit
        ? "bg-gradient-to-r from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-300 dark:border-amber-700/50 shadow-amber-100 dark:shadow-amber-900/20"
        : "bg-gradient-to-r from-blue-50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-blue-100 dark:shadow-blue-900/20",
      className
    )}>
      {/* Progress bar background */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isAtLimit
              ? "bg-gradient-to-r from-red-200/30 to-red-300/30 dark:from-red-800/20 dark:to-red-700/20"
              : isNearLimit
              ? "bg-gradient-to-r from-amber-200/30 to-orange-300/30 dark:from-amber-800/20 dark:to-orange-700/20"
              : "bg-gradient-to-r from-blue-200/30 to-indigo-300/30 dark:from-blue-800/20 dark:to-indigo-700/20"
          )}
          style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
        />
      </div>

      {/* Icon with background */}
      <div className={cn(
        "relative rounded-md transition-all duration-200",
        compact ? "p-1" : "p-1.5 group-hover:scale-110",
        isAtLimit
          ? "bg-red-100 dark:bg-red-900/40"
          : isNearLimit
          ? "bg-amber-100 dark:bg-amber-900/40"
          : "bg-blue-100 dark:bg-blue-900/40"
      )}>
        <PlaneTakeoffIcon className={cn(
          "transition-colors duration-200",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
          isAtLimit
            ? "text-red-600 dark:text-red-400"
            : isNearLimit
            ? "text-amber-600 dark:text-amber-400"
            : "text-blue-600 dark:text-blue-400"
        )} />
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-bold tracking-wide",
            compact ? "text-xs" : "text-sm",
            isAtLimit
              ? "text-red-700 dark:text-red-300"
              : isNearLimit
              ? "text-amber-700 dark:text-amber-300"
              : "text-blue-700 dark:text-blue-300"
          )}>
            {count}/5
          </span>
          {!compact && (
            <span className="text-xs font-medium text-muted-foreground">transportation</span>
          )}
        </div>

        {/* Status indicators */}
        {compact ? (
          // Compact status indicators
          isAtLimit ? (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 font-semibold animate-pulse">
              Max
            </Badge>
          ) : isNearLimit ? (
            <TrendingUpIcon className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400 animate-bounce" />
          ) : (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {5 - count} left
            </span>
          )
        ) : (
          // Full status indicators
          isAtLimit ? (
            <div className="flex items-center gap-1">
              <Badge variant="destructive" className="text-xs px-2 py-0.5 font-semibold animate-pulse">
                Limit reached
              </Badge>
            </div>
          ) : isNearLimit ? (
            <div className="flex items-center gap-1">
              <TrendingUpIcon className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-bounce" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Almost full
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {5 - count} left
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
