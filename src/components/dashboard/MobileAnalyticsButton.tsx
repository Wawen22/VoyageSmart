'use client';

import { BarChart3Icon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdvancedMetricsModal from './AdvancedMetricsModal';

interface MobileAnalyticsButtonProps {
  trips: any[];
  className?: string;
}

export default function MobileAnalyticsButton({ trips, className }: MobileAnalyticsButtonProps) {
  return (
    <div className={cn("lg:hidden", className)}>
      <AdvancedMetricsModal
        trips={trips}
        trigger={
          <button className="group relative glass-action-card px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl overflow-hidden mobile-touch-optimized mobile-analytics-button">
            {/* Animated background orbs */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-full blur-2xl opacity-50 active:opacity-70 transition-all duration-700" />
            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-gradient-to-br from-indigo-500/30 to-blue-500/30 rounded-full blur-2xl opacity-50 active:opacity-70 transition-all duration-700" />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5 glass-grid-pattern" />

            {/* Shimmer effect on tap */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-1000" />

            <div className="relative flex items-center gap-3 text-foreground">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20 group-active:scale-110 transition-transform duration-300">
                  <BarChart3Icon className="h-5 w-5 transition-all duration-300 text-primary group-active:text-purple-600" />
                </div>
                {/* Pulse ring on tap */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary/50 opacity-0 group-active:opacity-100 group-active:scale-125 transition-all duration-500" />
              </div>

              <span className="relative font-semibold">
                📊 View Analytics
                {/* Sparkle effect */}
                <div className="absolute -top-2 -right-2 opacity-0 group-active:opacity-100 transition-all duration-300">
                  <SparklesIcon className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
                </div>
              </span>

              {/* Trending indicator */}
              <div className="opacity-0 group-active:opacity-100 transition-all duration-300 transform group-active:translate-x-1">
                <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </button>
        }
      />
    </div>
  );
}
