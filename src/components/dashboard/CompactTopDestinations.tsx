'use client';

import { useState, useEffect } from 'react';
import { GlobeIcon, BarChart3Icon, SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdvancedMetricsModal from './AdvancedMetricsModal';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
  destination: string | null;
  preferences?: {
    currency?: string;
    destinations?: any;
  };
}

interface CompactTopDestinationsProps {
  trips: Trip[];
}

export default function CompactTopDestinations({ trips }: CompactTopDestinationsProps) {
  const [topDestinations, setTopDestinations] = useState<string[]>([]);

  useEffect(() => {
    calculateTopDestinations();
  }, [trips]);

  const calculateTopDestinations = () => {
    // Most visited countries (simplified)
    const destinations = trips
      .map(trip => trip.destination)
      .filter(Boolean)
      .reduce((acc: any, dest) => {
        const country = dest!.split(',').pop()?.trim() || dest;
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
    
    const topCountries = Object.entries(destinations)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([country]) => country);

    setTopDestinations(topCountries);
  };

  if (topDestinations.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block bg-gradient-to-r from-blue-50/40 to-purple-50/40 dark:from-blue-950/15 dark:to-purple-950/15 rounded-xl p-4 lg:p-4 border border-border/40 shadow-sm">
      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:items-center gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <GlobeIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Top Destinations</h3>
            <p className="text-xs text-muted-foreground">Your favorite places</p>
          </div>
        </div>

        {/* Destinations */}
        <div className="flex flex-wrap gap-2 flex-1">
          {topDestinations.map((country, index) => (
            <div
              key={country}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 shadow-sm",
                index === 0 && "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                index === 1 && "bg-gradient-to-r from-green-500 to-teal-600 text-white",
                index === 2 && "bg-gradient-to-r from-orange-500 to-red-600 text-white"
              )}
            >
              {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {country}
            </div>
          ))}
        </div>

        {/* Stats and Analytics */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{trips.length}</p>
              <p className="text-xs text-muted-foreground">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{topDestinations.length}</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>

          {/* Analytics Button */}
          <div className="border-l border-border/50 pl-4">
            <AdvancedMetricsModal
              trips={trips}
              trigger={
                <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                  <div className="relative flex items-center gap-2">
                    <BarChart3Icon className="h-3.5 w-3.5 transition-all duration-300 group-hover:animate-bounce" />
                    <span className="relative">
                      View Analytics
                      <div className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <SparklesIcon className="h-2 w-2 text-yellow-300 animate-pulse" />
                      </div>
                    </span>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Hidden (replaced by SwipeableStats) */}
      <div className="hidden space-y-2 compact-destinations-mobile dashboard-mobile-refresh">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <GlobeIcon className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-xs">Top Destinations</h3>
            </div>
          </div>

          {/* Mobile Analytics Button */}
          <AdvancedMetricsModal
            trips={trips}
            trigger={
              <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-1 rounded-md font-medium text-xs transition-all duration-300 transform active:scale-95 shadow-md overflow-hidden">
                <div className="relative flex items-center gap-1">
                  <BarChart3Icon className="h-2.5 w-2.5" />
                  <span>Analytics</span>
                </div>
              </button>
            }
          />
        </div>

        {/* Destinations Row */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {topDestinations.map((country, index) => (
            <div
              key={country}
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 shadow-sm",
                index === 0 && "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                index === 1 && "bg-gradient-to-r from-green-500 to-teal-600 text-white",
                index === 2 && "bg-gradient-to-r from-orange-500 to-red-600 text-white"
              )}
            >
              {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {country}
            </div>
          ))}
        </div>

        {/* Stats Row - More Compact */}
        <div className="flex items-center justify-center gap-6 pt-1 border-t border-border/30">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{trips.length}</p>
            <p className="text-xs text-muted-foreground">Trips</p>
          </div>
          <div className="w-px h-6 bg-border/50"></div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">{topDestinations.length}</p>
            <p className="text-xs text-muted-foreground">Countries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
