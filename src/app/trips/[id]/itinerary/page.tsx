'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import DaySchedule from '@/components/itinerary/DaySchedule';
import ActivityModal from '@/components/itinerary/ActivityModal';
import DayModal from '@/components/itinerary/DayModal';
import MoveActivityModal from '@/components/itinerary/MoveActivityModal';
import CalendarView from '@/components/itinerary/CalendarView';
import ActivityDetailsModal from '@/components/activity/ActivityDetailsModal';

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

  useEffect(() => {
    const fetchTripAndItinerary = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, name, start_date, end_date, destination')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;

        setTrip(tripData);

        // Check if user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('trip_participants')
          .select('id')
          .eq('trip_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (participantError) throw participantError;

        const isUserParticipant = !!participantData || tripData.owner_id === user.id;
        setIsParticipant(isUserParticipant);

        if (!isUserParticipant) {
          setError('You do not have permission to view this trip\'s itinerary');
          return;
        }

        // Fetch itinerary days
        const { data: daysData, error: daysError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (daysError) throw daysError;

        // Fetch activities for each day
        const daysWithActivities = await Promise.all(
          daysData.map(async (day) => {
            const { data: activitiesData, error: activitiesError } = await supabase
              .from('activities')
              .select('*')
              .eq('day_id', day.id)
              .order('start_time', { ascending: true });

            if (activitiesError) throw activitiesError;

            return {
              ...day,
              activities: activitiesData || [],
            };
          })
        );

        setItineraryDays(daysWithActivities);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading itinerary...</p>
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{trip.name}</h1>
              {trip.destination && (
                <p className="text-sm text-muted-foreground truncate">{trip.destination}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* View toggle */}
              <div className="flex items-center bg-secondary rounded-md p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                  aria-label="List view"
                >
                  <span className="hidden xs:inline">Lista</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:hidden" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-2 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
                  aria-label="Calendar view"
                >
                  <span className="hidden xs:inline">Calendario</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:hidden" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {/* Add day button */}
              <button
                onClick={() => {
                  setCurrentDay(null);
                  setShowDayModal(true);
                }}
                className="bg-primary py-1 px-2 sm:py-2 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center"
                aria-label="Add a new day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add Day</span>
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

        {itineraryDays.length === 0 ? (
          <div className="bg-card shadow rounded-lg p-4 sm:p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">No itinerary days yet</h2>
            <p className="text-muted-foreground mb-6">
              Start planning your trip by adding days to your itinerary.
            </p>
            <button
              onClick={() => {
                setCurrentDay(null);
                setShowDayModal(true);
              }}
              className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Add Your First Day
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
        )}
      </main>

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
    </div>
  );
}
