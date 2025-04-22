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
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Skeleton width={32} height={32} variant="circular" />
          <Skeleton width={200} height={32} />
        </div>
        <Skeleton width={150} height={40} className="rounded-md" />
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="list" className="flex items-center">
              <ListIcon className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center">
              <MapIcon className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Accommodations grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accommodations.map((_, index) => (
          <Card key={index} className="overflow-hidden border border-border">
            <CardContent className="p-0">
              <div className="relative">
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={160} 
                  animation="wave"
                />
                <div className="absolute top-2 right-2">
                  <Skeleton 
                    variant="rounded" 
                    width={60} 
                    height={24} 
                    animation="wave"
                  />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <Skeleton 
                  variant="text" 
                  width="80%" 
                  height={24} 
                  animation="wave"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton 
                      variant="circular" 
                      width={16} 
                      height={16} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="text" 
                      width="60%" 
                      height={16} 
                      animation="wave"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton 
                      variant="circular" 
                      width={16} 
                      height={16} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="text" 
                      width="70%" 
                      height={16} 
                      animation="wave"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Skeleton 
                    variant="rounded" 
                    width={40} 
                    height={36} 
                    animation="wave"
                  />
                  <Skeleton 
                    variant="rounded" 
                    width={40} 
                    height={36} 
                    animation="wave"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
