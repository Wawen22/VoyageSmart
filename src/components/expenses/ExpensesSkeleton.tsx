'use client';

import React from 'react';
import { Skeleton, SkeletonText } from '@/components/ui/SkeletonLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptIcon, BarChart3Icon } from 'lucide-react';

export default function ExpensesSkeleton() {
  // Create an array of 5 expenses for the skeleton
  const expenses = Array.from({ length: 5 });

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
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center">
              <ReceiptIcon className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center">
              <BarChart3Icon className="h-4 w-4 mr-2" />
              Balances
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Expenses list skeleton */}
      <div className="space-y-4">
        {expenses.map((_, index) => (
          <Card key={index} className="border border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton 
                        variant="circular" 
                        width={24} 
                        height={24} 
                        animation="wave"
                      />
                      <Skeleton 
                        variant="text" 
                        width={120} 
                        height={20} 
                        animation="wave"
                      />
                    </div>
                    <Skeleton 
                      variant="rounded" 
                      width={80} 
                      height={28} 
                      animation="wave"
                      className="hidden sm:block"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Skeleton 
                      variant="circular" 
                      width={16} 
                      height={16} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="text" 
                      width="40%" 
                      height={16} 
                      animation="wave"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton 
                      variant="circular" 
                      width={16} 
                      height={16} 
                      animation="wave"
                    />
                    <Skeleton 
                      variant="text" 
                      width="30%" 
                      height={16} 
                      animation="wave"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <Skeleton 
                    variant="text" 
                    width={80} 
                    height={28} 
                    animation="wave"
                    className="sm:hidden"
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
