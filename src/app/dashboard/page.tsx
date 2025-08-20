'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import InteractiveDashboardHeader from '@/components/dashboard/InteractiveDashboardHeader';
import InteractiveTripCard from '@/components/dashboard/InteractiveTripCard';
import InteractiveEmptyState from '@/components/dashboard/InteractiveEmptyState';

import ModernLoadingSkeleton, {
  ModernStatsLoadingSkeleton,
  ModernHeaderLoadingSkeleton
} from '@/components/dashboard/ModernLoadingSkeleton';
import FloatingActionButton from '@/components/dashboard/FloatingActionButton';
import StickySearchBar from '@/components/dashboard/StickySearchBar';
import PullToRefresh from '@/components/dashboard/PullToRefresh';
import SwipeableStats from '@/components/dashboard/SwipeableStats';

import { useAnimationOptimization, useOptimizedLoading } from '@/hooks/usePerformance';
import { useDashboardShortcuts } from '@/components/ui/KeyboardShortcutsHelp';
import TripsMapView from '@/components/dashboard/TripsMapView';


type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { subscription, canCreateTrip } = useSubscription();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('upcoming');
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Reset year filter when main filter changes
  useEffect(() => {
    setSelectedYear('all');
  }, [filter]);

  // Performance optimizations
  const { shouldAnimate, getAnimationClass } = useAnimationOptimization();
  const { isLoading: optimizedLoading, startLoading, stopLoading } = useOptimizedLoading();

  // Keyboard shortcuts
  const { shortcuts, showHelp, setShowHelp } = useDashboardShortcuts();

  // Calculate statistics
  const getStatistics = () => {
    const now = new Date();
    const upcoming = trips.filter(trip => {
      if (!trip.start_date) return false;
      return new Date(trip.start_date) > now;
    });
    const ongoing = trips.filter(trip => {
      if (!trip.start_date || !trip.end_date) return false;
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      return start <= now && end >= now;
    });
    const completed = trips.filter(trip => {
      if (!trip.end_date) return false;
      return new Date(trip.end_date) < now;
    });

    return {
      total: trips.length,
      upcoming: upcoming.length,
      ongoing: ongoing.length,
      completed: completed.length
    };
  };

  const stats = getStatistics();

  // Smart filter selection logic - run once when trips are loaded
  useEffect(() => {
    if (!loading && trips.length > 0 && !hasInitializedFilter) {
      let smartFilter: 'all' | 'upcoming' | 'ongoing' | 'past' = 'all';

      // Priority 1: Ongoing trips (most important - user is traveling now!)
      if (stats.ongoing > 0) {
        smartFilter = 'ongoing';
      }
      // Priority 2: Upcoming trips (next most important - future excitement)
      else if (stats.upcoming > 0) {
        smartFilter = 'upcoming';
      }
      // Priority 3: Completed trips (for nostalgia and memories)
      else if (stats.completed > 0) {
        smartFilter = 'past';
      }
      // Priority 4: All trips (fallback when everything else is empty)
      else {
        smartFilter = 'all';
      }

      setFilter(smartFilter);
      setHasInitializedFilter(true);
    }
  }, [loading, trips.length, stats.ongoing, stats.upcoming, stats.completed, hasInitializedFilter]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        startLoading();

        if (!user) {
          console.log('Dashboard - User not loaded yet, waiting...');
          return;
        }

        console.log('Dashboard - Fetching trips for user:', user.id);

        try {
          // Fetch all trips the user has access to (RLS will handle permissions)
          const { data, error } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Dashboard - Error fetching trips:', error);
            throw error;
          }

          console.log('Dashboard - Trips fetched successfully:', data?.length || 0);
          setTrips(data || []);
          setTripCount(data?.length || 0);

          // Calculate available years
          const years = new Set<number>();
          data?.forEach(trip => {
            if (trip.start_date) {
              const year = new Date(trip.start_date).getFullYear();
              years.add(year);
            }
          });
          setAvailableYears(Array.from(years).sort((a, b) => b - a));
        } catch (fetchError) {
          console.error('Dashboard - Error in fetch operation:', fetchError);

          // Fallback approach if the first method fails
          console.log('Dashboard - Trying fallback approach...');
          try {
            // First get trips where user is owner
            const { data: ownerTrips, error: ownerError } = await supabase
              .from('trips')
              .select('*')
              .eq('owner_id', user.id);

            if (ownerError) {
              console.error('Dashboard - Fallback approach also failed:', ownerError);
              setError('Could not load your trips. Please try again later.');
              return;
            }

            console.log('Dashboard - Owner trips fetched:', ownerTrips?.length || 0);
            setTrips(ownerTrips || []);

            // Calculate available years
            const years = new Set<number>();
            ownerTrips?.forEach(trip => {
              if (trip.start_date) {
                const year = new Date(trip.start_date).getFullYear();
                years.add(year);
              }
            });
            setAvailableYears(Array.from(years).sort((a, b) => b - a));
          } catch (fallbackError) {
            console.error('Dashboard - Fallback approach also failed:', fallbackError);
            setError('Could not load your trips. Please try again later.');
          }
        }
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    fetchTrips();
  }, [user]);

  // Pull-to-refresh function
  const handleRefresh = async () => {
    if (!user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      console.log('Dashboard - Refreshing trips...');

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard - Error refreshing trips:', error);
        throw error;
      }

      console.log('Dashboard - Trips refreshed successfully:', data?.length || 0);
      setTrips(data || []);
      setTripCount(data?.length || 0);
      setError(null);

      // Calculate available years
      const years = new Set<number>();
      data?.forEach(trip => {
        if (trip.start_date) {
          const year = new Date(trip.start_date).getFullYear();
          years.add(year);
        }
      });
      setAvailableYears(Array.from(years).sort((a, b) => b - a));
    } catch (refreshError) {
      console.error('Dashboard - Error during refresh:', refreshError);
      setError('Could not refresh trips. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };



  // Filter trips based on the selected filter, search term, and year
  const filteredTrips = trips.filter(trip => {
    // Apply date filter
    if (filter === 'upcoming' && trip.start_date) {
      if (new Date(trip.start_date) < new Date()) return false;
    } else if (filter === 'ongoing' && trip.start_date && trip.end_date) {
      const now = new Date();
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      if (now < start || now > end) return false;
    } else if (filter === 'past' && trip.end_date) {
      if (new Date(trip.end_date) >= new Date()) return false;
    }

    // Apply year filter
    if (selectedYear !== 'all') {
      const yearNumber = parseInt(selectedYear);
      if (trip.start_date) {
        if (new Date(trip.start_date).getFullYear() !== yearNumber) return false;
      } else {
        // Planning trips without dates are considered current year
        if (yearNumber !== new Date().getFullYear()) return false;
      }
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        trip.name.toLowerCase().includes(term) ||
        (trip.destination?.toLowerCase().includes(term) || false) ||
        (trip.description?.toLowerCase().includes(term) || false)
      );
    }

    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (sortBy) {
      case 'created_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'created_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'date_asc':
        // Sort by start date (nearest first)
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Get upcoming trips (for the special section)
  const upcomingTrips = trips.filter(trip =>
    trip.start_date && new Date(trip.start_date) >= new Date()
  ).sort((a, b) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background relative mobile-smooth-scroll mobile-no-horizontal-scroll">
      {/* Sticky Search Bar for Mobile */}
      <StickySearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholder="Search your adventures..."
      />

      {/* Pull to Refresh Wrapper */}
      <PullToRefresh onRefresh={handleRefresh} disabled={loading || isRefreshing}>
        {/* Main Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:px-8" role="main" id="main-content">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 animate-fade-in-up">
            <p className="font-medium">{error}</p>
          </div>
        )}



      </main>

      {/* Interactive Header */}
      {loading ? (
        <ModernHeaderLoadingSkeleton />
      ) : (
        <InteractiveDashboardHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filter={filter}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          tripCount={tripCount || 0}
          userName={user?.user_metadata?.full_name?.split(' ')[0] || 'Explorer'}
          stats={stats}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
          trips={trips}
        />
      )}



      {/* Trips Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 pb-24 md:pb-8">
        {/* Content Section */}
        <div className="space-y-6 lg:space-y-8">

          {loading ? (
            <ModernLoadingSkeleton viewMode={viewMode === 'map' ? 'grid' : viewMode} count={6} />
          ) : trips.length === 0 ? (
            <InteractiveEmptyState />
          ) : filteredTrips.length === 0 ? (
            <InteractiveEmptyState searchTerm={searchTerm} filter={filter} />
          ) : viewMode === 'map' ? (
            <TripsMapView
              trips={filteredTrips as any}
              searchTerm={searchTerm}
              filter={filter}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 xl:gap-6 grid-mobile-optimized">
              {filteredTrips.map((trip, index) => (
                <InteractiveTripCard
                  key={trip.id}
                  trip={trip}
                  viewMode="grid"
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
}
