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
  FilterIcon,
  GlobeIcon,
  RocketIcon,
  PlaneIcon,
  CheckCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import WeatherWidget, { CompactWeatherWidget } from './WeatherWidget';
import CompactTopDestinations from './CompactTopDestinations';
import SwipeableStats from './SwipeableStats';

interface InteractiveDashboardHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: 'all' | 'upcoming' | 'ongoing' | 'past';
  setFilter: (filter: 'all' | 'upcoming' | 'ongoing' | 'past') => void;
  viewMode: 'grid' | 'map';
  setViewMode: (mode: 'grid' | 'map') => void;
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
  trips?: any[];
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
  availableYears,
  trips = []
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
      icon: GlobeIcon
    },
    {
      value: 'upcoming',
      label: 'Upcoming',
      color: 'from-emerald-600 to-emerald-700',
      count: stats.upcoming,
      icon: RocketIcon
    },
    {
      value: 'ongoing',
      label: 'Ongoing',
      color: 'from-orange-600 to-red-700',
      count: stats.ongoing,
      icon: PlaneIcon
    },
    {
      value: 'past',
      label: 'Completed',
      color: 'from-purple-600 to-purple-700',
      count: stats.completed,
      icon: CheckCircleIcon
    }
  ];

  return (
    <div className="relative overflow-hidden bg-card border-border">
      {/* Background pattern simile al resto dell'app */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
      </div>


      <div className="relative z-10 px-6 py-3 lg:py-6 lg:px-8 dashboard-header-mobile dashboard-mobile-refresh">
        {/* Welcome Section */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* Left side - Greeting */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  greeting.color
                )}>
                  <GreetingIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>

              <div className="space-y-0.5 lg:space-y-1">
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-foreground">
                  {greeting.text}, {userName}!
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground">
                  You have <span className="font-semibold text-foreground">{tripCount}</span> {tripCount === 1 ? 'trip' : 'trips'} planned
                </p>
              </div>
            </div>

            {/* Center - Top Destinations with integrated Analytics */}
            <div className="flex-1 lg:max-w-4xl">
              {trips.length > 0 && (
                <CompactTopDestinations trips={trips} />
              )}
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

        {/* Mobile Quick Stats - Before Weather Widget */}
        <div className="lg:hidden mb-4">
          <SwipeableStats trips={trips} showAnalyticsButton={true} />
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden lg:block mb-4 lg:mb-6 search-mobile">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2.5 lg:py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
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

        {/* Filter Tabs with Stats and View Controls - Mobile Optimized */}
        <div className="relative mb-4 lg:mb-6">
          {/* Glass Background Container */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 dark:from-white/5 dark:via-white/2 dark:to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-lg"></div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 p-4 lg:p-5 filter-tabs-mobile">
            {/* Filter Tabs - Mobile Optimized */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {filterOptions.map((option) => {
              const isActive = filter === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={cn(
                    "flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-medium transition-all duration-200 mobile-touch-optimized",
                    "text-xs lg:text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 hover:border-border active:scale-95"
                  )}
                >
                  <option.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs lg:text-sm">{option.label}</span>
                  <span className="sm:hidden text-xs font-semibold">{option.label.split(' ')[0]}</span>
                  <span className={cn(
                    "text-xs px-1.5 lg:px-2 py-0.5 rounded-full font-semibold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/80 text-foreground"
                  )}>
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-3 justify-center lg:justify-end">
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

            {/* Map View - Compact Button */}
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "relative group px-3 py-2 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 overflow-hidden",
                viewMode === 'map'
                  ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
              )}
              title="🗺️ Interactive Map View"
            >
              <div className="relative flex items-center gap-1.5">
                <MapIcon className={cn(
                  "h-4 w-4 transition-all duration-300",
                  viewMode === 'map' && "animate-bounce"
                )} />
                <span className="whitespace-nowrap">🗺️ Map</span>
              </div>
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-border"></div>

            {/* Standard View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200",
                  viewMode === 'grid'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
                title="Grid View"
              >
                <GridIcon className="h-4 w-4" />
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
