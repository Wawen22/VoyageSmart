'use client';

import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { CalendarIcon, BookOpenIcon, PlusIcon, ListIcon, Sparkles } from 'lucide-react';
import { it } from 'date-fns/locale';
// Import new split-screen components
import ItineraryListView from '@/components/itinerary/ItineraryListView';
import ItineraryMapView from '@/components/itinerary/ItineraryMapView';
import ItinerarySkeleton from '@/components/itinerary/ItinerarySkeleton';
// Lazy load ItineraryWizard for better performance
const ItineraryWizard = lazy(() => import('@/components/ai/ItineraryWizard'));
import { LazyItineraryMapView } from '@/components/LazyComponents';
import { ProactiveSuggestionsTray } from '@/components/dashboard/ProactiveSuggestionsTray';
import { TripChecklistTrigger } from '@/components/trips/TripChecklistTrigger';
import { useProactiveSuggestions } from '@/hooks/useProactiveSuggestions';

// Lazy load heavy components
const ActivityModal = lazy(() => import('@/components/itinerary/ActivityModal'));
const DayModal = lazy(() => import('@/components/itinerary/DayModal'));
const MoveActivityModal = lazy(() => import('@/components/itinerary/MoveActivityModal'));
const CalendarView = lazy(() => import('@/components/itinerary/CalendarView'));
const ActivityDetailsModal = lazy(() => import('@/components/activity/ActivityDetailsModal'));

type Trip = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
};

type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
};

type Activity = {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
  coordinates?: string | { x: number; y: number } | null;
};

