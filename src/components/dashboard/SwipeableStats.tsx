'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  TrendingUpIcon, 
  CalendarIcon, 
  MapPinIcon, 
  DollarSignIcon, 
  ClockIcon,
  PlaneTakeoffIcon,
  CameraIcon,
  UsersIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileAnalyticsButton from './MobileAnalyticsButton';

interface SwipeableStatsProps {
  trips: any[];
  className?: string;
  showAnalyticsButton?: boolean;
}

interface StatCard {
  id: string;
  icon: any;
  value: string | number;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export default function SwipeableStats({ trips, className, showAnalyticsButton = false }: SwipeableStatsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate stats from trips
  const calculateStats = (): StatCard[] => {
    const totalTrips = trips.length;
    const upcomingTrips = trips.filter(trip => {
      const startDate = new Date(trip.start_date);
      return startDate > new Date();
    }).length;
    
    const ongoingTrips = trips.filter(trip => {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      const now = new Date();
      return startDate <= now && endDate >= now;
    }).length;

    const completedTrips = trips.filter(trip => {
      const endDate = new Date(trip.end_date);
      return endDate < new Date();
    }).length;

    const totalBudget = trips.reduce((sum, trip) => sum + (trip.budget_total || 0), 0);
    
    const avgDuration = trips.length > 0 
      ? Math.round(trips.reduce((sum, trip) => {
          if (trip.start_date && trip.end_date) {
            const start = new Date(trip.start_date);
            const end = new Date(trip.end_date);
            const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + duration;
          }
          return sum;
        }, 0) / trips.length)
      : 0;

    const uniqueDestinations = new Set(trips.map(trip => trip.destination).filter(Boolean)).size;

    return [
      {
        id: 'total',
        icon: TrendingUpIcon,
        value: totalTrips,
        label: 'Total Trips',
        description: 'All your adventures',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300'
      },
      {
        id: 'upcoming',
        icon: CalendarIcon,
        value: upcomingTrips,
        label: 'Upcoming',
        description: 'Future adventures',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-700 dark:text-emerald-300'
      },
      {
        id: 'ongoing',
        icon: PlaneTakeoffIcon,
        value: ongoingTrips,
        label: 'Ongoing',
        description: 'Currently traveling',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-300'
      },
      {
        id: 'completed',
        icon: CameraIcon,
        value: completedTrips,
        label: 'Completed',
        description: 'Memories made',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300'
      },
      {
        id: 'budget',
        icon: DollarSignIcon,
        value: `€${totalBudget.toLocaleString()}`,
        label: 'Total Budget',
        description: 'Investment in experiences',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300'
      },
      {
        id: 'duration',
        icon: ClockIcon,
        value: `${avgDuration}d`,
        label: 'Avg Duration',
        description: 'Days per trip',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        textColor: 'text-indigo-700 dark:text-indigo-300'
      },
      {
        id: 'destinations',
        icon: MapPinIcon,
        value: uniqueDestinations,
        label: 'Destinations',
        description: 'Places explored',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30',
        textColor: 'text-rose-700 dark:text-rose-300'
      }
    ];
  };

  const stats = calculateStats();
  const cardsPerView = 2.2; // Show 2.2 cards at a time
  const maxIndex = Math.max(0, stats.length - Math.floor(cardsPerView));

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    setTranslateX(-diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50;
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
      } else if (translateX < 0 && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
    
    setIsDragging(false);
    setTranslateX(0);
    setStartX(0);
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    setTranslateX(-diff);
  };

  const handleMouseEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50;
    if (Math.abs(translateX) > threshold) {
      if (translateX > 0 && currentIndex < maxIndex) {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
      } else if (translateX < 0 && currentIndex > 0) {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
      }
    }
    
    setIsDragging(false);
    setTranslateX(0);
    setStartX(0);
  };

  return (
    <div className={cn("lg:hidden swipeable-stats-mobile bg-gradient-to-r from-blue-50/40 to-purple-50/40 dark:from-blue-950/15 dark:to-purple-950/15 rounded-xl border border-border/40 shadow-sm", className)}>
      <div className="mb-3 px-4 pt-4">
        <div className="flex items-center justify-between stats-header-mobile">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Stats</h3>
          {showAnalyticsButton && (
            <MobileAnalyticsButton trips={trips} />
          )}
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(-${currentIndex * (100 / cardsPerView)}% + ${translateX}px))`
          }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <div className={cn(
                  "bg-card rounded-xl p-3 border border-border/50 h-20 transition-all duration-200 stat-card mobile-touch-optimized",
                  "hover:shadow-md hover:scale-[1.02]",
                  stat.bgColor
                )}>
                  <div className="flex items-center gap-2 h-full">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      "bg-background/50"
                    )}>
                      <Icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-lg font-bold truncate", stat.textColor)}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1 mt-3 pb-4">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-200 dots-indicator mobile-touch-optimized",
              currentIndex === index
                ? "bg-primary w-4 active"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
