'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CalendarIcon,
  MapPinIcon,
  DollarSignIcon,
  ClockIcon,
  TrendingUpIcon,
  FilterIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PlayIcon,
  CheckCircleIcon,
  FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
// import { motion, AnimatePresence } from 'framer-motion';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
  destination: string | null;
  preferences?: {
    currency?: string;
    destinations?: any;
  };
  created_at: string;
}

interface AnalyticsTimelineProps {
  trips: Trip[];
}

interface TimelineTrip extends Trip {
  status: 'upcoming' | 'ongoing' | 'completed' | 'planning';
  daysUntil?: number;
  duration?: number;
  sortDate: Date;
  year: number;
  month: number;
}

type ViewMode = 'yearly' | 'monthly' | 'all';
type FilterMode = 'all' | 'completed' | 'upcoming' | 'ongoing' | 'planning';

export default function AnalyticsTimeline({ trips }: AnalyticsTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [compactView, setCompactView] = useState(false);

  // Process and categorize trips
  const processedTrips = useMemo(() => {
    const now = new Date();
    
    return trips.map(trip => {
      const startDate = trip.start_date ? new Date(trip.start_date) : null;
      const endDate = trip.end_date ? new Date(trip.end_date) : null;
      const createdDate = new Date(trip.created_at);
      
      let status: TimelineTrip['status'] = 'planning';
      let daysUntil: number | undefined;
      let duration: number | undefined;
      
      if (startDate && endDate) {
        duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (startDate <= now && endDate >= now) {
          status = 'ongoing';
        } else if (startDate > now) {
          status = 'upcoming';
          daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          status = 'completed';
        }
      }
      
      const sortDate = startDate || createdDate;
      
      return {
        ...trip,
        status,
        daysUntil,
        duration,
        sortDate,
        year: sortDate.getFullYear(),
        month: sortDate.getMonth()
      } as TimelineTrip;
    }).sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  }, [trips]);

  // Filter trips based on current filters
  const filteredTrips = useMemo(() => {
    let filtered = processedTrips;

    if (filterMode !== 'all') {
      filtered = filtered.filter(trip => trip.status === filterMode);
    }

    if (selectedYear) {
      filtered = filtered.filter(trip => trip.year === selectedYear);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.name.toLowerCase().includes(term) ||
        trip.destination?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [processedTrips, filterMode, selectedYear, searchTerm]);

  // Group trips by time period
  const groupedTrips = useMemo(() => {
    const groups: Record<string, TimelineTrip[]> = {};
    
    filteredTrips.forEach(trip => {
      let groupKey: string;
      
      if (viewMode === 'yearly') {
        groupKey = trip.year.toString();
      } else if (viewMode === 'monthly') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupKey = `${monthNames[trip.month]} ${trip.year}`;
      } else {
        groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(trip);
    });
    
    return groups;
  }, [filteredTrips, viewMode]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = [...new Set(processedTrips.map(trip => trip.year))];
    return years.sort((a, b) => b - a);
  }, [processedTrips]);

  // Calculate metrics for current view
  const metrics = useMemo(() => {
    const totalBudget = filteredTrips.reduce((sum, trip) => sum + (trip.budget_total || 0), 0);
    const avgDuration = filteredTrips.length > 0 
      ? filteredTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0) / filteredTrips.length 
      : 0;
    const destinations = new Set(filteredTrips.map(trip => trip.destination).filter(Boolean)).size;
    
    return {
      totalTrips: filteredTrips.length,
      totalBudget,
      avgDuration: Math.round(avgDuration),
      destinations
    };
  }, [filteredTrips]);

  const getStatusConfig = (status: TimelineTrip['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          icon: CheckCircleIcon,
          label: 'Completed'
        };
      case 'ongoing':
        return {
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          icon: PlayIcon,
          label: 'Ongoing'
        };
      case 'upcoming':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          icon: CalendarIcon,
          label: 'Upcoming'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          icon: FileTextIcon,
          label: 'Planning'
        };
    }
  };

  if (trips.length === 0) {
    return (
      <div className="h-64 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
        <div className="text-center space-y-2">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No trips to display</p>
          <p className="text-xs text-muted-foreground">Create your first trip to see the timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {/* Search and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            {/* Compact View Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactView(!compactView)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {compactView ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
              <span className="hidden sm:inline">{compactView ? 'Detailed' : 'Compact'}</span>
              <span className="sm:hidden">{compactView ? 'Detail' : 'Compact'}</span>
            </Button>
          </div>

          {/* Export Button */}
          <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
            <DownloadIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Export Timeline</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          {/* View Mode */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['yearly', 'monthly', 'all'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="rounded-none border-0"
              >
                {mode === 'yearly' ? 'Years' : mode === 'monthly' ? 'Months' : 'All'}
              </Button>
            ))}
          </div>

          {/* Filter Mode */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['all', 'completed', 'ongoing', 'upcoming', 'planning'] as FilterMode[]).map((mode) => (
              <Button
                key={mode}
                variant={filterMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode(mode)}
                className="rounded-none border-0 capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Year Selector */}
        {availableYears.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(null)}
              className={cn(!selectedYear && "bg-primary text-primary-foreground")}
            >
              All Years
            </Button>
            {availableYears.slice(0, 3).map(year => (
              <Button
                key={year}
                variant="outline"
                size="sm"
                onClick={() => setSelectedYear(year)}
                className={cn(selectedYear === year && "bg-primary text-primary-foreground")}
              >
                {year}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUpIcon, value: metrics.totalTrips, label: 'Trips', color: 'blue' },
          { icon: DollarSignIcon, value: formatCurrency(metrics.totalBudget), label: 'Total Budget', color: 'green' },
          { icon: ClockIcon, value: metrics.avgDuration, label: 'Avg Days', color: 'purple' },
          { icon: MapPinIcon, value: metrics.destinations, label: 'Destinations', color: 'orange' }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label}>
              <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    metric.color === 'blue' && "bg-blue-100 dark:bg-blue-900",
                    metric.color === 'green' && "bg-green-100 dark:bg-green-900",
                    metric.color === 'purple' && "bg-purple-100 dark:bg-purple-900",
                    metric.color === 'orange' && "bg-orange-100 dark:bg-orange-900"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      metric.color === 'blue' && "text-blue-600",
                      metric.color === 'green' && "text-green-600",
                      metric.color === 'purple' && "text-purple-600",
                      metric.color === 'orange' && "text-orange-600"
                    )} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {metric.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Travel Timeline
            <Badge variant="secondary" className="ml-auto">
              {Object.keys(groupedTrips).length} {viewMode === 'yearly' ? 'Years' : viewMode === 'monthly' ? 'Months' : 'Periods'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedTrips).length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <FilterIcon className="h-8 w-8 mx-auto" />
                <p>No trips match the current filters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedTrips)
                .sort(([a], [b]) => {
                  if (viewMode === 'all') return 0;
                  return viewMode === 'yearly'
                    ? parseInt(b) - parseInt(a)
                    : new Date(b).getTime() - new Date(a).getTime();
                })
                .map(([period, periodTrips], periodIndex) => (
                  <div key={period} className="relative">
                    {/* Period Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-semibold">{period}</h3>
                      </div>
                      <div className="flex-1 h-px bg-border"></div>
                      <Badge variant="outline">
                        {periodTrips.length} trip{periodTrips.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Timeline Line */}
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

                      {/* Trips */}
                      <div className="space-y-6">
                        {periodTrips.map((trip, index) => {
                          const config = getStatusConfig(trip.status);
                          const Icon = config.icon;
                          const isHovered = hoveredTrip === trip.id;

                          return (
                            <div
                              key={trip.id}
                              className="relative flex items-start gap-3 sm:gap-6"
                              onMouseEnter={() => setHoveredTrip(trip.id)}
                              onMouseLeave={() => setHoveredTrip(null)}
                            >
                              {/* Timeline Dot */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className={cn(
                                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 sm:border-4 border-background flex items-center justify-center transition-all duration-300",
                                  config.color,
                                  isHovered && "scale-110 shadow-lg"
                                )}>
                                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              </div>

                              {/* Trip Card */}
                              <Link
                                href={`/trips/${trip.id}`}
                                className="flex-1 group"
                              >
                                <Card className={cn(
                                  "transition-all duration-300 hover:shadow-lg",
                                  config.bgColor,
                                  isHovered && "scale-[1.02] shadow-xl"
                                )}>
                                  <CardContent className={cn("p-4", compactView && "p-3")}>
                                    {compactView ? (
                                      // Compact View
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                              {trip.name}
                                            </h4>
                                            <Badge variant="secondary" className={cn("text-xs", config.textColor)}>
                                              {config.label}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {trip.destination && (
                                              <div className="flex items-center gap-1 truncate">
                                                <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{trip.destination}</span>
                                              </div>
                                            )}
                                            {trip.start_date && (
                                              <div className="flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </div>
                                            )}
                                            {trip.duration && (
                                              <div className="flex items-center gap-1">
                                                <ClockIcon className="h-3 w-3" />
                                                {trip.duration}d
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {trip.budget_total && (
                                          <div className="text-sm font-medium text-right">
                                            {formatCurrency(trip.budget_total, trip.preferences?.currency)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      // Detailed View
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                              {trip.name}
                                            </h4>
                                            <Badge variant="secondary" className={config.textColor}>
                                              {config.label}
                                            </Badge>
                                          </div>

                                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            {trip.destination && (
                                              <div className="flex items-center gap-1">
                                                <MapPinIcon className="h-4 w-4" />
                                                {trip.destination}
                                              </div>
                                            )}

                                            {trip.start_date && (
                                              <div className="flex items-center gap-1">
                                                <CalendarIcon className="h-4 w-4" />
                                                {new Date(trip.start_date).toLocaleDateString()}
                                                {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString()}`}
                                              </div>
                                            )}

                                            {trip.duration && (
                                              <div className="flex items-center gap-1">
                                                <ClockIcon className="h-4 w-4" />
                                                {trip.duration} days
                                              </div>
                                            )}

                                            {trip.budget_total && (
                                              <div className="flex items-center gap-1">
                                                <DollarSignIcon className="h-4 w-4" />
                                                {formatCurrency(trip.budget_total, trip.preferences?.currency)}
                                              </div>
                                            )}
                                          </div>

                                          {/* Status-specific info */}
                                          {trip.status === 'upcoming' && trip.daysUntil && (
                                            <div className="text-sm text-blue-600 dark:text-blue-400">
                                              Starts in {trip.daysUntil} day{trip.daysUntil !== 1 ? 's' : ''}
                                            </div>
                                          )}

                                          {trip.status === 'ongoing' && (
                                            <div className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                              Currently traveling
                                            </div>
                                          )}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button size="sm" variant="outline" className="text-xs">
                                            View Details
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
