'use client';

import React from 'react';
import { Skeleton, SkeletonText } from '@/components/ui/SkeletonLoader';

export default function ItinerarySkeleton() {
  // Create an array of 3 days for the skeleton
  const days = Array.from({ length: 3 });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton width={200} height={32} className="mb-4" />
        <Skeleton width={100} height={40} className="rounded-md" />
      </div>

      {/* Days skeleton */}
      <div className="space-y-8">
        {days.map((_, index) => (
          <div key={index} className="border border-border rounded-lg p-4 space-y-4">
            {/* Day header */}
            <div className="flex justify-between items-center">
              <Skeleton width={250} height={24} />
              <div className="flex space-x-2">
                <Skeleton width={80} height={36} className="rounded-md" />
                <Skeleton width={80} height={36} className="rounded-md" />
              </div>
            </div>

            {/* Day notes */}
            <Skeleton width="100%" height={1} className="my-4" />

            {/* Activities */}
            <div className="space-y-3">
              {Array.from({ length: 2 + index }).map((_, actIndex) => (
                <div key={actIndex} className="border border-border rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton width={180} height={20} />
                    <Skeleton width={80} height={20} />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Skeleton width={16} height={16} variant="circular" />
                    <Skeleton width={120} height={16} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton width={100} height={16} />
                    <div className="flex space-x-2">
                      <Skeleton width={24} height={24} variant="circular" />
                      <Skeleton width={24} height={24} variant="circular" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
