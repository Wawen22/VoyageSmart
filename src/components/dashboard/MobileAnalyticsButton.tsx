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
          <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg overflow-hidden mobile-touch-optimized mobile-analytics-button">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

            <div className="relative flex items-center gap-2">
              <div className="relative">
                <BarChart3Icon className="h-4 w-4 transition-all duration-300 group-hover:animate-bounce" />
                <div className="absolute inset-0 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
              </div>

              <span className="relative font-semibold">
                Analytics
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <SparklesIcon className="h-2.5 w-2.5 text-yellow-300 animate-pulse" />
                </div>
              </span>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          </button>
        }
      />
    </div>
  );
}
