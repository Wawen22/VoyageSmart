'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { CalendarIcon, BookOpenIcon, ImageIcon, ClockIcon, BookIcon, PlusIcon, ListIcon, Sparkles, LockIcon, InfoIcon } from 'lucide-react';
import { it } from 'date-fns/locale';
// Lazy load DaySchedule for better performance
const DaySchedule = lazy(() => import('@/components/itinerary/DaySchedule'));
import ItinerarySkeleton from '@/components/itinerary/ItinerarySkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
// Lazy load ItineraryWizard for better performance
const ItineraryWizard = lazy(() => import('@/components/ai/ItineraryWizard'));
import AIUpgradePrompt from '@/components/subscription/AIUpgradePrompt';
import { LazyItineraryMapView } from '@/components/LazyComponents';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchJournalEntries, fetchJournalMedia, JournalEntry } from '@/lib/features/journalSlice';

// Lazy load heavy components
const ActivityModal = lazy(() => import('@/components/itinerary/ActivityModal'));
const DayModal = lazy(() => import('@/components/itinerary/DayModal'));
const MoveActivityModal = lazy(() => import('@/components/itinerary/MoveActivityModal'));
const CalendarView = lazy(() => import('@/components/itinerary/CalendarView'));
const ActivityDetailsModal = lazy(() => import('@/components/activity/ActivityDetailsModal'));
const JournalEntryForm = lazy(() => import('@/components/journal/JournalEntryForm'));
const JournalEntryCard = lazy(() => import('@/components/journal/JournalEntryCard'));
const SimpleMediaUploader = lazy(() => import('@/components/journal/SimpleMediaUploader'));
const MediaGallery = lazy(() => import('@/components/journal/MediaGallery'));
const MemoriesTimeline = lazy(() => import('@/components/journal/MemoriesTimeline'));
const JournalInfoModal = lazy(() => import('@/components/subscription/JournalInfoModal'));

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
};

