'use client';

import { Card, CardContent } from '@/components/ui/card';

interface SkeletonCardProps {
  variant?: 'trip' | 'stats' | 'default';
  className?: string;
}

export default function SkeletonCard({ variant = 'default', className = '' }: SkeletonCardProps) {
  if (variant === 'trip') {
    return (
      <Card className={`overflow-hidden bg-card/80 backdrop-blur-sm border border-border/50 ${className}`}>
        {/* Status indicator skeleton */}
        <div className="w-full h-1.5 bg-gradient-to-r from-muted via-muted/50 to-muted skeleton-breathe" />
        
        <CardContent className="p-6 space-y-5">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded-lg skeleton-breathe" style={{ width: '75%' }} />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded skeleton-breathe" />
                  <div className="h-4 bg-muted rounded skeleton-breathe" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="w-16 h-6 bg-muted rounded-full skeleton-breathe" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '90%' }} />
              <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '70%' }} />
            </div>
          </div>

          {/* Dates section skeleton */}
          <div className="p-3 bg-muted/20 rounded-xl border border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-xl skeleton-breathe" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded skeleton-breathe" style={{ width: '80%' }} />
                <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded skeleton-breathe" />
              <div className="w-4 h-4 bg-muted rounded skeleton-breathe" />
              <div className="w-12 h-3 bg-muted rounded skeleton-breathe ml-2" />
            </div>
            <div className="w-16 h-4 bg-muted rounded skeleton-breathe" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'stats') {
    return (
      <Card className={`overflow-hidden bg-gradient-to-br from-card to-card/80 border border-border/50 ${className}`}>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-xl skeleton-breathe" />
            <div className="w-12 h-5 bg-muted rounded-full skeleton-breathe" />
          </div>

          {/* Value and title skeleton */}
          <div className="space-y-1">
            <div className="w-16 h-8 sm:h-10 bg-muted rounded skeleton-breathe" />
            <div className="w-24 h-4 bg-muted rounded skeleton-breathe" />
            <div className="w-32 h-3 bg-muted rounded skeleton-breathe" />
          </div>

          {/* Progress bar skeleton */}
          <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div className="h-full bg-muted rounded-full skeleton-breathe" style={{ width: '60%' }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default skeleton
  return (
    <Card className={`overflow-hidden bg-card border border-border/50 ${className}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-muted rounded-full skeleton-breathe" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded skeleton-breathe" style={{ width: '75%' }} />
            <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '50%' }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded skeleton-breathe" />
          <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '80%' }} />
          <div className="h-3 bg-muted rounded skeleton-breathe" style={{ width: '60%' }} />
        </div>
      </CardContent>
    </Card>
  );
}
