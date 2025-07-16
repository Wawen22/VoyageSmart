'use client';

import { cn } from '@/lib/utils';

interface ModernLoadingSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export default function ModernLoadingSkeleton({ viewMode = 'grid', count = 6 }: ModernLoadingSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image skeleton */}
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-shimmer" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-shimmer" style={{ width: '60%' }} />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full animate-shimmer" style={{ width: '80px' }} />
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '40%' }} />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '70%' }} />
            </div>
            
            {/* Arrow skeleton */}
            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Header skeleton */}
          <div className="relative h-32 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-shimmer">
            {/* Badge skeleton */}
            <div className="absolute top-4 left-4 w-16 h-6 bg-white/30 rounded-full" />
            {/* Heart skeleton */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/30 rounded-full" />
          </div>
          
          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            {/* Title and description */}
            <div className="space-y-3">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-shimmer" style={{ width: '80%' }} />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '60%' }} />
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '90%' }} />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '70%' }} />
              </div>
            </div>
            
            {/* Date info */}
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '75%' }} />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '50%' }} />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '40%' }} />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '60px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats skeleton
export function ModernStatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Icon skeleton */}
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-shimmer" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '60%' }} />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '80%' }} />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '70%' }} />
          </div>
          
          {/* Progress bar skeleton */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
            <div className="h-full bg-slate-300 dark:bg-slate-600 animate-shimmer" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Header skeleton
export function ModernHeaderLoadingSkeleton() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900" />
      
      <div className="relative z-10 px-6 py-8 lg:px-8">
        {/* Welcome section skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-shimmer" style={{ width: '300px' }} />
          </div>
          <div className="ml-5 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" style={{ width: '400px' }} />
        </div>

        {/* Search and actions skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-6">
          <div className="flex-1 max-w-md">
            <div className="h-12 bg-white/80 dark:bg-slate-800/80 rounded-2xl animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-white/80 dark:bg-slate-800/80 rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Filter tabs skeleton */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="w-24 h-10 bg-white/60 dark:bg-slate-800/60 rounded-xl animate-pulse"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
