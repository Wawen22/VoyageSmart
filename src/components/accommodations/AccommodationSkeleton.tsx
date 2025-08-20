'use client';

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/SkeletonLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListIcon, MapIcon } from 'lucide-react';

export default function AccommodationSkeleton() {
  // Create an array of 6 accommodations for the skeleton
  const accommodations = Array.from({ length: 6 });

  return (
    <div className="space-y-6 animate-glass-fade-in">
      {/* Controls Section Skeleton */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Skeleton width={150} height={40} className="rounded-xl" />
            <div className="hidden md:flex items-center space-x-4">
              <Skeleton width={80} height={20} className="rounded-full" />
              <Skeleton width={90} height={20} className="rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* View Options Skeleton */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton width={120} height={24} className="mb-2" />
            <Skeleton width={200} height={16} />
          </div>
          <div className="glass-nav rounded-xl p-1 border border-white/20">
            <div className="flex space-x-1">
              <Skeleton width={100} height={36} className="rounded-lg" />
              <Skeleton width={100} height={36} className="rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Accommodations Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 accommodations-grid-mobile">
        {accommodations.map((_, index) => (
          <div
            key={index}
            className="glass-card rounded-2xl overflow-hidden animate-stagger-in accommodation-card-mobile"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="p-4 md:p-6">
              {/* Header Section Skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <Skeleton width={40} height={40} className="rounded-xl" />
                    <Skeleton width="60%" height={24} />
                  </div>
                  <Skeleton width={80} height={20} className="rounded-full" />
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Skeleton width={60} height={32} className="rounded-xl" />
                </div>
              </div>

              {/* Information Sections Skeleton */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton width={20} height={20} className="rounded-lg" />
                      <Skeleton width={60} height={16} />
                      <Skeleton width={100} height={16} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton width={20} height={20} className="rounded-lg" />
                      <Skeleton width={70} height={16} />
                      <Skeleton width={100} height={16} />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10">
                  <div className="flex items-center space-x-2">
                    <Skeleton width={20} height={20} className="rounded-lg" />
                    <Skeleton width="80%" height={16} />
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-end gap-2">
                  <Skeleton width={60} height={36} className="rounded-xl" />
                  <Skeleton width={60} height={36} className="rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
