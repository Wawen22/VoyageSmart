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
  });

  // Get upcoming trips (for the special section)
  const upcomingTrips = trips.filter(trip =>
    trip.start_date && new Date(trip.start_date) >= new Date()
  ).sort((a, b) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 animate-content-fade-in">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Trips</h1>
              {subscription?.tier === 'free' && tripCount !== null && (
                <div className="flex items-center text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  <InfoIcon className="h-4 w-4 mr-1" />
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
              <RippleButton
                asChild
                feedbackType="ripple"
                className="px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center"
              >
                <Link href="/trips/new">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create New Trip
                </Link>
              </RippleButton>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-content-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary text-xs sm:text-sm py-1.5 px-3 transition-all duration-200 focus:scale-[1.01]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('all')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 ${filter === 'all' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                All Trips
              </RippleButton>
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('upcoming')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 ${filter === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Upcoming
              </RippleButton>
              <RippleButton
                variant="ghost"
                onClick={() => setFilter('past')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-all duration-200 ${filter === 'past' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Past
              </RippleButton>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 sm:mb-6 text-sm sm:text-base rounded-r-md">
            <p>{error}</p>
          </div>
        )}

        {/* Trips Section */}
        <div className="mb-6 sm:mb-8 animate-content-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
            {filter === 'all' ? 'All Trips' : filter === 'upcoming' ? 'Upcoming Trips' : 'Past Trips'}
            {searchTerm && <span className="text-sm sm:text-base"> matching "{searchTerm}"</span>}
          </h2>

          {loading ? (
            <div className="text-center py-12 bg-card rounded-lg shadow animate-pulse">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-6">Start planning your first adventure!</p>
              <RippleButton
                asChild
                feedbackType="ripple"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Link href="/trips/new">
                  Create New Trip
                </Link>
              </RippleButton>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow animate-fade-in">
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
