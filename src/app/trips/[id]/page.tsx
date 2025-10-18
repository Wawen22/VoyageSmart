'use client';

import { useMemo, useState, useEffect } from 'react';
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
import { ProactiveSuggestionsTray } from '@/components/dashboard/ProactiveSuggestionsTray';
import { TripChecklistTrigger } from '@/components/trips/TripChecklistTrigger';
import { useProactiveSuggestions } from '@/hooks/useProactiveSuggestions';
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
  SparklesIcon,
  Info
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
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [accommodationCount, setAccommodationCount] = useState<number>(0);
  const [transportationCount, setTransportationCount] = useState<number>(0);
  const [itineraryCount, setItineraryCount] = useState<number>(0);
  const [expensesCount, setExpensesCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);

  const {
    activeSuggestions,
    snoozedSuggestions,
    recentCompletedSuggestions,
    retentionDays: suggestionRetentionDays,
    trigger: triggerProactiveSuggestions,
    refresh: refreshProactiveSuggestions,
    markAsRead: markSuggestionAsRead,
    snooze: snoozeSuggestion,
    restore: restoreSuggestion,
    uncomplete: uncompleteSuggestion
  } = useProactiveSuggestions();


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
        if (!tripData) throw new Error('Trip not found');

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
        const formattedParticipants = participantsData?.map((p: any) => ({
          id: p.id as string,
          user_id: p.user_id as string,
          role: p.role as string,
          full_name: (p.users?.full_name as string) || 'Unknown',
          email: (p.users?.email as string) || 'Unknown',
        }));

        setParticipants(formattedParticipants);

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            id,
            description,
            amount,
            currency,
            date,
            paid_by,
            category,
            users (
              full_name
            )
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;
        setExpenses(expensesData || []);

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

  // Fetch counts for accommodations, transportation, itinerary, and expenses
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

        // Fetch itinerary days count
        const { count: daysCount } = await supabase
          .from('itinerary_days')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        // Fetch activities count
        const { count: activitiesCount } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        // Fetch expenses count
        const { count: expCount } = await supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        // Fetch journal entries count
        const { count: journalEntriesCount } = await supabase
          .from('trip_journal')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id);

        setAccommodationCount(accCount || 0);
        setTransportationCount(transCount || 0);
        setItineraryCount((daysCount || 0) + (activitiesCount || 0));
        setExpensesCount(expCount || 0);
        setJournalCount(journalEntriesCount || 0);
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

  useEffect(() => {
    if (!user?.id || !id) return;

    const run = async () => {
      await refreshProactiveSuggestions({ silent: true });
      await triggerProactiveSuggestions({ trigger: 'app_open' });
    };

    void run();
  }, [user?.id, id, refreshProactiveSuggestions, triggerProactiveSuggestions]);

  const filteredActiveSuggestions = useMemo(
    () => activeSuggestions.filter((suggestion) => suggestion.tripId === id),
    [activeSuggestions, id]
  );
  const filteredSnoozedSuggestions = useMemo(
    () => snoozedSuggestions.filter((suggestion) => suggestion.tripId === id),
    [snoozedSuggestions, id]
  );
  const filteredCompletedSuggestions = useMemo(
    () => recentCompletedSuggestions.filter((suggestion) => suggestion.tripId === id),
    [recentCompletedSuggestions, id]
  );

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
      <header className="relative overflow-visible">
        {/* Modern Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/95 to-secondary/10 backdrop-blur-xl"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}></div>
          </div>
        </div>

        {/* Glass border effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"></div>

        {/* Navigation Bar with Glass Effect */}
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex w-full items-center justify-between gap-2 sm:flex-1 sm:w-auto sm:justify-start sm:gap-3">
              <div className="flex items-center gap-3">
                <BackButton
                  href="/dashboard"
                  label="Dashboard"
                  theme="default"
                  iconOnly
                />
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <TripChecklistTrigger tripId={Array.isArray(id) ? id[0] : (id as string)} />
                <ProactiveSuggestionsTray
                  activeSuggestions={filteredActiveSuggestions}
                  snoozedSuggestions={filteredSnoozedSuggestions}
                  recentCompletedSuggestions={filteredCompletedSuggestions}
                  retentionDays={suggestionRetentionDays}
                  onMarkRead={(suggestionId) => {
                    void markSuggestionAsRead(suggestionId);
                  }}
                  onSnooze={(suggestionId) => {
                    void snoozeSuggestion(suggestionId);
                  }}
                  onRestore={(suggestionId) => {
                    void restoreSuggestion(suggestionId);
                  }}
                  onUncomplete={(suggestionId) => {
                    void uncompleteSuggestion(suggestionId);
                  }}
                />
              </div>
            </div>

            {isOwner && (
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
                <Link
                  href={`/trips/${id}/edit`}
                  className="group inline-flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-primary-foreground bg-primary/90 hover:bg-primary backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                >
                  <PencilIcon className="h-3 w-3 mr-1.5 group-hover:rotate-12 transition-transform duration-300" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="group inline-flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-destructive-foreground bg-destructive/90 hover:bg-destructive backdrop-blur-sm border border-white/10 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-destructive/25"
                >
                  <TrashIcon className="h-3 w-3 mr-1.5 group-hover:rotate-12 transition-transform duration-300" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile">
          <div className="animate-glass-fade-in">
            {/* Trip Title with Modern Typography */}
            <div className="relative mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground relative">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {trip.name}
                </span>
                {/* Animated underline */}
                <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full animate-pulse"
                     style={{ width: `${Math.min(trip.name.length * 8, 200)}px` }}></div>
              </h1>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -right-4 w-2 h-2 bg-secondary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>

            {/* Trip Info Cards with Glassmorphism */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
              {trip.destination && (
                <div className="group glass-info-card glass-info-card-mobile flex items-center text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="p-1 sm:p-1.5 rounded-full bg-primary/20 mr-2 sm:mr-3 group-hover:bg-primary/30 transition-colors duration-300">
                    <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium truncate text-xs sm:text-sm">{trip.destination}</span>
                </div>
              )}

              {trip.start_date && trip.end_date && (
                <div className="group glass-info-card glass-info-card-mobile flex items-center text-sm px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="p-1 sm:p-1.5 rounded-full bg-secondary/20 mr-2 sm:mr-3 group-hover:bg-secondary/30 transition-colors duration-300">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
                  </div>
                  <span className="text-foreground font-medium text-xs sm:text-sm">
                    {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Weather Forecast - Modernized */}
        <div className="mb-6 animate-glass-fade-in" style={{ animationDelay: '50ms' }}>
          <TripWeather
            destinations={trip.preferences?.destinations}
            className="glass-card rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3 trip-details-grid-mobile">
          {/* Trip Details - Modernized */}
          <div className="glass-card rounded-2xl lg:col-span-2 animate-glass-fade-in relative overflow-hidden group hover:shadow-2xl transition-all duration-500 trip-details-card-mobile" style={{ animationDelay: '100ms' }}>
            {/* Modern Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" style={{ transitionDelay: '200ms' }}></div>

            {/* Header Section */}
            <div className="relative z-10 p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 transition-all duration-300 group-hover:scale-110">
                    <FileTextIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      Trip Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Overview of your trip information
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </div>
            </div>
            {/* Content Section */}
            <div className="relative z-10 p-4 md:p-6 space-y-4">
              {/* Destinations */}
              <div className="group/item p-4 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-primary/20 group-hover/item:bg-primary/30 transition-all duration-300 group-hover/item:scale-110">
                      <MapPinIcon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-2 group-hover/item:text-primary transition-colors">
                      Destinations
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {trip.preferences?.destinations?.destinations?.length > 0 ? (
                        <div className="space-y-2">
                          {trip.preferences.destinations.destinations.map((dest, index) => (
                            <div key={dest.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors">
                              <span className={`font-medium ${trip.preferences?.destinations?.primary === dest.id ? 'text-primary' : 'text-foreground'}`}>
                                {index + 1}. {dest.name}
                              </span>
                              {trip.preferences?.destinations?.primary === dest.id && (
                                <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30">
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-foreground">{trip.destination || 'Not specified'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Dates */}
              <div className="group/item p-4 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover/item:bg-blue-500/30 transition-all duration-300 group-hover/item:scale-110">
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1 group-hover/item:text-blue-500 transition-colors">
                      Travel Dates
                    </h3>
                    <p className="text-sm text-foreground font-medium">
                      {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="group/item p-4 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-green-500/20 group-hover/item:bg-green-500/30 transition-all duration-300 group-hover/item:scale-110">
                      <BanknoteIcon className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1 group-hover/item:text-green-500 transition-colors">
                      Budget
                    </h3>
                    <p className="text-sm text-foreground font-medium">
                      {formatTripBudget(trip.budget_total, trip.preferences?.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy & Description Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Privacy */}
                <div className="group/item p-4 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-purple-500/20 group-hover/item:bg-purple-500/30 transition-all duration-300 group-hover/item:scale-110">
                        <LockIcon className="h-4 w-4 text-purple-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-2 group-hover/item:text-purple-500 transition-colors">
                        Privacy
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        trip.is_private
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-green-500/20 text-green-500 border-green-500/30'
                      }`}>
                        {trip.is_private ? 'Private' : 'Public'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="group/item p-4 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-orange-500/20 group-hover/item:bg-orange-500/30 transition-all duration-300 group-hover/item:scale-110">
                        <FileTextIcon className="h-4 w-4 text-orange-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover/item:text-orange-500 transition-colors">
                        Description
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trip.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Card - Modernized */}
          <div className="glass-card rounded-2xl animate-glass-fade-in relative overflow-hidden group hover:shadow-2xl transition-all duration-500 participants-card-mobile" style={{ animationDelay: '200ms' }}>
            {/* Modern Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

            {/* Header Section */}
            <div className="relative z-10 p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-secondary/20 backdrop-blur-sm group-hover:bg-secondary/30 transition-all duration-300 group-hover:scale-110">
                    <UsersIcon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-secondary transition-colors duration-300">
                      Participants
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      People joining this trip
                    </p>
                  </div>
                </div>

                {/* Participant Count Badge */}
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary rounded-full border border-secondary/30">
                    {participants.length} {participants.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Link
                  href={`/trips/${id}/participants`}
                  className="glass-button-primary flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Manage
                </Link>

                {isOwner && (
                  <Link
                    href={`/trips/${id}/invite`}
                    className="glass-button inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-xl text-primary-foreground bg-primary/90 hover:bg-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    Invite
                  </Link>
                )}
              </div>
            </div>

            {/* Participants List */}
            <div className="relative z-10 p-4 md:p-6">
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/20 backdrop-blur-sm">
                      <UsersIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">No participants yet</p>
                      <p className="text-xs text-muted-foreground">Invite people to join your trip</p>
                    </div>
                    {isOwner && (
                      <Link
                        href={`/trips/${id}/invite`}
                        className="glass-button-primary inline-flex items-center px-4 py-2 text-xs font-medium rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        Invite People
                      </Link>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant, index) => (
                      <div
                        key={participant.id}
                        className="group/participant p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] animate-glass-slide-up"
                        style={{ animationDelay: `${index * 100 + 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center group-hover/participant:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/20">
                                <span className="text-primary font-bold text-sm">
                                  {participant.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {participant.role === 'owner' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground group-hover/participant:text-primary transition-colors truncate">
                                {participant.full_name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{participant.email}</div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              participant.role === 'owner'
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : 'bg-secondary/20 text-secondary border-secondary/30'
                            } group-hover/participant:shadow-sm`}>
                              {participant.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Trip Actions - Modernized - Hidden on Mobile */}
        <div className="hidden md:block mt-8 lg:mt-12 animate-glass-fade-in" style={{ animationDelay: '300ms' }}>
          {/* Section Header */}
          <div className="relative mb-6 lg:mb-8 trip-actions-section-mobile">
            <div className="glass-card rounded-2xl p-4 md:p-6 border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-white/20">
                      <MapPinIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                      Trip Actions
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your trip activities and explore features
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{participants.length}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                  <div className="w-px h-8 bg-border"></div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary">5</div>
                    <div className="text-xs text-muted-foreground">Features</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-5 trip-actions-grid-mobile">
            {/* Trip Planner */}
            <Link href={`/trips/${id}/itinerary`} className="group">
              <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                {itineraryCount > 0 && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-blue-600/80 uppercase tracking-wide bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      Items
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-600 border border-blue-500/30 backdrop-blur-sm shadow-sm">
                      {itineraryCount}
                    </span>
                  </div>
                )}
                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  <div className="relative mb-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm md:text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors duration-300 mb-2">
                      Itinerary
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                      Plan daily activities
                    </p>
                  </div>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-xs text-blue-500 font-medium">
                      <span>Explore</span>
                      <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Travel Journal */}
            <Link href={`/trips/${id}/journal`} className="group">
              <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                {journalCount > 0 && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-purple-600/80 uppercase tracking-wide bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      Items
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-600 border border-purple-500/30 backdrop-blur-sm shadow-sm">
                      {journalCount}
                    </span>
                  </div>
                )}
                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  <div className="relative mb-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <BookOpenIcon className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm md:text-lg font-bold text-foreground group-hover:text-purple-500 transition-colors duration-300 mb-2">
                      Travel Journal
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                      Document your memories
                    </p>
                  </div>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-xs text-purple-500 font-medium">
                      <span>Explore</span>
                      <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Accommodations */}
            <Link href={`/trips/${id}/accommodations`} className="group">
              <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                {/* Modern Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                {/* Count Badge - positioned on the left */}
                {accommodationCount > 0 && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-emerald-600/80 uppercase tracking-wide bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      Items
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 border border-emerald-500/30 backdrop-blur-sm shadow-sm">
                      {accommodationCount}
                    </span>
                  </div>
                )}

                {/* Free plan limit info icon - positioned on the right */}
                {subscription?.tier === 'free' && (
                  <div className="absolute top-3 right-3 z-20 group/limit">
                    <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 cursor-help transition-all duration-200 hover:scale-110 hover:bg-emerald-500/30">
                      <Info className="h-4 w-4 text-emerald-600" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-52 p-3 bg-popover border border-border rounded-lg shadow-2xl opacity-0 invisible group-hover/limit:opacity-100 group-hover/limit:visible transition-all duration-200 z-[9999]">
                      <div className="text-xs space-y-1.5">
                        <p className="font-semibold text-foreground">Free Plan Limit</p>
                        <p className="text-muted-foreground">
                          You're using <span className="font-bold text-emerald-600">{accommodationCount} of 5</span> accommodations
                        </p>
                        <p className="text-xs text-muted-foreground pt-1.5 border-t border-border">
                          💎 Upgrade to Premium for unlimited accommodations
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-popover border-l border-t border-border rotate-45"></div>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Building2Icon className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm md:text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors duration-300 mb-2">
                      Accommodations
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                      Manage hotels and places to stay
                    </p>
                  </div>

                  {/* Action Indicator */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-xs text-emerald-500 font-medium">
                      <span>Manage</span>
                      <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Transportation */}
            <Link href={`/trips/${id}/transportation`} className="group">
              <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                {/* Modern Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                {/* Count Badge - positioned on the left */}
                {transportationCount > 0 && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-sky-600/80 uppercase tracking-wide bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      Items
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-600 border border-sky-500/30 backdrop-blur-sm shadow-sm">
                      {transportationCount}
                    </span>
                  </div>
                )}

                {/* Free plan limit info icon - positioned on the right */}
                {subscription?.tier === 'free' && (
                  <div className="absolute top-3 right-3 z-20 group/limit">
                    <div className="p-2 rounded-full bg-sky-500/20 border border-sky-500/30 cursor-help transition-all duration-200 hover:scale-110 hover:bg-sky-500/30">
                      <Info className="h-4 w-4 text-sky-600" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-52 p-3 bg-popover border border-border rounded-lg shadow-2xl opacity-0 invisible group-hover/limit:opacity-100 group-hover/limit:visible transition-all duration-200 z-[9999]">
                      <div className="text-xs space-y-1.5">
                        <p className="font-semibold text-foreground">Free Plan Limit</p>
                        <p className="text-muted-foreground">
                          You're using <span className="font-bold text-sky-600">{transportationCount} of 5</span> transportation items
                        </p>
                        <p className="text-xs text-muted-foreground pt-1.5 border-t border-border">
                          💎 Upgrade to Premium for unlimited transportation
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-popover border-l border-t border-border rotate-45"></div>
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <PlaneTakeoffIcon className="h-6 w-6 md:h-8 md:w-8 text-sky-500" />
                    </div>
                    {/* Motion indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm md:text-lg font-bold text-foreground group-hover:text-sky-500 transition-colors duration-300 mb-2">
                      Transportation
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                      Track flights, trains, and other transport
                    </p>
                  </div>

                  {/* Action Indicator */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-xs text-sky-500 font-medium">
                      <span>Track</span>
                      <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Expenses */}
            <Link href={`/trips/${id}/expenses`} className="group">
              <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                {/* Modern Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

                {/* Count Badge */}
                {expensesCount > 0 && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wide bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      Items
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-full text-xs font-bold bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 border border-amber-500/30 backdrop-blur-sm shadow-sm">
                      {expensesCount}
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center h-full">
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <DollarSignIcon className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
                    </div>
                    {/* Money indicator */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-sm md:text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors duration-300 mb-2">
                      Expenses
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                      Track and split trip expenses
                    </p>
                  </div>

                  {/* Action Indicator */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-xs text-amber-500 font-medium">
                      <span>Track</span>
                      <svg className="ml-1 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>


          </div>
        </div>
      </main>
    </div>
  );
}
