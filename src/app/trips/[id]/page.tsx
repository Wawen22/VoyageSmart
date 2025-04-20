'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import UnreadBadge from '@/components/chat/UnreadBadge';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  budget_total: number | null;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

type Participant = {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
};

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;

        setTrip(tripData);
        setIsOwner(tripData.owner_id === user.id);

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            role,
            users (
              full_name,
              email
            )
          `)
          .eq('trip_id', id);

        if (participantsError) throw participantsError;

        // Format participants data
        // Safe type assertion after validating the structure
        const formattedParticipants = participantsData?.map((p: any) => ({
          id: p.id as string,
          user_id: p.user_id as string,
          role: p.role as string,
          full_name: (p.users?.full_name as string) || 'Unknown',
          email: (p.users?.email as string) || 'Unknown',
        }));

        setParticipants(formattedParticipants);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      // Delete the trip
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting trip:', deleteError);
        throw deleteError;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting trip:', err);
      setError('Failed to delete trip. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error || 'Trip not found'}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-primary hover:text-primary/90 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href="/dashboard" label="Back to Dashboard" />

          {isOwner && (
            <div className="flex space-x-2">
              <Link
                href={`/trips/${id}/edit`}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{trip.name}</h1>
            {trip.destination && (
              <p className="text-sm text-muted-foreground truncate">{trip.destination}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trip Details */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg lg:col-span-2">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-foreground">Trip Details</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Overview of your trip information
              </p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-border">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-muted-foreground">Destination</dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    {trip.destination || 'Not specified'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-muted-foreground">Budget</dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    {formatCurrency(trip.budget_total)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-muted-foreground">Privacy</dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    {trip.is_private ? 'Private' : 'Public'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    {trip.description || 'No description provided'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-foreground">Participants</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  People joining this trip
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/trips/${id}/participants`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-foreground bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
                >
                  Manage
                </Link>

                {isOwner && (
                  <Link
                    href={`/trips/${id}/invite`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Invite
                  </Link>
                )}
              </div>
            </div>
            <div className="border-t border-border">
              <ul className="divide-y divide-border">
                {participants.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                  </li>
                ) : (
                  participants.map((participant) => (
                    <li key={participant.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {participant.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {participant.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{participant.email}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                            {participant.role}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Trip Actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-card shadow overflow-hidden sm:rounded-lg lg:col-span-3">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-foreground">Trip Actions</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage your trip activities
              </p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <Link href={`/trips/${id}/itinerary`}>
                  <div className="border border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-foreground">Itinerary</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Plan your daily activities and schedule
                    </p>
                  </div>
                </Link>

                <Link href={`/trips/${id}/accommodations`}>
                  <div className="border border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-foreground">Accommodations</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Manage hotels and places to stay
                    </p>
                  </div>
                </Link>

                <Link href={`/trips/${id}/transportation`}>
                  <div className="border border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-foreground">Transportation</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Track flights, trains, and other transport
                    </p>
                  </div>
                </Link>

                <Link href={`/trips/${id}/expenses`}>
                  <div className="border border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-foreground">Expenses</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Track and split trip expenses
                    </p>
                  </div>
                </Link>

                <Link href={`/trips/${id}/chat`}>
                  <div className="border border-border rounded-lg p-6 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer relative">
                    <div className="absolute top-3 right-3">
                      <UnreadBadge tripId={id as string} />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Group Chat</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Chat with trip participants
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
