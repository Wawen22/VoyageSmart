'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon, CompassIcon, MapPinIcon } from 'lucide-react';
import StickySearchBar from '@/components/dashboard/StickySearchBar';
import PullToRefresh from '@/components/dashboard/PullToRefresh';
import FloatingActionButton from '@/components/dashboard/FloatingActionButton';
import InteractiveDashboardHeader from '@/components/dashboard/InteractiveDashboardHeader';
import InteractiveTripCard from '@/components/dashboard/InteractiveTripCard';
import InteractiveEmptyState from '@/components/dashboard/InteractiveEmptyState';
import SwipeableStats from '@/components/dashboard/SwipeableStats';
import TripsMapView from '@/components/dashboard/TripsMapView';
import ModernLoadingSkeleton, {
  ModernHeaderLoadingSkeleton,
  ModernStatsLoadingSkeleton
} from '@/components/dashboard/ModernLoadingSkeleton';
import { useAuth } from '@/lib/auth';
import { TripDestinations } from '@/lib/types/destination';
import { logger } from '@/lib/logger';
import {
  useAnimationOptimization,
  useOptimizedLoading
} from '@/hooks/usePerformance';
import { useDashboardShortcuts } from '@/components/ui/KeyboardShortcutsHelp';
import { cn } from '@/lib/utils';

type TripFilter = 'all' | 'upcoming' | 'ongoing' | 'past';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  budget_total: number | null;
  created_at: string;
  preferences?: {
    currency?: string;
    trip_type?: string;
    destinations?: TripDestinations;
  } | null;
};

type TripStats = {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
};

type SortOption = 'created_desc' | 'created_asc' | 'name_asc' | 'name_desc' | 'date_asc';

const INITIAL_SORT: SortOption = 'created_desc';

const filterAndSortTrips = (
  trips: Trip[],
  {
    filter,
    selectedYear,
    searchTerm,
    sortBy
  }: {
    filter: TripFilter;
    selectedYear: string;
    searchTerm: string;
    sortBy: SortOption;
  }
) => {
  const now = new Date();
  const term = searchTerm.trim().toLowerCase();
  const yearFilter = selectedYear !== 'all' ? Number.parseInt(selectedYear, 10) : null;

  const filteredTrips = trips.filter((trip) => {
    if (filter === 'upcoming' && trip.start_date) {
      if (new Date(trip.start_date) < now) return false;
    } else if (filter === 'ongoing' && trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      if (now < start || now > end) return false;
    } else if (filter === 'past' && trip.end_date) {
      if (new Date(trip.end_date) >= now) return false;
    }

    if (yearFilter) {
      if (trip.start_date) {
        if (new Date(trip.start_date).getFullYear() !== yearFilter) {
          return false;
        }
      } else if (yearFilter !== new Date().getFullYear()) {
        return false;
      }
    }

    if (!term) return true;

    const haystack = [
      trip.name,
      trip.destination,
      trip.description,
      trip.preferences?.trip_type,
      trip.preferences?.destinations?.destinations?.map((dest) => dest.name).join(', ')
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());

    return haystack.some((value) => value.includes(term));
  });

  return filteredTrips.sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'date_asc': {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      }
      case 'created_desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
};

const computeTripStats = (trips: Trip[]): TripStats => {
  const now = new Date();

  const upcoming = trips.filter((trip) => {
    if (!trip.start_date) return false;
    return new Date(trip.start_date) > now;
  }).length;

  const ongoing = trips.filter((trip) => {
    if (!trip.start_date || !trip.end_date) return false;
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    return start <= now && end >= now;
  }).length;

  const completed = trips.filter((trip) => {
    if (!trip.end_date) return false;
    return new Date(trip.end_date) < now;
  }).length;

  return {
    total: trips.length,
    upcoming,
    ongoing,
    completed
  };
};

const buildAvailableYears = (trips: Trip[]) => {
  const years = new Set<number>();
  trips.forEach((trip) => {
    if (trip.start_date) {
      years.add(new Date(trip.start_date).getFullYear());
    }
  });
  return Array.from(years).sort((a, b) => b - a);
};

const formatDateRange = (start: string | null, end: string | null) => {
  if (!start && !end) return 'Dates not set';

  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'TBD';

  if (start && end) {
    return `${format(start)} – ${format(end)}`;
  }

  return format(start ?? end);
};

const findNextTrip = (trips: Trip[]) => {
  const now = new Date();
  return (
    trips
      .filter((trip) => trip.start_date && new Date(trip.start_date) >= now)
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())[0] ?? null
  );
};

