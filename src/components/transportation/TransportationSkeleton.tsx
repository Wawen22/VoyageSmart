'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/SkeletonLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListIcon, MapIcon } from 'lucide-react';

export default function TransportationSkeleton() {
  // Create an array of 6 transportation items for the skeleton
  const transportations = Array.from({ length: 6 });

  return (
    <div className="animate-glass-fade-in">
      {/* Transportation grid skeleton with glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 transportation-grid-mobile">
        {transportations.map((_, index) => (
          <div
            key={index}
            className="glass-card rounded-2xl overflow-hidden animate-pulse transportation-card-mobile"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Modern Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-cyan-500/5 opacity-50"></div>
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl opacity-30"></div>

            <div className="relative z-10 p-4 md:p-6">
              {/* Header Section Skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                    <div className="p-2 rounded-xl bg-sky-500/20 backdrop-blur-sm border border-white/20 animate-pulse">
                      <div className="w-5 h-5 bg-sky-500/30 rounded"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="h-5 bg-foreground/20 rounded-lg w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="h-6 bg-sky-500/20 rounded-full w-16 animate-pulse"></div>
                    <div className="h-6 bg-indigo-500/20 rounded-full w-20 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex-shrink-0 sm:text-right sm:ml-4">
                  <div className="glass-info-card px-3 py-1.5 rounded-xl">
                    <div className="h-4 bg-foreground/20 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Travel Information Section Skeleton */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Departure Info Skeleton */}
                  <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                    <div className="flex items-center mb-3">
                      <div className="p-1 rounded-lg bg-green-500/20 mr-2">
                        <div className="w-2 h-2 bg-green-500/50 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-16 animate-pulse"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-blue-500/20">
                          <div className="w-3 h-3 bg-blue-500/50 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="h-4 bg-foreground/20 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-purple-500/20">
                          <div className="w-3 h-3 bg-purple-500/50 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-foreground/20 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrival Info Skeleton */}
                  <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                    <div className="flex items-center mb-3">
                      <div className="p-1 rounded-lg bg-red-500/20 mr-2">
                        <div className="w-2 h-2 bg-red-500/50 rounded-full animate-pulse"></div>
                      </div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-16 animate-pulse"></div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-blue-500/20">
                          <div className="w-3 h-3 bg-blue-500/50 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="h-4 bg-foreground/20 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-muted-foreground/20 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-lg bg-purple-500/20">
                          <div className="w-3 h-3 bg-purple-500/50 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-foreground/20 rounded w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-end gap-2">
                  <div className="h-9 bg-background/30 rounded-xl w-16 animate-pulse"></div>
                  <div className="h-9 bg-sky-500/20 rounded-xl w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
