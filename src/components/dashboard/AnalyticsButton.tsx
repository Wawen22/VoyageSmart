'use client';

import { BarChart3Icon, SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdvancedMetricsModal from './AdvancedMetricsModal';

interface AnalyticsButtonProps {
  trips: any[];
  className?: string;
  compact?: boolean;
}

export default function AnalyticsButton({ trips, className, compact = false }: AnalyticsButtonProps) {
  return (
    <div className={cn("", className)}>
      <AdvancedMetricsModal
        trips={trips}
        trigger={
          <button className={cn(
            "group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg overflow-hidden",
            compact
              ? "px-4 py-2 rounded-lg text-xs"
              : "px-6 py-3 rounded-xl text-sm"
          )}>
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

            <div className={cn(
              "relative flex items-center",
              compact ? "gap-2" : "gap-3"
            )}>
              <div className="relative">
                <BarChart3Icon className={cn(
                  "transition-all duration-300 group-hover:animate-bounce",
                  compact ? "h-4 w-4" : "h-5 w-5"
                )} />
                <div className="absolute inset-0 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
              </div>

              <span className="relative">
                View Analytics
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <SparklesIcon className={cn(
                    "text-yellow-300 animate-pulse",
                    compact ? "h-2.5 w-2.5" : "h-3 w-3"
                  )} />
                </div>
              </span>
            </div>

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
          </button>
        }
      />

      {/* Subtitle - Only show when not compact */}
      {!compact && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Discover your travel patterns
        </p>
      )}
    </div>
  );
}
