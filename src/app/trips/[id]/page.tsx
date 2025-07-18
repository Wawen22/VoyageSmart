'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import UnreadBadge from '@/components/chat/UnreadBadge';
import PremiumIndicator from '@/components/subscription/PremiumIndicator';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import TripWeather from '@/components/weather/TripWeather';
import { TripDestinations } from '@/lib/types/destination';
import {
  MapPinIcon,
  CalendarIcon,
  BanknoteIcon,
  LockIcon,
  FileTextIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  PlaneTakeoffIcon,
  Building2Icon,
  DollarSignIcon,
  MessageCircleIcon,
  ArrowLeft,
  InfoIcon,
  BookOpenIcon,
  SparklesIcon
} from 'lucide-react';

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
  preferences?: {
    currency?: string;
    trip_type?: string;
    accommodation?: string;
    notes?: string;
    destinations?: TripDestinations;
  };
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
  const { subscription, isSubscribed } = useSubscription();
  const { withPremiumAccess } = usePremiumFeature();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [accommodationCount, setAccommodationCount] = useState<number>(0);
  const [transportationCount, setTransportationCount] = useState<number>(0);


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

        // Get trip count for free users
        if (subscription?.tier === 'free') {
          const { count, error: countError } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id);

          if (!countError) {
            setTripCount(count || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  // Fetch counts for accommodations and transportation
  useEffect(() => {
    const fetchCounts = async () => {
      if (!id) return;

      try {
        // Fetch accommodation count
        const { count: accCount } = await supabase
          .from('accommodations')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        // Fetch transportation count
        const { count: transCount } = await supabase
          .from('transportation')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        setAccommodationCount(accCount || 0);
        setTransportationCount(transCount || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, [id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTripBudget = (amount: number | null, currency?: string) => {
    if (amount === null) return 'Not set';
    return formatCurrency(amount, currency || 'USD');
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/10"></div>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 animate-pulse">Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-6 text-destructive mb-6 max-w-md w-full rounded-r-md shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-destructive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <div className="mt-2 text-sm text-destructive">
                <p>{error || 'Trip not found'}</p>
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="text-primary hover:text-primary/90 transition-all flex items-center hover:scale-105"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <svg className="absolute top-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#header-pattern)" />
            <defs>
              <pattern id="header-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                <rect width="1" height="1" fill="currentColor" className="text-primary/5" />
              </pattern>
            </defs>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard" label="Back to Dashboard" className="hover:scale-105 transition-transform" />
          </div>

          {isOwner && (
            <div className="flex space-x-2">
              <Link
                href={`/trips/${id}/edit`}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all hover:scale-105 hover:shadow-md"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50 transition-all hover:scale-105 hover:shadow-md"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto py-6 px-3 sm:py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="animate-content-fade-in">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate relative inline-block">
              {trip.name}
              <span className="absolute -bottom-1 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center mt-3 space-y-2 sm:space-y-0">
              {trip.destination && (
                <div className="flex items-center text-sm text-muted-foreground mr-4 bg-muted/20 px-3 py-1 rounded-full">
                  <MapPinIcon className="h-4 w-4 mr-1 text-primary" />
                  <span className="truncate">{trip.destination}</span>
                </div>
              )}
              {trip.start_date && trip.end_date && (
                <div className="flex items-center text-sm text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
                  <CalendarIcon className="h-4 w-4 mr-1 text-primary" />
                  <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Weather Forecast - Moved to top */}
        <div className="mb-6 animate-content-fade-in" style={{ animationDelay: '50ms' }}>
          <TripWeather
            destinations={trip.preferences?.destinations}
            className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trip Details */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg lg:col-span-2 animate-content-fade-in relative">
            {/* Card decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-tr-full"></div>

            <div className="px-4 py-5 sm:px-6 relative">
              <h2 className="text-lg leading-6 font-medium text-foreground flex items-center">
                <FileTextIcon className="h-5 w-5 mr-2 text-primary" />
                Trip Details
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Overview of your trip information
              </p>
            </div>
            <div className="border-t border-border px-4 py-5 sm:p-0 relative">
              <dl className="sm:divide-y sm:divide-border">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-muted/10 transition-colors group stagger-content-item">
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
                      <MapPinIcon className="h-4 w-4 text-primary" />
                    </div>
                    Destinations
                  </dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 group-hover:text-primary/90 transition-colors">
                    {trip.preferences?.destinations?.destinations?.length > 0 ? (
                      <div className="flex flex-col space-y-2">
                        {trip.preferences.destinations.destinations.map((dest, index) => (
                          <div key={dest.id} className="flex items-center">
                            <span className={`inline-flex items-center ${trip.preferences?.destinations?.primary === dest.id ? 'font-medium text-primary' : ''}`}>
                              {index + 1}. {dest.name}
                              {trip.preferences?.destinations?.primary === dest.id && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Primary</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      trip.destination || 'Not specified'
                    )}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-muted/10 transition-colors group stagger-content-item">
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    Dates
                  </dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 group-hover:text-primary/90 transition-colors">
                    {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-muted/10 transition-colors group stagger-content-item">
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
                      <BanknoteIcon className="h-4 w-4 text-primary" />
                    </div>
                    Budget
                  </dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 group-hover:text-primary/90 transition-colors">
                    {formatTripBudget(trip.budget_total, trip.preferences?.currency)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-muted/10 transition-colors group stagger-content-item">
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
                      <LockIcon className="h-4 w-4 text-primary" />
                    </div>
                    Privacy
                  </dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
                    <span className={`px-3 py-1 rounded-full text-xs transition-all ${trip.is_private ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'} group-hover:shadow-sm`}>
                      {trip.is_private ? 'Private' : 'Public'}
                    </span>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-muted/10 transition-colors group stagger-content-item">
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <div className="p-1.5 rounded-md bg-primary/10 mr-2 group-hover:bg-primary/20 transition-colors">
                      <FileTextIcon className="h-4 w-4 text-primary" />
                    </div>
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2 group-hover:text-primary/90 transition-colors">
                    {trip.description || 'No description provided'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Participants - Moved to right column */}
          <div className="bg-card shadow overflow-hidden sm:rounded-lg animate-content-fade-in relative" style={{ animationDelay: '100ms' }}>
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-primary/5 rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 bg-primary/5 rounded-tl-full"></div>

            <div className="px-4 py-5 sm:px-6 flex justify-between items-center relative">
              <div>
                <h2 className="text-lg leading-6 font-medium text-foreground flex items-center">
                  <div className="p-1.5 rounded-md bg-primary/10 mr-2">
                    <UsersIcon className="h-4 w-4 text-primary" />
                  </div>
                  Participants
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  People joining this trip
                </p>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/trips/${id}/participants`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-foreground bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all hover:scale-105 hover:shadow-sm"
                >
                  Manage
                </Link>

                {isOwner && (
                  <Link
                    href={`/trips/${id}/invite`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all hover:scale-105 hover:shadow-sm"
                  >
                    Invite
                  </Link>
                )}
              </div>
            </div>
            <div className="border-t border-border relative">
              <ul className="divide-y divide-border">
                {participants.length === 0 ? (
                  <li className="px-4 py-8 sm:px-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-muted/20">
                        <UsersIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No participants yet</p>
                      {isOwner && (
                        <Link
                          href={`/trips/${id}/invite`}
                          className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                        >
                          Invite People
                        </Link>
                      )}
                    </div>
                  </li>
                ) : (
                  participants.map((participant, index) => (
                    <li key={participant.id} className={`px-4 py-4 sm:px-6 hover:bg-muted/10 transition-all stagger-content-item group`} style={{ animationDelay: `${index * 100 + 100}ms` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-200">
                            <span className="text-primary font-medium">
                              {participant.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {participant.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{participant.email}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all ${participant.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-secondary-foreground'} group-hover:shadow-sm`}>
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
        <div className="mt-10 animate-content-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-primary/10 mr-3">
                <MapPinIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Trip Actions</h2>
                <p className="text-sm text-muted-foreground">Manage your trip activities</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Link href={`/trips/${id}/itinerary`} className="group">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-xl group-hover:translate-y-[-4px] duration-300 relative overflow-hidden h-full">
                {/* Card background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>

                <div className="flex flex-col items-center text-center mb-4 relative">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors transform group-hover:scale-110 duration-300">
                    <div className="relative">
                      <CalendarIcon className="h-8 w-8 text-primary" />
                      <BookOpenIcon className="h-4 w-4 text-primary absolute -bottom-1 -right-1 bg-background rounded-full p-0.5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Trip Planner</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground relative text-center">
                  Plan activities, keep a journal and photo gallery
                </p>
              </div>
            </Link>

            <Link href={`/trips/${id}/accommodations`} className="group cursor-pointer">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-xl group-hover:translate-y-[-4px] duration-300 relative overflow-hidden h-full">
                {/* Card background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>

                {/* Free plan counter */}
                {subscription?.tier === 'free' && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm">
                      {accommodationCount}/5 Free
                    </span>
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-4 relative">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors transform group-hover:scale-110 duration-300">
                    <Building2Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Accommodations</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground relative text-center">
                  Manage hotels and places to stay
                </p>
              </div>
            </Link>

            <Link href={`/trips/${id}/transportation`} className="group cursor-pointer">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-xl group-hover:translate-y-[-4px] duration-300 relative overflow-hidden h-full">
                {/* Card background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>

                {/* Free plan counter */}
                {subscription?.tier === 'free' && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm">
                      {transportationCount}/5 Free
                    </span>
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-4 relative">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors transform group-hover:scale-110 duration-300">
                    <PlaneTakeoffIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Transportation</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground relative text-center">
                  Track flights, trains, and other transport
                </p>
              </div>
            </Link>

            <Link href={`/trips/${id}/expenses`} className="group">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-xl group-hover:translate-y-[-4px] duration-300 relative overflow-hidden h-full">
                {/* Card background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>

                <div className="flex flex-col items-center text-center mb-4 relative">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors transform group-hover:scale-110 duration-300">
                    <DollarSignIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Expenses</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground relative text-center">
                  Track and split trip expenses
                </p>
              </div>
            </Link>



            <Link href={`/trips/${id}/chat`} className="group">
              <div className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer hover:shadow-xl group-hover:translate-y-[-4px] duration-300 relative overflow-hidden h-full">
                {/* Card background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-150"></div>

                <div className="absolute top-3 right-3 z-10">
                  <UnreadBadge tripId={id as string} />
                </div>
                <div className="flex flex-col items-center text-center mb-4 relative">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors transform group-hover:scale-110 duration-300">
                    <MessageCircleIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">Group Chat</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground relative text-center">
                  Chat with trip participants
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>


    </div>
  );
}
