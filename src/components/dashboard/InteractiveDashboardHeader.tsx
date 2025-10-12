'use client';

import { useState, useEffect } from 'react';
import {
  SearchIcon,
  GridIcon,
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
  CheckCircleIcon,
  BarChart3Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import WeatherWidget from './WeatherWidget';
import { getTimeOfDay } from '@/lib/date-utils';
import CompactTopDestinations from './CompactTopDestinations';
import AdvancedMetricsModal from './AdvancedMetricsModal';

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
    setTimeOfDay(getTimeOfDay());
  }, []);

  const getGreeting = () => {
    const greetings = {
      morning: { text: 'Good morning', icon: SunIcon, color: 'from-amber-400 to-orange-500' },
      afternoon: { text: 'Good afternoon', icon: CloudIcon, color: 'from-blue-400 to-teal-500' },
      evening: { text: 'Good evening', icon: MoonIcon, color: 'from-purple-500 to-pink-500' }
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
    <section className="relative overflow-hidden rounded-[32px] border border-white/20 bg-white/10 px-5 py-6 shadow-[0_32px_120px_-70px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-all duration-500 dark:border-white/10 dark:bg-slate-950/45 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-14 h-56 w-56 rounded-full bg-primary/25 blur-3xl dark:bg-primary/30" />
        <div className="absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-purple-400/25 blur-[140px] dark:bg-purple-700/25" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/12" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 dashboard-header-mobile dashboard-mobile-refresh">
        <div className="grid gap-6 justify-items-center lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)] lg:items-stretch lg:justify-items-stretch xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.7fr)]">
          <div className="flex w-full max-w-3xl flex-col gap-5">
            <div className="h-full min-h-[320px] rounded-[28px] border border-white/18 bg-white/12 p-5 shadow-[0_26px_90px_-60px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/5">
              <div className="flex h-full flex-col gap-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg lg:h-14 lg:w-14 bg-gradient-to-br', greeting.color)}>
                      <GreetingIcon className="h-6 w-6 text-white lg:h-7 lg:w-7" />
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">
                        {greeting.text}, {userName}!
                      </h1>
                      <p className="text-sm text-muted-foreground lg:text-base">
                        You have{' '}
                        <span className="font-semibold text-foreground">{tripCount}</span>{' '}
                        {tripCount === 1 ? 'trip' : 'trips'} planned
                      </p>
                    </div>
                  </div>

                  <div className="order-3 flex flex-wrap items-center justify-start gap-2 text-[0.65rem] uppercase tracking-[0.32em] text-white/70 sm:order-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1.5 shadow-inner backdrop-blur-xl">
                      <SparklesIcon className="h-4 w-4 text-yellow-300" />
                      Live analytics
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1.5 shadow-inner backdrop-blur-xl">
                      <CalendarIcon className="h-4 w-4 text-cyan-200" />
                      Smart filters
                    </span>
                  </div>

                  <div className="order-2 flex w-full justify-start sm:w-auto sm:justify-end xl:order-3">
                    <AdvancedMetricsModal
                      trips={trips}
                      trigger={
                        <Button className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-700 hover:to-indigo-700 sm:w-auto">
                          <BarChart3Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                          Open analytics
                          <SparklesIcon className="h-3 w-3 text-yellow-300 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                {trips.length > 0 && (
                  <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 shadow-[0_18px_70px_-55px_rgba(15,23,42,0.6)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                    <CompactTopDestinations trips={trips} />
                  </div>
                )}

                <div className="hidden lg:block">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-lg dark:border-white/10 dark:bg-white/5" />
                    <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search your trips..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full rounded-2xl border border-transparent bg-transparent py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-white/50 focus:outline-none"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full items-stretch justify-center lg:justify-end">
            <div className="w-full max-w-md lg:max-w-[360px]">
              <WeatherWidget />
            </div>
          </div>
        </div>

        <div className="lg:hidden flex flex-col gap-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-lg dark:border-white/10 dark:bg-white/5" />
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full rounded-2xl border border-transparent bg-transparent py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-white/40"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] border border-white/18 bg-white/12 shadow-[0_22px_80px_-62px_rgba(15,23,42,0.68)] backdrop-blur-2xl dark:border-white/12 dark:bg-white/5" />
          <div className="relative flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:p-5 filter-tabs-mobile">
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {filterOptions.map((option) => {
                const isActive = filter === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm',
                      isActive
                        ? 'bg-white/90 text-slate-900 shadow-lg dark:bg-white/90'
                        : 'bg-white/12 text-white/70 hover:bg-white/16'
                    )}
                  >
                    <option.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">{option.label.split(' ')[0]}</span>
                    <span
                      className={cn(
                        'ml-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                        isActive ? 'bg-slate-900 text-white' : 'bg-white/10 text-white/70'
                      )}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
              {availableYears.length > 1 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/18 bg-white/12 px-3 py-2 text-xs text-white/80 shadow-inner backdrop-blur-lg dark:border-white/12 dark:bg-white/5">
                  <FilterIcon className="h-4 w-4" />
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-8 w-24 rounded-lg border-0 bg-transparent text-xs text-white focus:ring-0">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2',
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/12 text-white/70 hover:bg-white/16'
                )}
                title="Interactive map view"
              >
                <MapIcon
                  className={cn(
                    'h-4 w-4 transition-transform duration-300',
                    viewMode === 'map' && 'scale-110'
                  )}
                />
                <span className="uppercase tracking-[0.26em]">Map</span>
              </button>

              <div className="hidden items-center rounded-xl border border-white/18 bg-white/10 p-1 shadow-inner backdrop-blur-lg sm:flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded-lg p-1.5 transition-all duration-200',
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  )}
                  title="Grid view"
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    'rounded-lg p-1.5 transition-all duration-200',
                    viewMode === 'map'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  )}
                  title="Map view"
                >
                  <MapIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
