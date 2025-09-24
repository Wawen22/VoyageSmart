'use client';

import { BarChart3Icon, SparklesIcon } from 'lucide-react';
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
          <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden mobile-touch-optimized mobile-analytics-button">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

            <div className="relative flex items-center gap-3">
              <div className="relative">
                <BarChart3Icon className="h-5 w-5 transition-all duration-300 group-hover:animate-bounce" />
                <div className="absolute inset-0 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
              </div>

              <span className="relative font-semibold">
                📊 View Analytics
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <SparklesIcon className="h-3 w-3 text-yellow-300 animate-pulse" />
                </div>
              </span>
            </div>

            {/* Enhanced glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/30 to-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          </button>
        }
      />
    </div>
  );
}
