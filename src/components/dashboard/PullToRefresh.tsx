'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0) return;
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0 || !startY) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0) {
      e.preventDefault();
      const dampedDistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(dampedDistance);
      setIsPulling(dampedDistance > 10);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isPulling) {
      resetPull();
      return;
    }

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    resetPull();
  };

  const resetPull = () => {
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, pullDistance, threshold, disabled]);

  const getRefreshStatus = () => {
    if (isRefreshing) return 'Refreshing...';
    if (pullDistance >= threshold) return 'Release to refresh';
    if (isPulling) return 'Pull to refresh';
    return '';
  };

  const getIconRotation = () => {
    if (isRefreshing) return 'animate-spin';
    return `rotate-${Math.min(Math.floor(pullDistance / threshold * 180), 180)}`;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div 
        className={cn(
          "lg:hidden fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
          "bg-gradient-to-b from-primary/10 to-transparent pull-to-refresh-indicator",
          isPulling || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
          transform: `translateY(${isPulling || isRefreshing ? 0 : -100}%)`
        }}
      >
        <div className="flex flex-col items-center justify-center h-full pt-4">
          <div className={cn(
            "w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-2 transition-all duration-300 pull-to-refresh-icon",
            pullDistance >= threshold && "bg-primary/30 scale-110"
          )}>
            <RefreshCwIcon 
              className={cn(
                "h-4 w-4 text-primary transition-transform duration-300",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)`
              }}
            />
          </div>
          <p className="text-xs text-primary font-medium">
            {getRefreshStatus()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${isPulling ? pullDistance * 0.3 : isRefreshing ? 20 : 0}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}
