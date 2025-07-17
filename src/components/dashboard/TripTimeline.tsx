'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format, parseISO, isValid, differenceInDays, isSameMonth, isSameYear } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
  StarIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PlusIcon,
  SparklesIcon,
  RocketIcon,
  TrophyIcon,
  CameraIcon,
  EditIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  created_at: string;
};

interface TripTimelineProps {
  trips: Trip[];
  searchTerm?: string;
  filter?: 'all' | 'upcoming' | 'ongoing' | 'past';
}

interface TimelineTrip extends Trip {
  status: 'upcoming' | 'ongoing' | 'completed' | 'planning';
  daysUntil?: number;
  duration?: number;
  sortDate: Date;
}

export default function TripTimeline({ trips, searchTerm = '', filter = 'all' }: TripTimelineProps) {
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);


  // Process and categorize trips
  const processedTrips = useMemo(() => {
    const now = new Date();
    
    return trips.map((trip): TimelineTrip => {
      const startDate = trip.start_date ? parseISO(trip.start_date) : null;
      const endDate = trip.end_date ? parseISO(trip.end_date) : null;
      
      let status: TimelineTrip['status'] = 'planning';
      let daysUntil: number | undefined;
      let duration: number | undefined;
      let sortDate = new Date(trip.created_at);

      if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
        duration = differenceInDays(endDate, startDate) + 1;
        
        if (now < startDate) {
          status = 'upcoming';
          daysUntil = differenceInDays(startDate, now);
          sortDate = startDate;
        } else if (now >= startDate && now <= endDate) {
          status = 'ongoing';
          sortDate = startDate;
        } else {
          status = 'completed';
          sortDate = endDate;
        }
      } else if (startDate && isValid(startDate)) {
        if (now < startDate) {
          status = 'upcoming';
          daysUntil = differenceInDays(startDate, now);
          sortDate = startDate;
        } else {
          status = 'ongoing';
          sortDate = startDate;
        }
      }

      return {
        ...trip,
        status,
        daysUntil,
        duration,
        sortDate
      };
    });
  }, [trips]);



  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    let filtered = processedTrips;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(trip => {
        if (filter === 'upcoming') return trip.status === 'upcoming';
        if (filter === 'ongoing') return trip.status === 'ongoing';
        if (filter === 'past') return trip.status === 'completed';
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.name.toLowerCase().includes(searchLower) ||
        trip.destination?.toLowerCase().includes(searchLower) ||
        trip.description?.toLowerCase().includes(searchLower)
      );
    }



    // Sort trips chronologically for timeline: past to future (left to right)
    // Timeline Layout: [Passato] ← → [Oggi] ← → [Futuro]
    return filtered.sort((a, b) => {
      // Get actual dates for comparison, fallback to created_at for planning trips
      const getComparisonDate = (trip: TimelineTrip) => {
        if (trip.start_date) {
          return new Date(trip.start_date).getTime();
        }
        // For planning trips without dates, use created_at but put them at the end (far future)
        return new Date(trip.created_at).getTime() + 1000000000000;
      };

      const aDate = getComparisonDate(a);
      const bDate = getComparisonDate(b);

      // Sort by date: earliest (past) first → latest (future) last
      // This creates a natural timeline flow from left to right
      return aDate - bDate;
    });
  }, [processedTrips, filter, searchTerm]);

  // Group trips by time periods
  const groupedTrips = useMemo(() => {
    const groups: { [key: string]: TimelineTrip[] } = {};
    
    filteredTrips.forEach(trip => {
      let groupKey: string;
      
      if (trip.status === 'ongoing') {
        groupKey = 'Currently Traveling';
      } else if (trip.status === 'upcoming') {
        if (trip.daysUntil !== undefined && trip.daysUntil <= 7) {
          groupKey = 'This Week';
        } else if (trip.daysUntil !== undefined && trip.daysUntil <= 30) {
          groupKey = 'This Month';
        } else {
          const year = trip.sortDate.getFullYear();
          groupKey = `Upcoming ${year}`;
        }
      } else if (trip.status === 'completed') {
        const year = trip.sortDate.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year === currentYear) {
          groupKey = `Completed ${year}`;
        } else {
          groupKey = `Memories ${year}`;
        }
      } else {
        groupKey = 'Planning';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(trip);
    });
    
    return groups;
  }, [filteredTrips]);

  // Create timeline items with year separators
  const timelineItems = useMemo(() => {
    const items: Array<{ type: 'year' | 'trip'; data: any; key: string }> = [];
    const currentYear = new Date().getFullYear();

    filteredTrips.forEach((trip, index) => {
      const tripYear = trip.start_date ? new Date(trip.start_date).getFullYear() : currentYear;
      const prevTrip = filteredTrips[index - 1];
      const prevYear = prevTrip?.start_date ? new Date(prevTrip.start_date).getFullYear() : null;

      // Add year separator if this is a new year
      if (!prevYear || prevYear !== tripYear) {
        items.push({
          type: 'year',
          data: {
            year: tripYear,
            isCurrentYear: tripYear === currentYear
          },
          key: `year-${tripYear}`
        });
      }

      // Add the trip
      items.push({
        type: 'trip',
        data: trip,
        key: `trip-${trip.id}`
      });
    });

    return items;
  }, [filteredTrips]);

  // Initialize scroll state and auto-scroll to current year
  useEffect(() => {
    const container = document.getElementById('timeline-container');
    if (container) {
      setCanScrollRight(container.scrollWidth > container.clientWidth);

      // Auto-scroll to current year on load
      const currentYear = new Date().getFullYear();
      const currentYearIndex = timelineItems.findIndex(
        item => item.type === 'year' && item.data.year === currentYear
      );

      if (currentYearIndex > 0) {
        // Calculate position to center the current year
        const itemWidth = 250; // Average width including gaps
        const scrollPosition = Math.max(0, (currentYearIndex * itemWidth) - (container.clientWidth / 2));

        setTimeout(() => {
          container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }, 500); // Small delay to ensure everything is rendered
      }
    }
  }, [timelineItems]);

  const getGroupIcon = (groupName: string) => {
    if (groupName.includes('Currently Traveling')) return StarIcon;
    if (groupName.includes('This Week')) return RocketIcon;
    if (groupName.includes('This Month')) return SparklesIcon;
    if (groupName.includes('Upcoming')) return CalendarIcon;
    if (groupName.includes('Completed')) return TrophyIcon;
    if (groupName.includes('Memories')) return CameraIcon;
    if (groupName.includes('Planning')) return EditIcon;
    return SparklesIcon;
  };

  const getStatusConfig = (status: TimelineTrip['status']) => {
    switch (status) {
      case 'ongoing':
        return {
          color: 'from-orange-500 to-red-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          textColor: 'text-orange-700 dark:text-orange-300',
          icon: PlayCircleIcon,
          dotColor: 'bg-orange-500',
          pulseClass: 'animate-pulse'
        };
      case 'upcoming':
        return {
          color: 'from-emerald-500 to-teal-500',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          icon: CalendarIcon,
          dotColor: 'bg-emerald-500',
          pulseClass: 'animate-bounce'
        };
      case 'completed':
        return {
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          textColor: 'text-purple-700 dark:text-purple-300',
          icon: CheckCircleIcon,
          dotColor: 'bg-purple-500',
          pulseClass: ''
        };
      default:
        return {
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          icon: PlusIcon,
          dotColor: 'bg-blue-500',
          pulseClass: ''
        };
    }
  };



  if (filteredTrips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6">
          <ClockIcon className="h-12 w-12 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No trips in timeline
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {searchTerm ? 'No results for current search.' : 'Start planning your first trip to see the timeline!'}
        </p>
        {!searchTerm && (
          <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Link href="/trips/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Trip
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Scroll handlers
  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    const scrollAmount = 250; // Adjusted for mixed content (years + cards)
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);

    // Update scroll button states
    setTimeout(() => {
      setCanScrollLeft(newPosition > 0);
      setCanScrollRight(newPosition < container.scrollWidth - container.clientWidth);
    }, 300);
  };

  // Format date for timeline
  const formatTimelineDate = (dateString: string | null) => {
    if (!dateString) return { day: '--', month: 'TBD', year: '' };
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return { day: '--', month: 'Invalid', year: '' };
      return {
        day: format(date, 'dd'),
        month: format(date, 'MMM'),
        year: format(date, 'yyyy')
      };
    } catch {
      return { day: '--', month: 'Invalid', year: '' };
    }
  };

  return (
    <div className="relative">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Trip Timeline</h2>
            <p className="text-sm text-muted-foreground">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} • Scroll to explore
            </p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className="h-8 w-8 p-0"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className="h-8 w-8 p-0"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-20 left-0 right-0 h-1 timeline-gradient-line z-0 rounded-full"></div>



        {/* Scrollable Container */}
        <div
          id="timeline-container"
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            setScrollPosition(target.scrollLeft);
            setCanScrollLeft(target.scrollLeft > 0);
            setCanScrollRight(target.scrollLeft < target.scrollWidth - target.clientWidth);
          }}
        >
          {timelineItems.map((item) => {
            if (item.type === 'year') {
              // Year Separator
              return (
                <div key={item.key} className="relative flex-shrink-0 w-20 sm:w-24 flex flex-col items-center justify-center">
                  {/* Timeline Dot for Year */}
                  <div className="flex justify-center mb-3">
                    <div className={cn(
                      "relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border-3 border-background z-10 flex items-center justify-center",
                      item.data.isCurrentYear ? "bg-orange-500" : "bg-blue-500"
                    )}>
                      <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />

                      {/* Pulse Ring for Current Year */}
                      {item.data.isCurrentYear && (
                        <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-75"></div>
                      )}
                    </div>
                  </div>

                  {/* Year Badge - Compact Design */}
                  <div className={cn(
                    "px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-md backdrop-blur-sm border text-center min-w-0",
                    item.data.isCurrentYear
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-300/50 shadow-orange-500/30"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-300/30 shadow-blue-500/20"
                  )}>
                    <div className="text-lg sm:text-xl font-black leading-none">{item.data.year}</div>
                    {item.data.isCurrentYear && (
                      <div className="text-xs mt-0.5 opacity-90 leading-none">🕐</div>
                    )}
                  </div>
                </div>
              );
            } else {
              // Trip Card
              const trip = item.data;
              const config = getStatusConfig(trip.status);
              const Icon = config.icon;
              const isHovered = hoveredTrip === trip.id;
              const startDate = formatTimelineDate(trip.start_date);
              const endDate = formatTimelineDate(trip.end_date);

              return (
                <div key={item.key} className="relative flex-shrink-0 w-80">
                  {/* Timeline Dot */}
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      "relative w-6 h-6 rounded-full border-4 border-background z-10 flex items-center justify-center",
                      config.dotColor,
                      config.pulseClass
                    )}>
                      <Icon className="h-3 w-3 text-white" />

                      {/* Pulse Ring for Ongoing Trips */}
                      {trip.status === 'ongoing' && (
                        <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-75"></div>
                      )}
                    </div>
                  </div>

                  {/* Trip Card */}
                  <Link href={`/trips/${trip.id}`} className="block group">
                    <div
                      className={cn(
                        "relative bg-card rounded-2xl border-2 overflow-hidden timeline-card-3d",
                        config.bgColor,
                        isHovered && "shadow-2xl"
                      )}
                      onMouseEnter={() => setHoveredTrip(trip.id)}
                      onMouseLeave={() => setHoveredTrip(null)}
                    >
                      {/* Card Header with Gradient */}
                      <div className={cn(
                        "relative h-24 bg-gradient-to-br p-4 text-white",
                        config.color
                      )}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>

                        {/* Status Badge */}
                        <div className="relative z-10 flex justify-between items-start">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                            {trip.status === 'ongoing' && '🌟 Traveling'}
                            {trip.status === 'upcoming' && '🚀 Upcoming'}
                            {trip.status === 'completed' && '✅ Completed'}
                            {trip.status === 'planning' && '📋 Planning'}
                          </div>

                          {trip.daysUntil !== undefined && trip.status === 'upcoming' && (
                            <div className="bg-white/30 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold">
                              {trip.daysUntil === 0 ? 'Today!' : `${trip.daysUntil}d`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-3">
                        {/* Trip Title */}
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {trip.name}
                        </h3>

                        {/* Destination */}
                        {trip.destination && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{trip.destination}</span>
                          </div>
                        )}

                        {/* Date Range */}
                        <div className="flex items-center justify-between">
                          {trip.start_date ? (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Departure</div>
                              <div className="font-bold text-foreground">{startDate.day}</div>
                              <div className="text-xs text-muted-foreground">{startDate.month}</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Date</div>
                              <div className="font-bold text-muted-foreground">TBD</div>
                            </div>
                          )}

                          {trip.start_date && trip.end_date && (
                            <>
                              <div className="flex-1 flex justify-center">
                                <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Return</div>
                                <div className="font-bold text-foreground">{endDate.day}</div>
                                <div className="text-xs text-muted-foreground">{endDate.month}</div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Duration */}
                        {trip.duration && (
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full py-1 px-3">
                            <ClockIcon className="h-3 w-3" />
                            <span>{trip.duration} {trip.duration === 1 ? 'day' : 'days'}</span>
                          </div>
                        )}
                      </div>

                      {/* Hover Glow Effect */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 rounded-2xl",
                        config.color,
                        isHovered && "opacity-10"
                      )} />
                    </div>
                  </Link>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Timeline Progress Indicator */}
      {timelineItems.length > 4 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
            <span className="text-xs text-muted-foreground">Scroll to see all items</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(timelineItems.length / 4) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === Math.floor(scrollPosition / 250) ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 p-4 bg-muted/30 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
          <span className="text-xs font-medium text-muted-foreground">Traveling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
          <span className="text-xs font-medium text-muted-foreground">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
          <span className="text-xs font-medium text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
          <span className="text-xs font-medium text-muted-foreground">Planning</span>
        </div>
      </div>
    </div>
  );
}
