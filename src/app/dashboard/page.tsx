'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import TripCard from '@/components/trips/TripCard';
import PageLayout from '@/components/layout/PageLayout';
import AnimatedList from '@/components/ui/AnimatedList';
import RippleButton from '@/components/ui/RippleButton';
import PremiumIndicator from '@/components/subscription/PremiumIndicator';
import { PlusIcon, SearchIcon, InfoIcon } from 'lucide-react';

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
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_desc');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);

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
          } catch (fallbackError) {
            console.error('Dashboard - Fallback approach also failed:', fallbackError);
            setError('Could not load your trips. Please try again later.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter trips based on the selected filter and search term
  const filteredTrips = trips.filter(trip => {
    // Apply date filter
    if (filter === 'upcoming' && trip.start_date) {
      if (new Date(trip.start_date) < new Date()) return false;
    } else if (filter === 'past' && trip.end_date) {
      if (new Date(trip.end_date) >= new Date()) return false;
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
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-card to-card/80 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 animate-content-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Trips</h1>
                <div className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></div>
              </div>
              {subscription?.tier === 'free' && tripCount !== null && (
                <div className="flex items-center text-sm text-muted-foreground bg-muted/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-border/50 transition-all hover:bg-muted">
                  <InfoIcon className="h-4 w-4 mr-1 text-primary" />
                  <span>{tripCount}/3 trips</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {subscription?.tier === 'free' && tripCount !== null && tripCount >= 3 && (
                <div className="mr-2">
                  <PremiumIndicator feature="unlimited_trips" variant="text" />
                </div>
              )}
              <div className="flex gap-2">
                {/* Create New Trip Button */}
                <RippleButton
                  asChild
                  feedbackType="ripple"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-full shadow-sm text-xs sm:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center transition-all duration-300 hover:scale-105"
                >
                  <Link href="/trips/new">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create New Trip
                  </Link>
                </RippleButton>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-content-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="relative flex-grow">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-full border-input bg-background/80 backdrop-blur-sm text-foreground shadow-sm focus:border-primary focus:ring-primary text-xs sm:text-sm py-2 px-4 transition-all duration-300 focus:scale-[1.01] pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {searchTerm ? (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                      </svg>
                    </button>
                  ) : (
                    <SearchIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-focus-within:w-[calc(100%-16px)]"></div>
              </div>
            </div>

            <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('all')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${filter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-secondary/80 backdrop-blur-sm text-foreground hover:bg-accent hover:scale-105'}`}
              >
                All Trips
              </RippleButton>
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${filter === 'upcoming'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-secondary/80 backdrop-blur-sm text-foreground hover:bg-accent hover:scale-105'}`}
              >
                Upcoming
              </RippleButton>
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('past')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300 ${filter === 'past'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-secondary/80 backdrop-blur-sm text-foreground hover:bg-accent hover:scale-105'}`}
              >
                Past
              </RippleButton>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-3 sm:py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 sm:mb-6 text-sm sm:text-base rounded-r-md shadow-sm animate-slide-in-right">
            <p>{error}</p>
          </div>
        )}

        {/* Trips Section */}
        <div className="mb-6 sm:mb-8 animate-content-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-0">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground relative">
                <span className="relative">
                  {filter === 'all' ? 'All Trips' : filter === 'upcoming' ? 'Upcoming Trips' : 'Past Trips'}
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/30 rounded-full"></span>
                </span>
                {searchTerm && <span className="text-sm sm:text-base ml-2 text-muted-foreground"> matching "{searchTerm}"</span>}
              </h2>
              <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <select
                  className="text-xs sm:text-sm bg-secondary/80 backdrop-blur-sm text-foreground rounded-full px-3 py-1.5 pl-8 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 appearance-none cursor-pointer"
                  onChange={(e) => setSortBy(e.target.value)}
                  value={sortBy}
                >
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="date_asc">Date (nearest first)</option>
                </select>
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-primary pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 16 4 4 4-4"/>
                    <path d="M7 20V4"/>
                    <path d="m21 8-4-4-4 4"/>
                    <path d="M17 4v16"/>
                  </svg>
                </div>
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-300 group-hover:rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-lg shadow-sm overflow-hidden border border-border/50 animate-pulse">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-6 bg-muted rounded w-2/3"></div>
                      <div className="h-5 bg-muted rounded w-1/4"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-muted rounded-full mr-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 bg-muted rounded-full mr-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                    <div className="pt-3 flex justify-between items-center border-t border-border">
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-lg shadow-sm border border-border/50 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 text-primary/50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-6">Start planning your first adventure!</p>
              <RippleButton
                asChild
                feedbackType="ripple"
                className="px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 hover:scale-105"
              >
                <Link href="/trips/new">
                  <PlusIcon className="h-4 w-4 mr-1 inline-block" />
                  Create New Trip
                </Link>
              </RippleButton>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-lg shadow-sm border border-border/50 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No matching trips</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <AnimatedList
              className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
              staggerDelay={100}
              initialDelay={100}
              animationType="slide-up"
            >
              {filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </AnimatedList>
          )}
        </div>
      </main>
    </div>
  );
}