const getUpcomingTrips = (trips: Trip[], limit = 3) => {
  const now = new Date();
  return trips
    .filter((trip) => trip.start_date && new Date(trip.start_date) >= now)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, limit);
};

const buildMapInsights = (trips: Trip[], stats: TripStats) => {
  const uniqueDestinations = new Set<string>();
  trips.forEach((trip) => {
    if (trip.destination) uniqueDestinations.add(trip.destination);
    const destinations = trip.preferences?.destinations?.destinations;
    destinations?.forEach((dest) => uniqueDestinations.add(dest.name));
  });

  const nextTrip = findNextTrip(trips);

  return [
    {
      id: 'destinations',
      title: 'Mapped destinations',
      value: uniqueDestinations.size.toString(),
      description:
        uniqueDestinations.size === 1 ? 'Unique place discovered' : 'Unique places discovered',
      icon: MapPinIcon,
      accent: 'text-primary'
    },
    {
      id: 'next-trip',
      title: 'Next departure',
      value: nextTrip ? formatDateRange(nextTrip.start_date, nextTrip.end_date) : 'No dates yet',
      description: nextTrip?.destination ?? 'Add travel dates to see the countdown',
      icon: CalendarIcon,
      accent: 'text-emerald-500'
    },
    {
      id: 'activity',
      title: 'Travel momentum',
      value:
        stats.ongoing > 0
          ? `${stats.ongoing} active now`
          : stats.upcoming > 0
          ? `${stats.upcoming} upcoming`
          : 'Ready for the next adventure',
      description:
        stats.ongoing > 0
          ? 'Trips currently in progress'
          : stats.upcoming > 0
          ? 'Upcoming trips in the pipeline'
          : 'Plan your next journey to light up the map',
      icon: CompassIcon,
      accent: stats.ongoing > 0 ? 'text-orange-500' : 'text-blue-500'
    }
  ];
};

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TripFilter>('upcoming');
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sortBy = INITIAL_SORT;

  const { shouldAnimate, getAnimationClass } = useAnimationOptimization();
  const { isLoading: optimizedLoading, startLoading, stopLoading } = useOptimizedLoading();
  useDashboardShortcuts();

  const startLoadingRef = useRef(startLoading);
  const stopLoadingRef = useRef(stopLoading);

  useEffect(() => {
    startLoadingRef.current = startLoading;
  }, [startLoading]);

  useEffect(() => {
    stopLoadingRef.current = stopLoading;
  }, [stopLoading]);

  const showLoading = loading || optimizedLoading;
  const stats = useMemo(() => computeTripStats(trips), [trips]);
  const filteredTrips = useMemo(
    () =>
      filterAndSortTrips(trips, {
        filter,
        selectedYear,
        searchTerm,
        sortBy
      }),
    [filter, selectedYear, searchTerm, sortBy, trips]
  );
  const hasTrips = trips.length > 0;
  const mapInsights = useMemo(() => buildMapInsights(filteredTrips, stats), [filteredTrips, stats]);
  const upcomingTrips = useMemo(() => getUpcomingTrips(trips), [trips]);

  useEffect(() => {
    const loadTrips = async () => {
      if (!user || !supabase) {
        setLoading(false);
        setTrips([]);
        setAvailableYears([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
  startLoadingRef.current?.();

        logger.debug('Dashboard fetching trips', { userId: user.id });

        const { data, error: fetchError } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setTrips(data ?? []);
        setAvailableYears(buildAvailableYears(data ?? []));
      } catch (fetchError) {
        logger.error('Dashboard error loading trips', {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          userId: user?.id ?? 'unknown'
        });
        setError('Could not load your trips right now. Please try again later.');
        setTrips([]);
        setAvailableYears([]);
      } finally {
        setLoading(false);
  stopLoadingRef.current?.();
      }
    };

    void loadTrips();
  }, [supabase, user]);

  useEffect(() => {
    if (!showLoading && trips.length > 0 && !hasInitializedFilter) {
      const { ongoing, upcoming, completed } = stats;
      let smartFilter: TripFilter = 'all';

      if (ongoing > 0) smartFilter = 'ongoing';
      else if (upcoming > 0) smartFilter = 'upcoming';
      else if (completed > 0) smartFilter = 'past';

      setFilter(smartFilter);
      setHasInitializedFilter(true);
    }
  }, [showLoading, trips.length, stats, hasInitializedFilter]);

  useEffect(() => {
    setSelectedYear('all');
  }, [filter]);

  const handleRefresh = async () => {
    if (!user || !supabase || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const { data, error: refreshError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (refreshError) {
        throw refreshError;
      }

      setTrips(data ?? []);
      setAvailableYears(buildAvailableYears(data ?? []));
      setError(null);
    } catch (refreshError) {
      logger.error('Dashboard error during refresh', {
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        userId: user?.id ?? 'unknown'
      });
      setError('We could not refresh your trips. Please try again shortly.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderHeader = () => {
    if (showLoading) {
      return <ModernHeaderLoadingSkeleton />;
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card/80 p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Welcome to VoyageSmart</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Sign in to unlock your personalized travel dashboard, manage trips, and explore destinations on the interactive map.
          </p>
        </div>
      );
    }

    return (
      <InteractiveDashboardHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        tripCount={trips.length}
        userName={(user as any)?.user_metadata?.full_name?.split(' ')[0] ?? 'Explorer'}
        stats={stats}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        trips={trips}
      />
    );
  };

  const renderContent = () => {
    if (showLoading) {
      return <ModernLoadingSkeleton viewMode={viewMode === 'map' ? 'grid' : viewMode} count={6} />;
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card/80 p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">Please sign in to see your trips</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Access your travel plans, interactive analytics, and map view once you&apos;re logged in.
          </p>
        </div>
      );
    }

    if (!hasTrips) {
      return <InteractiveEmptyState />;
    }

    if (filteredTrips.length === 0) {
      return <InteractiveEmptyState searchTerm={searchTerm} filter={filter} />;
    }

    if (viewMode === 'map') {
      return (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px] xl:grid-cols-[minmax(0,1fr),360px]">
          <div className="min-h-[520px] overflow-hidden rounded-3xl border border-border bg-card/60 p-0 shadow-xl">
            <TripsMapView
              trips={filteredTrips}
              searchTerm={searchTerm}
              filter={filter}
            />
          </div>

          <MapInsightsPanel insights={mapInsights} upcomingTrips={upcomingTrips} animate={shouldAnimate} />
        </section>
      );
    }

    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3',
          shouldAnimate && getAnimationClass('fade-up-fast')
        )}
      >
        {filteredTrips.map((trip, index) => (
          <InteractiveTripCard key={trip.id} trip={trip} index={index} viewMode="grid" />
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-background mobile-smooth-scroll mobile-no-horizontal-scroll">
      <StickySearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search your adventures..."
      />

      <PullToRefresh onRefresh={handleRefresh} disabled={showLoading || isRefreshing}>
        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-24 pt-12 sm:px-6 lg:px-8 lg:pb-32">
          {error && (
            <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-4 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {renderHeader()}

          {!showLoading && hasTrips && (
            <SwipeableStats trips={trips} className="lg:hidden" />
          )}

          {showLoading && (
            <div className="hidden lg:block">
              <ModernStatsLoadingSkeleton />
            </div>
          )}

          {renderContent()}
        </main>
      </PullToRefresh>

      <FloatingActionButton />
    </div>
  );
}

type MapInsight = ReturnType<typeof buildMapInsights>[number];

type MapInsightsPanelProps = {
  insights: MapInsight[];
  upcomingTrips: Trip[];
  animate: boolean;
};

function MapInsightsPanel({ insights, upcomingTrips, animate }: MapInsightsPanelProps) {
  return (
    <aside
      className={cn(
        'space-y-4 rounded-3xl border border-border bg-card/70 p-5 shadow-xl backdrop-blur-sm',
        animate && 'animate-in fade-in slide-in-from-right-6 duration-500'
      )}
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Map insights</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Quick highlights about the trips currently plotted on your map.
        </p>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3"
            >
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Icon className={cn('h-4 w-4', insight.accent)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {insight.title}
                </p>
                <p className="truncate text-base font-semibold text-foreground">{insight.value}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <UpcomingTripsList trips={upcomingTrips} />
    </aside>
  );
}

type UpcomingTripsListProps = {
  trips: Trip[];
};

function UpcomingTripsList({ trips }: UpcomingTripsListProps) {
  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
        Add travel dates to see your next departures at a glance.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next departures</h4>
      <ul className="space-y-2">
        {trips.map((trip) => (
          <li key={trip.id} className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{trip.name}</p>
            <p className="text-xs text-muted-foreground">{formatDateRange(trip.start_date, trip.end_date)}</p>
            {trip.destination && (
              <p className="text-xs text-muted-foreground/90">{trip.destination}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
