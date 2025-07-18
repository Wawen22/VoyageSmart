'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { getUserTotalTripCount } from '@/lib/subscription';
import { MapPinIcon, UsersIcon, CrownIcon } from 'lucide-react';
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200/20 dark:border-purple-800/20">
        <CrownIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
          Unlimited
        </span>
      </div>
    );
  }

  // Show counter for free users
  const isNearLimit = tripCounts.total >= 4; // Show warning when at 4/5
  const isAtLimit = tripCounts.total >= 5;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
      isAtLimit 
        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30" 
        : isNearLimit 
        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30"
        : "bg-muted/50 border-border"
    )}>
      <MapPinIcon className={cn(
        "h-4 w-4",
        isAtLimit 
          ? "text-red-600 dark:text-red-400" 
          : isNearLimit 
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground"
      )} />
      
      <div className="flex items-center gap-1">
        <span className={cn(
          "text-sm font-medium",
          isAtLimit 
            ? "text-red-700 dark:text-red-300" 
            : isNearLimit 
            ? "text-amber-700 dark:text-amber-300"
            : "text-foreground"
        )}>
          {tripCounts.total}/5
        </span>
        
        {tripCounts.participating > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-muted-foreground">•</span>
            <UsersIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {tripCounts.participating}
            </span>
          </div>
        )}
      </div>

      {isAtLimit && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
          Limit reached
        </Badge>
      )}
    </div>
  );
}
