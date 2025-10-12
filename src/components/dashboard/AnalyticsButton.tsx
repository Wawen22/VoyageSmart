'use client';

import { BarChart3Icon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
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
            "group relative glass-action-card overflow-hidden transition-all duration-500",
            "hover:scale-105 hover:shadow-2xl",
            compact
              ? "px-4 py-2.5 rounded-xl text-xs"
              : "px-6 py-3.5 rounded-2xl text-sm"
          )}>
            {/* Animated background orbs */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-all duration-700 group-hover:scale-150" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-all duration-700 group-hover:scale-150" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5 glass-grid-pattern" />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className={cn(
              "relative flex items-center font-semibold text-foreground",
              compact ? "gap-2.5" : "gap-3"
            )}>
              <div className="relative">
                <div className={cn(
                  "rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300",
                  compact ? "p-1.5" : "p-2"
                )}>
                  <BarChart3Icon className={cn(
                    "transition-all duration-300 text-primary group-hover:text-purple-600",
                    compact ? "h-4 w-4" : "h-5 w-5"
                  )} />
                </div>
                {/* Pulse ring on hover */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary/50 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500" />
              </div>

              <span className="relative">
                Open analytics
                {/* Sparkle effect */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <SparklesIcon className={cn(
                    "text-yellow-400 animate-pulse",
                    compact ? "h-3 w-3" : "h-3.5 w-3.5"
                  )} />
                </div>
              </span>

              {/* Trending indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                <TrendingUpIcon className={cn(
                  "text-emerald-500",
                  compact ? "h-3 w-3" : "h-4 w-4"
                )} />
              </div>
            </div>
          </button>
        }
      />

      {/* Subtitle - Only show when not compact */}
      {!compact && (
        <p className="text-xs text-muted-foreground mt-2 text-center opacity-80">
          Discover your travel patterns
        </p>
      )}
    </div>
  );
}