export default function TripItinerary() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessFeature, subscription } = useSubscription();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, media, loading: journalLoading } = useSelector((state: RootState) => state.journal);

  // Verifica se l'utente ha accesso alle funzionalità AI e Journal
  const hasAIAccess = canAccessFeature('ai_assistant');
  const hasJournalAccess = canAccessFeature('journal');

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

  // Wizard states
  const [showWizard, setShowWizard] = useState(false);

  // Journal states
  const [activeTab, setActiveTab] = useState('itinerary');
  const [journalTab, setJournalTab] = useState('timeline');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [showJournalInfoModal, setShowJournalInfoModal] = useState(false);

  useEffect(() => {
    // Load journal data
    dispatch(fetchJournalEntries(id as string));
    dispatch(fetchJournalMedia(id as string));
  }, [dispatch, id]);

  // Check for tab parameter in URL
  useEffect(() => {
    // Get the URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');

    // If tab parameter exists and is valid, set the active tab
    if (tabParam === 'journal') {
      setActiveTab('journal');
    }
  }, []);

  useEffect(() => {
    // Create a cache key for this trip
    const cacheKey = `itinerary_${id}`;

    const fetchTripAndItinerary = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Check if we have cached data
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp;
            const now = Date.now();

            // Use cache if it's less than 5 minutes old
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
            // Continue with normal fetch if cache parsing fails
          }
        }

        console.log('[Itinerary] Fetching fresh data');

        // Fetch trip details and participant status in parallel
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

        // Fetch all itinerary days at once
        const daysResponse = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (daysResponse.error) throw daysResponse.error;
        const daysData = daysResponse.data;

        // Fetch all activities for this trip at once (more efficient than per-day)
        const activitiesResponse = await supabase
          .from('activities')
          .select('*')
          .eq('trip_id', id)
          .order('start_time', { ascending: true });

        if (activitiesResponse.error) throw activitiesResponse.error;
        const allActivities = activitiesResponse.data || [];

        // Group activities by day_id
        const activitiesByDay = allActivities.reduce((acc, activity) => {
          if (!acc[activity.day_id]) {
            acc[activity.day_id] = [];
          }
          acc[activity.day_id].push(activity);
          return acc;
        }, {});

        // Combine days with their activities
        const daysWithActivities = daysData.map(day => ({
          ...day,
          activities: activitiesByDay[day.id] || []
        }));

        setItineraryDays(daysWithActivities);

        // Cache the data
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            trip: tripData,
            days: daysWithActivities,
            isParticipant
          }));
        } catch (e) {
          console.error('Error caching data:', e);
          // Continue even if caching fails
        }

        // If trip has start and end dates but no itinerary days, create them automatically
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

  const createDefaultItineraryDays = async (startDate: string, endDate: string) => {
    try {
      // Validate trip ID
      if (!id) {
        throw new Error('Trip ID is required');
      }

      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (!isValid(start) || !isValid(end)) {
        throw new Error(`Invalid date format: start=${startDate}, end=${endDate}`);
      }

      // First check if there are already days for this trip
      const { data: existingDays, error: checkError } = await supabase
        .from('itinerary_days')
        .select('day_date')
        .eq('trip_id', id);

      if (checkError) throw checkError;

      // Create a set of existing dates for quick lookup
      const existingDatesSet = new Set(existingDays?.map(day => day.day_date) || []);

      // Only create days that don't already exist
      const days = [];
      let currentDate = start;

      while (currentDate <= end) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');

        // Only add the day if it doesn't already exist
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
        // Insert only the new days
        const { data, error } = await supabase
          .from('itinerary_days')
          .insert(days)
          .select();

        if (error) throw error;

        // Add empty activities array to each day
        const newDaysWithActivities = data.map(day => ({
          ...day,
          activities: [],
        }));

        // Fetch all days again to get a complete list
        const { data: allDays, error: fetchError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Add empty activities array to each day
        const allDaysWithActivities = allDays.map(day => ({
          ...day,
          activities: [],
        }));

        setItineraryDays(allDaysWithActivities);
      } else if (existingDays && existingDays.length > 0) {
        // If we have existing days but didn't add any new ones, fetch all days
        const { data: allDays, error: fetchError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Add empty activities array to each day
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

  const handleSaveDay = async (formData: { day_date: string; notes: string }) => {
    try {
      if (currentDay) {
        // Update existing day
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

        // Update the day in the state
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
        // Create new day
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

      // Remove the day from the state
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
      // Prepara le coordinate nel formato PostgreSQL point se presenti
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
        // Update existing activity
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

        // Update the activity in the state
        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: day.activities?.map(activity =>
                activity.id === currentActivity.id ? {
                  ...data[0],
                  // Assicurati che le coordinate siano incluse nello stato
                  coordinates: data[0].coordinates || (activity as any).coordinates
                } : activity
              ) || [],
            };
          }
          return day;
        }));
      } else {
        // Create new activity
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

        // Add the new activity to the state
        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: [...(day.activities || []), {
                ...data[0],
                // Assicurati che le coordinate siano incluse nello stato
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

      // Remove the activity from the state
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
      // Delete multiple activities using the .in() operator
      const { error } = await supabase
        .from('activities')
        .delete()
        .in('id', activityIds);

      if (error) throw error;

      // Remove the activities from the state
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
      // Delete all activities for a specific day
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('day_id', dayId);

      if (error) throw error;

      // Remove all activities for this day from the state
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

  // Journal methods
  const handleAddEntry = () => {
    setCurrentEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setShowEntryForm(true);
  };

  const handleCloseForm = () => {
    setShowEntryForm(false);
    setCurrentEntry(null);
  };

  const handleToggleMediaUploader = () => {
    setShowMediaUploader(!showMediaUploader);
  };

  const handleMoveActivitySubmit = async (activityId: string, newDayId: string) => {
    try {
      // Find the activity to move
      const activityToMove = itineraryDays
        .flatMap(day => day.activities || [])
        .find(activity => activity.id === activityId);

      if (!activityToMove) {
        throw new Error('Activity not found');
      }

      // Update the activity in the database
      const { error } = await supabase
        .from('activities')
        .update({ day_id: newDayId })
        .eq('id', activityId);

      if (error) throw error;

      // Update the state to reflect the moved activity
      setItineraryDays(prevDays =>
        prevDays.map(day => ({
          ...day,
          activities: day.id === newDayId
            ? [...(day.activities || []), { ...activityToMove, day_id: newDayId }]
            : day.activities?.filter(activity => activity.id !== activityId) || [],
        }))
      );

      // Close the modal
      setShowMoveModal(false);
      setCurrentActivity(null);
    } catch (err) {
      console.error('Error moving activity:', err);
      setError('Failed to move activity. Please try again.');
    }
  };

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
        <div className="flex items-center mb-6">
          <BackButton href={`/trips/${id}`} />
          <h1 className="text-2xl font-bold ml-2">Itinerary</h1>
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
      <header className="relative overflow-hidden mb-6">
        {/* Modern Glassmorphism Background - Blue/Purple Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-background/95 to-purple-500/10 backdrop-blur-xl"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern"></div>
        </div>

        {/* Glass border effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

        {/* Navigation Bar with Glass Effect */}
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <BackButton
              href={`/trips/${id}`}
              label="Back to Trip"
              theme="blue"
            />
          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10 trip-header-mobile itinerary-header-mobile">
          <div className="animate-glass-fade-in">
            {/* Section Title with Modern Typography */}
            <div className="relative mb-6">
              {/* Mobile Layout - Stacked */}
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
                        Trip Planner
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Widget - Mobile */}
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

              {/* Desktop Layout - Side by Side */}
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
                        Trip Planner
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-base text-muted-foreground mt-1">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Widget - Desktop */}
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

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -right-4 w-2 h-2 bg-purple-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 itinerary-section-mobile">
        {/* Error Message - Modernized */}
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

        {/* Main Tabs - Modernized */}
        <div className="glass-card rounded-2xl p-4 md:p-6 animate-glass-fade-in itinerary-main-tabs-mobile mb-8" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Trip Management</h3>
              <p className="text-sm text-muted-foreground">Plan your itinerary and capture memories</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-2 sm:gap-6 w-full">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`group relative w-full sm:w-auto sm:flex-1 px-3 py-3 sm:px-8 sm:py-6 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4 transition-all duration-300 itinerary-tab-mobile ${
                activeTab === 'itinerary'
                  ? 'glass-button-primary bg-gradient-to-br from-blue-500/20 to-purple-500/10 border-blue-500/30 shadow-lg shadow-blue-500/25 sm:scale-105'
                  : 'glass-button-inactive bg-gradient-to-br from-background/50 via-background/30 to-background/50 backdrop-blur-sm border border-white/10 hover:bg-gradient-to-br hover:from-blue-500/10 hover:via-blue-500/5 hover:to-purple-500/10 hover:border-blue-500/20 hover:shadow-md hover:shadow-blue-500/10'
              }`}
            >
              <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm border border-white/20 flex-shrink-0 ${
                activeTab === 'itinerary'
                  ? 'bg-blue-500/20 text-blue-600 shadow-sm'
                  : 'bg-background/20 text-muted-foreground group-hover:bg-blue-500/15 group-hover:text-blue-500 group-hover:shadow-sm'
              } transition-all duration-300`}>
                <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="flex flex-col text-left flex-1 min-w-0">
                <span className={`font-bold text-sm sm:text-base lg:text-lg truncate ${
                  activeTab === 'itinerary' ? 'text-blue-600' : 'text-foreground group-hover:text-blue-600'
                } transition-colors duration-300`}>Itinerary</span>
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Plan your daily activities</span>
              </div>
              {activeTab === 'itinerary' && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 sm:h-12 bg-gradient-to-b from-blue-500 to-purple-500 rounded-l-full"></div>
              )}
            </button>

            <div className="relative w-full sm:w-auto sm:flex-1">
              <button
                onClick={() => {
                  if (hasJournalAccess) {
                    setActiveTab('journal');
                  } else {
                    setShowJournalInfoModal(true);
                  }
                }}
                className={`group relative w-full px-3 py-3 sm:px-8 sm:py-6 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4 transition-all duration-300 itinerary-tab-mobile ${
                  !hasJournalAccess
                    ? 'glass-button-inactive bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 hover:bg-gradient-to-br hover:from-amber-500/15 hover:via-amber-400/10 hover:to-orange-500/15 hover:border-amber-500/30 hover:shadow-md hover:shadow-amber-500/10 cursor-pointer'
                    : activeTab === 'journal'
                    ? 'glass-button-primary bg-gradient-to-br from-purple-500/20 to-blue-500/10 border-purple-500/30 shadow-lg shadow-purple-500/25 sm:scale-105'
                    : 'glass-button-inactive bg-gradient-to-br from-background/50 via-background/30 to-background/50 backdrop-blur-sm border border-white/10 hover:bg-gradient-to-br hover:from-purple-500/10 hover:via-purple-500/5 hover:to-blue-500/10 hover:border-purple-500/20 hover:shadow-md hover:shadow-purple-500/10'
                }`}
              >
                <div className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm border border-white/20 flex-shrink-0 ${
                  !hasJournalAccess
                    ? 'bg-amber-500/20 text-amber-600 group-hover:bg-amber-500/30 group-hover:shadow-sm'
                    : activeTab === 'journal'
                    ? 'bg-purple-500/20 text-purple-600 shadow-sm'
                    : 'bg-background/20 text-muted-foreground group-hover:bg-purple-500/15 group-hover:text-purple-500 group-hover:shadow-sm'
                } transition-all duration-300`}>
                  {!hasJournalAccess ? (
                    <LockIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                  ) : (
                    <BookOpenIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                  )}
                </div>
                <div className="flex flex-col flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`font-bold text-sm sm:text-base lg:text-lg truncate ${
                      !hasJournalAccess
                        ? 'text-amber-600'
                        : activeTab === 'journal'
                        ? 'text-purple-600'
                        : 'text-foreground group-hover:text-purple-600'
                    } transition-colors duration-300`}>Journal</span>
                    {!hasJournalAccess && (
                      <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 border border-amber-500/30 backdrop-blur-sm flex-shrink-0">
                        Premium
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Keep a diary and photos</span>
                </div>
                {activeTab === 'journal' && hasJournalAccess && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-purple-500 to-blue-500 rounded-l-full"></div>
                )}
              </button>

              {/* Info Icon for Free Users */}
              {!hasJournalAccess && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowJournalInfoModal(true);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 backdrop-blur-sm border border-amber-500/30 transition-all duration-300 hover:scale-110 z-10 group/info"
                  title="Learn about Journal features"
                >
                  <InfoIcon className="h-4 w-4 text-amber-600 group-hover/info:text-amber-700 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'itinerary' && (
          <div className="mt-0">
            {/* Itinerary Controls - Ultra Compact */}
            <div className="glass-card rounded-xl p-3 animate-glass-fade-in itinerary-controls-mobile mb-3" style={{ animationDelay: '200ms' }}>
              {/* Single Row Layout */}
              <div className="flex items-center justify-between gap-3">
                {/* View toggle - Ultra Compact Horizontal */}
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
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

                {/* Action buttons - Mobile Ultra Compact */}
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-1.5 w-full sm:w-auto sm:flex-shrink-0 action-buttons-mobile">
                  {/* AI Wizard button - Glassy Purple */}
                  {hasAIAccess ? (
                    <button
                      onClick={() => setShowWizard(true)}
                      className="relative overflow-hidden px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-1.5 group min-w-0 w-full sm:w-auto"
                      aria-label="Generate activities with AI"
                    >
                      {/* Glassy Background - Purple Theme */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-indigo-500/20 backdrop-blur-sm border border-purple-500/30 rounded-md sm:rounded-lg"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md sm:rounded-lg"></div>

                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-600 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                        <span className="text-purple-600 group-hover:text-purple-500 transition-colors text-xs font-medium">AI Wizard</span>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/pricing')}
                      className="relative overflow-hidden px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-1.5 group min-w-0 w-full sm:w-auto"
                      aria-label="Upgrade to AI plan"
                    >
                      {/* Glassy Background - Gray Theme */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 via-gray-400/15 to-gray-600/20 backdrop-blur-sm border border-gray-500/30 rounded-md sm:rounded-lg"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md sm:rounded-lg"></div>

                      {/* Content */}
                      <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                        <span className="text-gray-600 group-hover:text-gray-500 transition-colors text-xs font-medium">AI Plan</span>
                      </div>
                    </button>
                  )}

                  {/* Add day button - Glassy Blue */}
                  <button
                    onClick={() => {
                      setCurrentDay(null);
                      setShowDayModal(true);
                    }}
                    className="relative overflow-hidden px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 sm:gap-1.5 group min-w-0 w-full sm:w-auto"
                    aria-label="Add a new day"
                  >
                    {/* Glassy Background - Blue Theme */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-md sm:rounded-lg"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md sm:rounded-lg"></div>

                    {/* Content */}
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
          <div className="space-y-6">
            {itineraryDays.map((day) => (
              <DaySchedule
                key={day.id}
                day={day}
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
            ))}
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
          <LazyItineraryMapView
            days={itineraryDays}
            onViewActivityDetails={handleViewActivityDetails}
            onDeleteActivity={handleDeleteActivity}
            onDeleteMultipleActivities={handleDeleteMultipleActivities}
            onDeleteAllActivities={handleDeleteAllActivities}
              onUpdateCoordinates={(activity, coordinates) => {
                // Aggiorna le coordinate dell'attività nel database
                const updateActivity = async () => {
                  try {
                    // Converti le coordinate nel formato point di PostgreSQL
                    const coordinatesString = `(${coordinates.x},${coordinates.y})`;
                    console.log('Updating coordinates for activity:', activity.id, 'to:', coordinatesString);

                    const { data, error } = await supabase
                      .from('activities')
                      .update({ coordinates: coordinatesString })
                      .eq('id', activity.id)
                      .select();

                    if (error) {
                      console.error('Supabase error updating coordinates:', error);
                      throw error;
                    }

                    console.log('Coordinates updated successfully, response:', data);

                    // Aggiorna lo stato locale
                    setItineraryDays(prevDays => {
                      return prevDays.map(day => {
                        if (day.id === activity.day_id) {
                          return {
                            ...day,
                            activities: day.activities?.map(act => {
                              if (act.id === activity.id) {
                                return {
                                  ...act,
                                  coordinates: coordinatesString
                                };
                              }
                              return act;
                            })
                          };
                        }
                        return day;
                      });
                    });

                    console.log('State updated with new coordinates');
                  } catch (err) {
                    console.error('Error updating coordinates:', err);
                  }
                };

                updateActivity();
              }}
            />
        )}
          </div>
        )}

        {activeTab === 'journal' && hasJournalAccess && (
          <div className="mt-0 w-full">
            {/* Journal Controls - Horizontal Layout */}
            <div className="glass-card rounded-xl p-4 animate-glass-fade-in journal-controls-mobile mb-4" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                    <BookOpenIcon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Travel Journal</h3>
                    <p className="text-sm text-muted-foreground">Capture memories and moments</p>
                  </div>
                </div>

                {/* Navigation Only */}
                <div className="flex justify-center sm:justify-end">
                  <div className="glass-nav rounded-xl p-1 border border-white/20 bg-background/50 backdrop-blur-sm flex">
                    <button
                      onClick={() => setJournalTab('entries')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        journalTab === 'entries'
                          ? 'bg-purple-500/20 text-purple-600 shadow-sm'
                          : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'
                      }`}
                    >
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      Entries
                    </button>
                    <button
                      onClick={() => setJournalTab('gallery')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        journalTab === 'gallery'
                          ? 'bg-purple-500/20 text-purple-600 shadow-sm'
                          : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'
                      }`}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Gallery
                    </button>
                    <button
                      onClick={() => setJournalTab('timeline')}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        journalTab === 'timeline'
                          ? 'bg-purple-500/20 text-purple-600 shadow-sm'
                          : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'
                      }`}
                    >
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Timeline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {journalTab === 'entries' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <BookOpenIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Journal Entries</h3>
                  </div>

                  {/* NEW ENTRY Button - Inside Card */}
                  <button
                    onClick={handleAddEntry}
                    className="relative overflow-hidden px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 group shadow-lg shadow-purple-500/25"
                  >
                    {/* Glassy Background - Purple Theme */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-indigo-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-500 transition-colors" />
                      <span className="text-purple-600 group-hover:text-purple-500 transition-colors text-sm font-medium">
                        New Entry
                      </span>
                    </div>
                  </button>
                </div>

                <div className="space-y-4">
                  {journalLoading && entries.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <div className="p-4 rounded-2xl bg-purple-500/20 backdrop-blur-sm border border-white/20">
                            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                          </div>
                        </div>
                        <p className="text-muted-foreground">Loading your journal entries...</p>
                      </div>
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20">
                            <BookOpenIcon className="h-12 w-12 text-purple-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400/20 rounded-full animate-ping"></div>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-xl font-bold text-foreground">No journal entries yet</h2>
                          <p className="text-muted-foreground max-w-md">
                            Start documenting your travel memories and experiences.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {entries.map((entry, index) => (
                        <div
                          key={entry.id}
                          className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <JournalEntryCard
                            entry={entry}
                            onEdit={handleEditEntry}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {journalTab === 'gallery' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <ImageIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Media Gallery</h3>
                  </div>

                  {/* UPLOAD MEDIA Button - Inside Card */}
                  <button
                    onClick={handleToggleMediaUploader}
                    className="relative overflow-hidden px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 group shadow-lg shadow-purple-500/25"
                  >
                    {/* Glassy Background - Purple Theme */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-indigo-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-500 transition-colors" />
                      <span className="text-purple-600 group-hover:text-purple-500 transition-colors text-sm font-medium">
                        Upload Media
                      </span>
                    </div>
                  </button>
                </div>

                {showMediaUploader && (
                  <div className="mb-4 p-4 rounded-xl bg-background/30 border border-white/10">
                    <SimpleMediaUploader
                      tripId={id as string}
                      onUploadComplete={() => {
                        setShowMediaUploader(false);
                        dispatch(fetchJournalMedia(id as string));
                      }}
                    />
                  </div>
                )}

                <MediaGallery
                  media={media}
                  tripId={id as string}
                />
              </div>
            )}

            {journalTab === 'timeline' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                    <ClockIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Timeline</h3>
                </div>
                <MemoriesTimeline
                  tripId={id as string}
                  onAddEntry={handleAddEntry}
                  onUploadMedia={handleToggleMediaUploader}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals with Suspense */}
      <Suspense fallback={null}>
        {/* Day Modal */}
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

        {/* Activity Modal */}
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

        {/* Move Activity Modal */}
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

        {/* Activity Details Modal */}
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

        {/* Journal Entry Form */}
        {showEntryForm && (
          <JournalEntryForm
            isOpen={showEntryForm}
            onClose={handleCloseForm}
            tripId={id as string}
            entry={currentEntry}
          />
        )}
      </Suspense>

      {/* AI Wizard or Upgrade Prompt */}
      {showWizard && (
        hasAIAccess ? (
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
            onClose={() => setShowWizard(false)}
            onActivitiesGenerated={(activities) => {
              // Aggiorna lo stato con le nuove attività
              setItineraryDays(prevDays => {
                // Crea una copia profonda dell'array dei giorni
                const updatedDays = [...prevDays];

                // Per ogni attività generata, aggiungila al giorno corrispondente
                activities.forEach(activity => {
                  const dayIndex = updatedDays.findIndex(day => day.id === activity.day_id);
                  if (dayIndex !== -1) {
                    // Se il giorno esiste, aggiungi l'attività
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

              // Chiudi il wizard
              setShowWizard(false);
            }}
          />
          </Suspense>
        ) : (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <button
                  onClick={() => setShowWizard(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                <AIUpgradePrompt
                  feature="Itinerary Wizard"
                  description="The AI Itinerary Wizard helps you generate personalized activities for your trip based on your preferences and travel style."
                />
              </div>
            </div>
          </div>
        )
      )}

      {/* Journal Info Modal for Free Users */}
      <Suspense fallback={null}>
        {showJournalInfoModal && (
          <JournalInfoModal
            isOpen={showJournalInfoModal}
            onClose={() => setShowJournalInfoModal(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
