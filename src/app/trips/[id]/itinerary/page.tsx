'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { CalendarIcon, BookOpenIcon, ImageIcon, ClockIcon, BookIcon, PlusIcon, ListIcon } from 'lucide-react';
import { it } from 'date-fns/locale';
import DaySchedule from '@/components/itinerary/DaySchedule';
import ItinerarySkeleton from '@/components/itinerary/ItinerarySkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  const dispatch = useDispatch<AppDispatch>();
  const { entries, media, loading: journalLoading } = useSelector((state: RootState) => state.journal);

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Journal states
  const [activeTab, setActiveTab] = useState('itinerary');
  const [journalTab, setJournalTab] = useState('entries');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);

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
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (!isValid(start) || !isValid(end)) {
        throw new Error('Invalid date format');
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
      };

      if (currentActivity) {
        // Update existing activity
        const { data, error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', currentActivity.id)
          .select();

        if (error) throw error;

        // Update the activity in the state
        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: day.activities?.map(activity =>
                activity.id === currentActivity.id ? data[0] : activity
              ) || [],
            };
          }
          return day;
        }));
      } else {
        // Create new activity
        const { data, error } = await supabase
          .from('activities')
          .insert([activityData])
          .select();

        if (error) throw error;

        // Add the new activity to the state
        setItineraryDays(itineraryDays.map(day => {
          if (day.id === currentDayId) {
            return {
              ...day,
              activities: [...(day.activities || []), data[0]].sort((a, b) =>
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
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />
        </div>

        <div className="max-w-7xl mx-auto py-2 pb-3 px-3 sm:py-3 sm:pb-4 sm:px-6 lg:px-8">
          {/* Header mobile-first */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="overflow-hidden">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate flex items-center">
                <div className="relative">
                  <CalendarIcon className="h-6 w-6 mr-2" />
                  <BookOpenIcon className="h-3 w-3 absolute -bottom-1 -right-1 bg-card rounded-full p-0.5" />
                </div>
                Trip Planner
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {trip.name} {trip.destination && `• ${trip.destination}`}
              </p>
            </div>

            {/* No controls here anymore */}
            <div></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 sm:mb-6 text-sm sm:text-base rounded-r-md">
            <p>{error}</p>
          </div>
        )}

        <div className="w-full mb-8">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-start gap-4 sm:gap-6">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`group relative px-5 py-4 sm:px-8 sm:py-5 rounded-xl flex items-center gap-4 transition-all duration-300 border-2 ${
                activeTab === 'itinerary'
                  ? 'bg-primary/10 text-primary border-primary shadow-md transform scale-105'
                  : 'bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground border-transparent hover:border-muted'
              }`}
            >
              <div className={`p-3 rounded-full ${
                activeTab === 'itinerary'
                  ? 'bg-primary/20'
                  : 'bg-muted group-hover:bg-muted/80'
              } transition-colors duration-300`}>
                <CalendarIcon className={`h-6 w-6 ${
                  activeTab === 'itinerary' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg">Itinerary</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Plan your daily activities</span>
              </div>
              {activeTab === 'itinerary' && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-primary rounded-l-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className={`group relative px-5 py-4 sm:px-8 sm:py-5 rounded-xl flex items-center gap-4 transition-all duration-300 border-2 ${
                activeTab === 'journal'
                  ? 'bg-primary/10 text-primary border-primary shadow-md transform scale-105'
                  : 'bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground border-transparent hover:border-muted'
              }`}
            >
              <div className={`p-3 rounded-full ${
                activeTab === 'journal'
                  ? 'bg-primary/20'
                  : 'bg-muted group-hover:bg-muted/80'
              } transition-colors duration-300`}>
                <BookOpenIcon className={`h-6 w-6 ${
                  activeTab === 'journal' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg">Journal</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Keep a diary and photos</span>
              </div>
              {activeTab === 'journal' && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-8 bg-primary rounded-l-full"></div>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'itinerary' && (
          <div className="mt-0">
            {/* Itinerary Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Itinerary View</h3>
                  <p className="text-xs text-muted-foreground">Choose how to display your schedule</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center bg-muted/50 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                      viewMode === 'list'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    aria-label="List view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1 ${
                      viewMode === 'calendar'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    aria-label="Calendar view"
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Calendar</span>
                  </button>
                </div>

                {/* Add day button */}
                <button
                  onClick={() => {
                    setCurrentDay(null);
                    setShowDayModal(true);
                  }}
                  className="bg-primary py-1.5 px-4 rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-200 flex items-center gap-1"
                  aria-label="Add a new day"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Day</span>
                </button>
              </div>
            </div>

          {itineraryDays.length === 0 ? (
          <div className="bg-card shadow rounded-lg p-4 sm:p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Nessun giorno nell'itinerario</h2>
            <p className="text-muted-foreground mb-6">
              Inizia a pianificare il tuo viaggio aggiungendo giorni al tuo itinerario.
            </p>
            <button
              onClick={() => {
                setCurrentDay(null);
                setShowDayModal(true);
              }}
              className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Aggiungi il tuo primo giorno
            </button>
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
                onMoveActivity={handleMoveActivity}
                onViewActivityDetails={handleViewActivityDetails}
              />
            ))}
          </div>
        ) : (
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
              onMoveActivity={handleMoveActivity}
              onViewActivityDetails={handleViewActivityDetails}
            />
          </Suspense>
        )}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="mt-0 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex bg-muted/30 p-1 rounded-lg shadow-sm">
                <button
                  onClick={() => setJournalTab('entries')}
                  className={`px-3 py-2 text-sm font-medium flex items-center gap-1 rounded-md transition-all duration-200 ${
                    journalTab === 'entries'
                      ? 'bg-card shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <BookOpenIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Entries</span>
                </button>
                <button
                  onClick={() => setJournalTab('gallery')}
                  className={`px-3 py-2 text-sm font-medium flex items-center gap-1 rounded-md transition-all duration-200 ${
                    journalTab === 'gallery'
                      ? 'bg-card shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Gallery</span>
                </button>
                <button
                  onClick={() => setJournalTab('timeline')}
                  className={`px-3 py-2 text-sm font-medium flex items-center gap-1 rounded-md transition-all duration-200 ${
                    journalTab === 'timeline'
                      ? 'bg-card shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </button>
              </div>

              <div>
                {journalTab === 'entries' && (
                  <Button onClick={handleAddEntry} className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">New Entry</span>
                    <span className="sm:hidden">Entry</span>
                  </Button>
                )}
                {journalTab === 'gallery' && (
                  <Button onClick={handleToggleMediaUploader} className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors">
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload Media</span>
                    <span className="sm:hidden">Upload</span>
                  </Button>
                )}
              </div>
            </div>

            {journalTab === 'entries' && (
              <div className="space-y-6">
                {journalLoading && entries.length === 0 ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      You haven't created any journal entries for this trip yet.
                    </p>
                    <Button onClick={handleAddEntry}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create your first entry
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {entries.map((entry) => (
                      <JournalEntryCard
                        key={entry.id}
                        entry={entry}
                        onEdit={handleEditEntry}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {journalTab === 'gallery' && (
              <div>
                {showMediaUploader && (
                  <div className="mb-6">
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
              <MemoriesTimeline tripId={id as string} />
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
    </div>
  );
}
