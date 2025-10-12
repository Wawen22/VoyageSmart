'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  GridIcon, 
  ListIcon,
  SparklesIcon,
  TrendingUpIcon,
  MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModernDashboardHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: 'all' | 'upcoming' | 'past';
  setFilter: (filter: 'all' | 'upcoming' | 'past') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  tripCount: number;
  userName?: string;
}

export default function ModernDashboardHeader({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  viewMode,
  setViewMode,
  tripCount,
  userName = 'Explorer'
}: ModernDashboardHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filterOptions = [
    { 
      value: 'all', 
      label: 'All Adventures', 
      icon: MapIcon,
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      value: 'upcoming', 
      label: 'Upcoming', 
      icon: SparklesIcon,
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      value: 'past', 
      label: 'Memories', 
      icon: TrendingUpIcon,
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      <div className="relative z-10 px-6 py-8 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-8 w-2 rounded-full bg-gradient-to-b from-blue-500 to-purple-600" />
              <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text dark:from-white dark:to-slate-300 lg:text-4xl">
                {getGreeting()}, {userName}
              </h1>
            </div>
            <p className="ml-5 text-lg text-slate-600 dark:text-slate-400">
              Ready for your next adventure? You have{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{tripCount}</span>{' '}
              {tripCount === 1 ? 'trip' : 'trips'} planned
            </p>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div
                className={cn(
                  "relative transition-all duration-300",
                  isSearchFocused ? "scale-105" : ""
                )}
              >
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 transform text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your adventures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3 pl-12 pr-4 text-base shadow-sm transition-all duration-300 focus:border-blue-500 focus:outline-none focus:shadow-lg dark:border-slate-700 dark:bg-slate-800/80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transform text-slate-400 transition-colors hover:text-slate-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-white/80 p-1 shadow-sm backdrop-blur-sm dark:bg-slate-800/80">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "rounded-lg p-2 transition-all duration-200",
                    viewMode === 'grid'
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "rounded-lg p-2 transition-all duration-200",
                    viewMode === 'list'
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Create Trip Button */}
              <Button
                asChild
                className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:shadow-xl hover:to-purple-700"
              >
                <Link href="/trips/new" className="flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">New Adventure</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = filter === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                    isActive
                      ? `scale-105 bg-gradient-to-r ${option.gradient} text-white shadow-lg`
                      : "bg-white/60 text-slate-700 hover:scale-105 hover:bg-white/80 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{option.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
