'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { getUserTotalTripCount } from '@/lib/subscription';
import { MapPinIcon, UsersIcon, CrownIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TripCounts {
  owned: number;
  participating: number;
  total: number;
}

export default function TripCounterWidget() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [tripCounts, setTripCounts] = useState<TripCounts>({ owned: 0, participating: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripCounts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const counts = await getUserTotalTripCount(user.id);
        setTripCounts(counts);
      } catch (error) {
        console.error('Error fetching trip counts:', error);
        setTripCounts({ owned: 0, participating: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchTripCounts();

    // Refresh counts every 30 seconds to keep them updated
    const interval = setInterval(fetchTripCounts, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Don't show for non-authenticated users
  if (!user || loading) {
    return null;
  }

  // Don't show for premium/AI users (they have unlimited trips)
  if (subscription?.tier === 'premium' || subscription?.tier === 'ai') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-lg border border-purple-200/30 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 h-9">
        <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/30">
          <CrownIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
          Unlimited
        </span>
        <SparklesIcon className="h-3 w-3 text-purple-500 animate-pulse" />
      </div>
    );
  }

  // Show counter for free users
  const isNearLimit = tripCounts.total >= 4; // Show warning when at 4/5
  const isAtLimit = tripCounts.total >= 5;
  const progressPercentage = (tripCounts.total / 5) * 100;

  return (
    <div className={cn(
      "relative flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md cursor-default group h-9",
      isAtLimit
        ? "bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-300 dark:border-red-700/50 shadow-red-100 dark:shadow-red-900/20"
        : isNearLimit
        ? "bg-gradient-to-r from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-300 dark:border-amber-700/50 shadow-amber-100 dark:shadow-amber-900/20"
        : "bg-gradient-to-r from-blue-50 to-indigo-100/50 dark:from-blue-950/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/50 shadow-blue-100 dark:shadow-blue-900/20"
    )}>
      {/* Progress bar background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 opacity-20",
            isAtLimit
              ? "bg-gradient-to-r from-red-400 to-red-500"
              : isNearLimit
              ? "bg-gradient-to-r from-amber-400 to-orange-500"
              : "bg-gradient-to-r from-blue-400 to-indigo-500"
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Icon with background */}
      <div className={cn(
        "relative p-1.5 rounded-md transition-all duration-200 group-hover:scale-110",
        isAtLimit
          ? "bg-red-100 dark:bg-red-900/40"
          : isNearLimit
          ? "bg-amber-100 dark:bg-amber-900/40"
          : "bg-blue-100 dark:bg-blue-900/40"
      )}>
        <MapPinIcon className={cn(
          "h-3.5 w-3.5 transition-colors duration-200",
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
            "text-sm font-bold tracking-wide",
            isAtLimit
              ? "text-red-700 dark:text-red-300"
              : isNearLimit
              ? "text-amber-700 dark:text-amber-300"
              : "text-blue-700 dark:text-blue-300"
          )}>
            {tripCounts.total}/5
          </span>
          <span className="text-xs font-medium text-muted-foreground">trips</span>
        </div>

        {/* Status indicators */}
        {isAtLimit ? (
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
              {5 - tripCounts.total} left
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
