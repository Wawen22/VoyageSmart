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
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {getGreeting()}, {userName}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg ml-5">
            Ready for your next adventure? You have{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">{tripCount}</span>{' '}
            {tripCount === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className={cn(
              "relative transition-all duration-300",
              isSearchFocused ? "scale-105" : ""
            )}>
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search your adventures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:shadow-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  viewMode === 'grid' 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <GridIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  viewMode === 'list' 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Create Trip Button */}
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 group",
                  isActive
                    ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg scale-105`
                    : "bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:scale-105"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{option.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
