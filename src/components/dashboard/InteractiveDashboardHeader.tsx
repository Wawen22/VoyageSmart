'use client';

import { useState, useEffect } from 'react';
import {
  SearchIcon,
  GridIcon,
  ListIcon,
  SparklesIcon,
  MapIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  CalendarIcon,
  ClockIcon,
  FilterIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import WeatherWidget, { CompactWeatherWidget } from './WeatherWidget';

interface InteractiveDashboardHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: 'all' | 'upcoming' | 'ongoing' | 'past';
  setFilter: (filter: 'all' | 'upcoming' | 'ongoing' | 'past') => void;
  viewMode: 'grid' | 'timeline' | 'map';
  setViewMode: (mode: 'grid' | 'timeline' | 'map') => void;
  tripCount: number;
  userName?: string;
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: number[];
}

export default function InteractiveDashboardHeader({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  viewMode,
  setViewMode,
  tripCount,
  userName = 'Explorer',
  stats,
  selectedYear,
  setSelectedYear,
  availableYears
}: InteractiveDashboardHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const getGreeting = () => {
    const greetings = {
      morning: { text: 'Good morning', icon: SunIcon, color: 'from-yellow-400 to-orange-500' },
      afternoon: { text: 'Good afternoon', icon: CloudIcon, color: 'from-blue-400 to-cyan-500' },
      evening: { text: 'Good evening', icon: MoonIcon, color: 'from-purple-400 to-pink-500' }
    };
    return greetings[timeOfDay];
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const filterOptions = [
    {
      value: 'all',
      label: 'All Trips',
      color: 'from-slate-600 to-slate-700',
      count: stats.total,
      emoji: '🌍'
    },
    {
      value: 'upcoming',
      label: 'Upcoming',
      color: 'from-emerald-600 to-emerald-700',
      count: stats.upcoming,
      emoji: '🚀'
    },
    {
      value: 'ongoing',
      label: 'Ongoing',
      color: 'from-orange-600 to-red-700',
      count: stats.ongoing,
      emoji: '✈️'
    },
    {
      value: 'past',
      label: 'Completed',
      color: 'from-purple-600 to-purple-700',
      count: stats.completed,
      emoji: '✅'
    }
  ];

  return (
    <div className="relative overflow-hidden bg-card border-b border-border">
      {/* Background pattern simile al resto dell'app */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
      </div>


      <div className="relative z-10 px-6 py-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* Left side - Greeting */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  greeting.color
                )}>
                  <GreetingIcon className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {greeting.text}, {userName}!
                </h1>
                <p className="text-muted-foreground">
                  You have <span className="font-semibold text-foreground">{tripCount}</span> {tripCount === 1 ? 'trip' : 'trips'} planned
                </p>
              </div>
            </div>

            {/* Right side - Weather Widget */}
            <div className="lg:max-w-sm w-full lg:w-auto">
              <div className="hidden lg:block">
                <WeatherWidget />
              </div>
              <div className="lg:hidden">
                <CompactWeatherWidget />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs with Stats */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((option, index) => {
            const isActive = filter === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                <span className="text-sm">{option.emoji}</span>
                <span className="text-sm">{option.label}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-foreground"
                )}>
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Year Filter and View Mode Toggle */}
        <div className="flex items-center gap-6 justify-end">
          {/* Year Filter */}
          {availableYears.length > 1 && (
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Map View - Prominent Button */}
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "relative group px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 overflow-hidden",
              viewMode === 'map'
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
            )}
            title="🗺️ Interactive Map View - Explore your trips visually!"
          >
            {/* Animated background for active state */}
            {viewMode === 'map' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 opacity-20 animate-pulse"></div>
            )}

            <div className="relative flex items-center gap-1.5 sm:gap-2.5">
              <div className="relative">
                <MapIcon className={cn(
                  "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300",
                  viewMode === 'map' && "animate-bounce"
                )} />
                {viewMode === 'map' && (
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                )}
              </div>

              <span className="relative whitespace-nowrap">
                <span className="hidden sm:inline">🗺️ Map View</span>
                <span className="sm:hidden">🗺️ Map</span>
                {viewMode === 'map' && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                )}
              </span>

              {/* Sparkle effect for hover */}
              <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <SparklesIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
          </button>

          {/* Separator */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>

          {/* Standard View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                viewMode === 'grid'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
              title="Grid View"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                viewMode === 'timeline'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
              title="Timeline View"
            >
              <ClockIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
