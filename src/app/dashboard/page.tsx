'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import TripCard from '@/components/trips/TripCard';

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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Trips</h1>
            <Link
              href="/trips/new"
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Trip
            </Link>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary text-xs sm:text-sm py-1.5 px-3"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${filter === 'all' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                All Trips
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${filter === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${filter === 'past' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Past
              </button>
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

        {/* Upcoming Trips Section */}
        {!loading && upcomingTrips.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Upcoming Trips</h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((trip) => (
                <div key={trip.id} className="stagger-item">
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Trips Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
            {filter === 'all' ? 'All Trips' : filter === 'upcoming' ? 'Upcoming Trips' : 'Past Trips'}
            {searchTerm && <span className="text-sm sm:text-base"> matching "{searchTerm}"</span>}
          </h2>

          {loading ? (
            <div className="text-center py-12 bg-card rounded-lg shadow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your trips...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-6">Start planning your first adventure!</p>
              <Link
                href="/trips/new"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Create New Trip
              </Link>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg shadow">
              <h3 className="text-lg font-semibold text-foreground mb-2">No matching trips</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip) => (
                <div key={trip.id} className="stagger-item">
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