export default function TripItinerary() {
  const { id } = useParams();
  const tripId = Array.isArray(id) ? id[0] : (id as string);
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();

  const hasAIAccess = canAccessFeature('ai_assistant');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentDay, setCurrentDay] = useState<ItineraryDay | null>(null);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [currentDayId, setCurrentDayId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'map'>('list');
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);

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
    const cacheKey = `itinerary_${id}`;

    const fetchTripAndItinerary = async () => {
      try {
        setLoading(true);

        if (!user) return;

        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp;
            const now = Date.now();

            if (now - cacheTime < 5 * 60 * 1000) {
              console.log('[Itinerary] Using cached data');
              setTrip(parsed.trip);
              setItineraryDays(parsed.days);
              setIsParticipant(parsed.isParticipant);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing cached data:', e);
          }
        }

        console.log('[Itinerary] Fetching fresh data');

        const [tripResponse, participantResponse] = await Promise.all([
          supabase
            .from('trips')
            .select('id, name, start_date, end_date, destination, owner_id')
            .eq('id', id)
            .single(),
          supabase
            .from('trip_participants')
            .select('id')
            .eq('trip_id', id)
            .eq('user_id', user.id)
            .maybeSingle()
        ]);

        if (tripResponse.error) throw tripResponse.error;
        const tripData = tripResponse.data;
        setTrip(tripData);

        if (participantResponse.error) throw participantResponse.error;
        const isUserParticipant = !!participantResponse.data || tripData.owner_id === user.id;
        setIsParticipant(isUserParticipant);

        if (!isUserParticipant) {
          setError('You do not have permission to view this trip\'s itinerary');
          setLoading(false);
          return;
        }

        const daysResponse = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (daysResponse.error) throw daysResponse.error;
        const daysData = daysResponse.data;

        const activitiesResponse = await supabase
          .from('activities')
          .select('*')
          .eq('trip_id', id)
          .order('start_time', { ascending: true });

        if (activitiesResponse.error) throw activitiesResponse.error;
        const allActivities = activitiesResponse.data || [];

        const activitiesByDay = allActivities.reduce((acc, activity) => {
          if (!acc[activity.day_id]) {
            acc[activity.day_id] = [];
          }
          acc[activity.day_id].push(activity);
          return acc;
        }, {});

        const daysWithActivities = daysData.map(day => ({
          ...day,
          activities: activitiesByDay[day.id] || []
        }));

        setItineraryDays(daysWithActivities);

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            trip: tripData,
            days: daysWithActivities,
            isParticipant
          }));
        } catch (e) {
          console.error('Error caching data:', e);
        }

        if (daysWithActivities.length === 0 && tripData.start_date && tripData.end_date) {
          await createDefaultItineraryDays(tripData.start_date, tripData.end_date);
        }
      } catch (err) {
        console.error('Error fetching trip itinerary:', err);
        setError('Failed to load itinerary. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripAndItinerary();
  }, [id, user]);

  useEffect(() => {
    if (!user?.id || !id) return;

    const run = async () => {
      await refreshProactiveSuggestions({ silent: true });
      await triggerProactiveSuggestions({ trigger: 'app_open' });
    };

    void run();
  }, [user?.id, id, refreshProactiveSuggestions, triggerProactiveSuggestions]);

  const createDefaultItineraryDays = async (startDate: string, endDate: string) => {
    try {
      if (!id) {
        throw new Error('Trip ID is required');
      }

      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (!isValid(start) || !isValid(end)) {
        throw new Error(`Invalid date format: start=${startDate}, end=${endDate}`);
      }

      const { data: existingDays, error: checkError } = await supabase
        .from('itinerary_days')
        .select('day_date')
        .eq('trip_id', id);

      if (checkError) throw checkError;

      const existingDatesSet = new Set(existingDays?.map(day => day.day_date) || []);

      const days = [];
      let currentDate = start;

      while (currentDate <= end) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');

        if (!existingDatesSet.has(formattedDate)) {
          days.push({
            trip_id: id,
            day_date: formattedDate,
            notes: null,
          });
        }

        currentDate = addDays(currentDate, 1);
      }

      if (days.length > 0) {
        const { data, error } = await supabase
          .from('itinerary_days')
          .insert(days)
          .select();

        if (error) throw error;

        const newDaysWithActivities = data.map(day => ({
          ...day,
          activities: [],
        }));

        const { data: allDays, error: fetchError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (fetchError) throw fetchError;

        const allDaysWithActivities = allDays.map(day => ({
          ...day,
          activities: [],
        }));

        setItineraryDays(allDaysWithActivities);
      } else if (existingDays && existingDays.length > 0) {
        const { data: allDays, error: fetchError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (fetchError) throw fetchError;

        const allDaysWithActivities = allDays.map(day => ({
          ...day,
          activities: [],
        }));

        setItineraryDays(allDaysWithActivities);
      }
    } catch (err) {
      console.error('Error creating default itinerary days:', err);
      setError('Failed to create default itinerary days. Please try again.');
    }
  };

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

  const handleSaveDay = async (formData: { day_date: string; notes: string }) => {
    try {
      if (currentDay) {
        const { data, error } = await supabase
          .from('itinerary_days')
          .update({
            day_date: formData.day_date,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDay.id)
          .select();

        if (error) throw error;

        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDay.id) {
            return {
              ...day,
              day_date: formData.day_date,
              notes: formData.notes || null,
              updated_at: new Date().toISOString(),
            };
          }
          return day;
        }).sort((a, b) => new Date(a.day_date).getTime() - new Date(b.day_date).getTime()));
      } else {
        const { data, error } = await supabase
          .from('itinerary_days')
          .insert([
            {
              trip_id: id,
              day_date: formData.day_date,
              notes: formData.notes || null,
            },
          ])
          .select();

        if (error) throw error;

        const newDay = {
          ...data[0],
          activities: [],
        };

        setItineraryDays([...itineraryDays, newDay].sort((a, b) =>
          new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
        ));
      }

      setShowDayModal(false);
      setCurrentDay(null);
    } catch (err) {
      console.error('Error saving day:', err);
      setError('Failed to save day. Please try again.');
    }
  };

  const handleDeleteDay = async () => {
    if (!currentDay) return;

    try {
      const { error } = await supabase
        .from('itinerary_days')
        .delete()
        .eq('id', currentDay.id);

      if (error) throw error;

      setItineraryDays(itineraryDays.filter(day => day.id !== currentDay.id));

      setShowDayModal(false);
      setCurrentDay(null);
    } catch (err) {
      console.error('Error deleting day:', err);
      setError('Failed to delete day. Please try again.');
    }
  };

  const handleSaveActivity = async (formData: any) => {
    try {
      let coordinatesValue = null;
      if (formData.coordinates) {
        coordinatesValue = `(${formData.coordinates.x},${formData.coordinates.y})`;
        console.log('Saving coordinates:', coordinatesValue);
      }

      const activityData = {
        trip_id: id,
        day_id: currentDayId,
        name: formData.name,
        type: formData.type || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        location: formData.location || null,
        booking_reference: formData.booking_reference || null,
        priority: parseInt(formData.priority) || 3,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        currency: formData.currency || 'EUR',
        notes: formData.notes || null,
        status: formData.status || 'planned',
        coordinates: coordinatesValue,
      };

      if (currentActivity) {
        console.log('Updating activity with data:', activityData);
        const { data, error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', currentActivity.id)
          .select();

        if (error) {
          console.error('Supabase error updating activity:', error);
          throw error;
        }

        console.log('Activity updated successfully:', data);

        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: day.activities?.map(activity =>
                activity.id === currentActivity.id ? {
                  ...data[0],
                  coordinates: data[0].coordinates || (activity as any).coordinates
                } : activity
              ) || [],
            };
          }
          return day;
        }));
      } else {
        console.log('Creating new activity with data:', activityData);
        const { data, error } = await supabase
          .from('activities')
          .insert([activityData])
          .select();

        if (error) {
          console.error('Supabase error creating activity:', error);
          throw error;
        }

        console.log('Activity created successfully:', data);

        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: [...(day.activities || []), {
                ...data[0],
                coordinates: data[0].coordinates
              }].sort((a, b) =>
                (a.start_time && b.start_time) ?
                  new Date(a.start_time).getTime() - new Date(b.start_time).getTime() : 0
              ),
            };
          }
          return day;
        }));
      }

      setShowActivityModal(false);
      setCurrentActivity(null);
      setCurrentDayId('');
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity. Please try again.');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      setItineraryDays(itineraryDays.map(day => ({
        ...day,
        activities: day.activities?.filter(activity => activity.id !== activityId) || [],
      })));
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity. Please try again.');
    }
  };

  const handleDeleteMultipleActivities = async (activityIds: string[]) => {
    if (!activityIds.length) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .in('id', activityIds);

      if (error) throw error;

      setItineraryDays(itineraryDays.map(day => ({
        ...day,
        activities: day.activities?.filter(activity => !activityIds.includes(activity.id)) || [],
      })));
    } catch (err) {
      console.error('Error deleting multiple activities:', err);
      setError('Failed to delete activities. Please try again.');
    }
  };

  const handleDeleteAllActivities = async (dayId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('day_id', dayId);

      if (error) throw error;

      setItineraryDays(itineraryDays.map(day => {
        if (day.id === dayId) {
          return {
            ...day,
            activities: [],
          };
        }
        return day;
      }));
    } catch (err) {
      console.error('Error deleting all activities:', err);
      setError('Failed to delete activities. Please try again.');
    }
  };

  const handleMoveActivity = (activity: Activity) => {
    setCurrentActivity(activity);
    setShowMoveModal(true);
  };

  const handleViewActivityDetails = (activity: Activity) => {
    setCurrentActivity(activity);
    setShowDetailsModal(true);
  };

  const handleMoveActivitySubmit = async (activityId: string, newDayId: string) => {
    try {
      const activityToMove = itineraryDays
        .flatMap(day => day.activities || [])
        .find(activity => activity.id === activityId);

      if (!activityToMove) {
        throw new Error('Activity not found');
      }

      const { error } = await supabase
        .from('activities')
        .update({ day_id: newDayId })
        .eq('id', activityId);

      if (error) throw error;

      setItineraryDays(prevDays =>
        prevDays.map(day => ({
          ...day,
          activities: day.id === newDayId
            ? [...(day.activities || []), { ...activityToMove, day_id: newDayId }]
            : day.activities?.filter(activity => activity.id !== activityId) || [],
        }))
      );

      setShowMoveModal(false);
      setCurrentActivity(null);
    } catch (err) {
      console.error('Error moving activity:', err);
      setError('Failed to move activity. Please try again.');
    }
  };

  // Handler for clicking an activity in the list view
  const handleActivityClick = (activity: Activity, index: number) => {
    setSelectedActivityIndex(index);
  };

  // Handler for clicking a marker on the map
  const handleMarkerClick = (index: number) => {
    setSelectedActivityIndex(index);
  };

  // Flatten all activities across all days for sequential numbering
  const allActivities = useMemo(() => {
    if (!itineraryDays || !Array.isArray(itineraryDays)) {
      return [];
    }
    return itineraryDays.flatMap(day => 
      day.activities?.map(activity => ({
        ...activity,
        dayDate: day.day_date
      })) || []
    );
  }, [itineraryDays]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-2">
            <BackButton href={`/trips/${id}`} />
            <TripChecklistTrigger tripId={tripId} />
          </div>
          <h1 className="text-2xl font-bold">Itinerary</h1>
        </div>
        <ItinerarySkeleton />
      </div>
    );
  }

  if (error && !isParticipant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Link
          href={`/trips/${id}`}
          className="text-primary hover:text-primary/90 transition-colors"
        >
          ← Back to Trip
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>Trip not found</p>
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
      <header className="relative overflow-visible mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-background/95 to-purple-500/10 backdrop-blur-xl"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton
                href={`/trips/${id}`}
                label="Back to Trip"
                theme="blue"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-end">
              <TripChecklistTrigger tripId={tripId} />
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
        </div>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile itinerary-header-mobile">
          <div className="animate-glass-fade-in">
            <div className="relative mb-6">
              <div className="flex flex-col space-y-4 md:hidden">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-blue-500 to-foreground bg-clip-text text-transparent">
                        Trip Itinerary
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="glass-info-card flex items-center px-4 py-2 rounded-xl">
                    <div className="p-1 rounded-full bg-blue-500/20 mr-2">
                      <BookOpenIcon className="h-3 w-3 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-blue-500">{itineraryDays.length}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {itineraryDays.length === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20">
                      <CalendarIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-blue-500 to-foreground bg-clip-text text-transparent">
                        Trip Itinerary
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-base text-muted-foreground mt-1">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="glass-info-card flex items-center px-4 py-2.5 rounded-2xl">
                    <div className="p-1.5 rounded-full bg-blue-500/20 mr-3">
                      <BookOpenIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-500">{itineraryDays.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {itineraryDays.length === 1 ? 'Day' : 'Days'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -right-4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 itinerary-section-mobile">
        {error && (
          <div className="glass-card rounded-2xl p-4 mb-6 bg-gradient-to-r from-destructive/10 to-red-500/5 border-destructive/30 animate-glass-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/20 backdrop-blur-sm">
                <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-destructive">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-0">
          <div className="glass-card rounded-xl p-3 animate-glass-fade-in itinerary-controls-mobile mb-3" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-500/20 backdrop-blur-sm flex-shrink-0">
                  <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="glass-nav rounded-lg p-0.5 border border-white/20 bg-background/50 backdrop-blur-sm flex">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-blue-500/20 text-blue-600 shadow-sm'
                        : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10'
                    }`}
                    aria-label="List view"
                  >
                    <ListIcon className="h-3 w-3 mr-1" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                      viewMode === 'calendar'
                        ? 'bg-blue-500/20 text-blue-600 shadow-sm'
                        : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10'
                    }`}
                    aria-label="Calendar view"
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                      viewMode === 'map'
                        ? 'bg-blue-500/20 text-blue-600 shadow-sm'
                        : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10'
                    }`}
                    aria-label="Map view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Map
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 w-full sm:w-auto sm:flex-shrink-0 action-buttons-mobile">
                {!hasAIAccess ? (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="relative overflow-hidden px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-1.5 group min-w-0 w-full sm:w-auto"
                    aria-label="Upgrade to AI plan"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 via-gray-400/15 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 rounded-md sm:rounded-lg"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md sm:rounded-lg"></div>
                    <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                      <span className="text-gray-600 group-hover:text-gray-500 transition-colors text-xs font-medium">AI Plan</span>
                    </div>
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setCurrentDay(null);
                    setShowDayModal(true);
                  }}
                  className="relative overflow-hidden px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-1.5 group min-w-0 w-full sm:w-auto"
                  aria-label="Add a new day"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-md sm:rounded-lg"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md sm:rounded-lg"></div>
                  <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                    <PlusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    <span className="text-blue-600 group-hover:text-blue-500 transition-colors text-xs font-medium">Add Day</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {itineraryDays.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center animate-glass-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20">
                    <CalendarIcon className="h-12 w-12 text-blue-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400/20 rounded-full animate-ping"></div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">No itinerary days yet</h2>
                  <p className="text-muted-foreground max-w-md">
                    Start planning your trip by adding your first day and activities.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCurrentDay(null);
                    setShowDayModal(true);
                  }}
                  className="glass-button-primary inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Day
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-300px)] border border-border/30 rounded-xl overflow-hidden">
              <div className="w-full lg:w-1/2 h-full relative shadow-2xl lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] z-10 overflow-auto">
                <ItineraryListView
                  days={itineraryDays}
                  onAddActivity={(dayId) => {
                    setCurrentActivity(null);
                    setCurrentDayId(dayId);
                    setShowActivityModal(true);
                  }}
                  onEditActivity={(activity) => {
                    setCurrentActivity(activity);
                    setCurrentDayId(activity.day_id);
                    setShowActivityModal(true);
                  }}
                  onDeleteActivity={handleDeleteActivity}
                  onActivityClick={handleActivityClick}
                  selectedActivityIndex={selectedActivityIndex}
                  enableDragDrop={true}
                  onMoveActivity={async (activityId: string, sourceDayId: string, targetDayId: string) => {
                    try {
                      const { error } = await supabase
                        .from('activities')
                        .update({ day_id: targetDayId })
                        .eq('id', activityId);

                      if (error) throw error;

                      // Update local state
                      setItineraryDays(prevDays =>
                        prevDays.map(day => {
                          if (day.id === sourceDayId) {
                            return {
                              ...day,
                              activities: day.activities?.filter(a => a.id !== activityId) || [],
                            };
                          } else if (day.id === targetDayId) {
                            const activityToMove = prevDays
                              .find(d => d.id === sourceDayId)
                              ?.activities?.find(a => a.id === activityId);
                            
                            if (activityToMove) {
                              return {
                                ...day,
                                activities: [...(day.activities || []), { ...activityToMove, day_id: targetDayId }],
                              };
                            }
                          }
                          return day;
                        })
                      );
                    } catch (err) {
                      console.error('Error moving activity:', err);
                      setError('Failed to move activity. Please try again.');
                    }
                  }}
                />
              </div>
              <div className="hidden lg:block lg:w-1/2 h-full overflow-hidden">
                <ItineraryMapView
                  activities={allActivities}
                  selectedActivityIndex={selectedActivityIndex}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          ) : viewMode === 'calendar' ? (
            <Suspense fallback={<div className="p-8 text-center">Loading calendar view...</div>}>
              <CalendarView
                days={itineraryDays}
                onEditDay={(day) => {
                  setCurrentDay(day);
                  setShowDayModal(true);
                }}
                onAddActivity={(dayId) => {
                  setCurrentActivity(null);
                  setCurrentDayId(dayId);
                  setShowActivityModal(true);
                }}
                onEditActivity={(activity) => {
                  setCurrentActivity(activity);
                  setCurrentDayId(activity.day_id);
                  setShowActivityModal(true);
                }}
                onDeleteActivity={handleDeleteActivity}
                onDeleteMultipleActivities={handleDeleteMultipleActivities}
                onDeleteAllActivities={handleDeleteAllActivities}
                onMoveActivity={handleMoveActivity}
                onViewActivityDetails={handleViewActivityDetails}
              />
            </Suspense>
          ) : (
            <ItineraryMapView
              activities={allActivities}
              selectedActivityIndex={selectedActivityIndex}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        {showDayModal && (
          <DayModal
            isOpen={showDayModal}
            onClose={() => {
              setShowDayModal(false);
              setCurrentDay(null);
              setError(null);
            }}
            onSave={handleSaveDay}
            onDelete={currentDay ? handleDeleteDay : undefined}
            day={currentDay}
            tripId={id as string}
          />
        )}

        {showActivityModal && (
          <ActivityModal
            isOpen={showActivityModal}
            onClose={() => {
              setShowActivityModal(false);
              setCurrentActivity(null);
              setCurrentDayId('');
              setError(null);
            }}
            onSave={handleSaveActivity}
            activity={currentActivity}
            tripId={id as string}
            dayId={currentDayId}
          />
        )}

        {showMoveModal && currentActivity && (
          <MoveActivityModal
            isOpen={showMoveModal}
            onClose={() => {
              setShowMoveModal(false);
              setCurrentActivity(null);
              setError(null);
            }}
            onMove={handleMoveActivitySubmit}
            activity={currentActivity}
            days={itineraryDays}
          />
        )}

        {showDetailsModal && currentActivity && (
          <ActivityDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setCurrentActivity(null);
            }}
            activity={currentActivity}
            onEdit={(activity) => {
              setShowDetailsModal(false);
              setCurrentActivity(activity);
              setCurrentDayId(activity.day_id);
              setShowActivityModal(true);
            }}
          />
        )}
      </Suspense>

      {hasAIAccess && (
        <Suspense fallback={
          <div className="fixed inset-4 bg-background border border-border rounded-lg shadow-xl z-[99] flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Caricamento AI Wizard...</p>
            </div>
          </div>
        }>
          <ItineraryWizard
            tripId={id as string}
            tripData={trip}
            itineraryDays={itineraryDays}
            onActivitiesGenerated={(activities) => {
              setItineraryDays(prevDays => {
                const updatedDays = [...prevDays];

                activities.forEach(activity => {
                  const dayIndex = updatedDays.findIndex(day => day.id === activity.day_id);
                  if (dayIndex !== -1) {
                    updatedDays[dayIndex] = {
                      ...updatedDays[dayIndex],
                      activities: [
                        ...(updatedDays[dayIndex].activities || []),
                        activity
                      ].sort((a, b) =>
                        (a.start_time && b.start_time) ?
                          new Date(a.start_time).getTime() - new Date(b.start_time).getTime() : 0
                      )
                    };
                  }
                });

                return updatedDays;
              });
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
