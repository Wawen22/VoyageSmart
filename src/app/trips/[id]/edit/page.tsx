'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DestinationSelector from '@/components/destination/DestinationSelector';
import { TripDestinations } from '@/lib/types/destination';

type TripFormData = {
  name: string;
  description: string;
  destination: string; // For backward compatibility
  destinations: TripDestinations;
  startDate: string;
  endDate: string;
  isPrivate: boolean;
  budgetTotal: string;
  currency: string;
  tripType: string;
  accommodation: string;
  notes: string;
};

export default function EditTrip() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [formData, setFormData] = useState<TripFormData>({
    name: '',
    description: '',
    destination: '',
    destinations: { destinations: [], primary: undefined },
    startDate: '',
    endDate: '',
    isPrivate: true,
    budgetTotal: '',
    currency: 'USD',
    tripType: 'vacation',
    accommodation: '',
    notes: '',
  });

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

        // Check if user is the owner
        const isOwner = tripData.owner_id === user.id;
        setIsOwner(isOwner);

        if (!isOwner) {
          setError('You do not have permission to edit this trip');
          return;
        }

        // Get destinations from preferences or create from destination string
        let destinations: TripDestinations = { destinations: [], primary: undefined };

        if (tripData.preferences?.destinations) {
          // Use stored destinations if available
          destinations = tripData.preferences.destinations as TripDestinations;
        } else if (tripData.destination) {
          // Create a destination from the legacy destination field
          const uuid = crypto.randomUUID();
          destinations = {
            destinations: [
              {
                id: uuid,
                name: tripData.destination,
                coordinates: { lat: 0, lng: 0 } // Default coordinates
              }
            ],
            primary: uuid
          };
        }

        // Format the data for the form
        setFormData({
          name: tripData.name || '',
          description: tripData.description || '',
          destination: tripData.destination || '',
          destinations: destinations,
          startDate: tripData.start_date || '',
          endDate: tripData.end_date || '',
          isPrivate: tripData.is_private,
          budgetTotal: tripData.budget_total ? String(tripData.budget_total) : '',
          currency: tripData.preferences?.currency || 'USD',
          tripType: tripData.preferences?.trip_type || 'vacation',
          accommodation: tripData.preferences?.accommodation || '',
          notes: tripData.preferences?.notes || '',
        });
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle destinations change from the DestinationSelector component
  const handleDestinationsChange = (destinations: TripDestinations) => {
    setFormData({
      ...formData,
      destinations,
    });
  };

  // Function to update itinerary days based on trip dates
  const updateItineraryDays = async (startDate: string, endDate: string) => {
    try {
      // First, get existing days
      const { data: existingDays, error: fetchError } = await supabase
        .from('itinerary_days')
        .select('id, day_date')
        .eq('trip_id', id);

      if (fetchError) throw fetchError;

      // Create a set of existing dates for quick lookup
      const existingDatesMap = new Map();
      existingDays?.forEach(day => {
        existingDatesMap.set(day.day_date, day.id);
      });

      // Generate all dates between start and end
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allDates = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const formattedDate = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        allDates.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Find dates to add (in allDates but not in existingDatesMap)
      const datesToAdd = allDates.filter(date => !existingDatesMap.has(date));

      // Add new days
      if (datesToAdd.length > 0) {
        const newDays = datesToAdd.map(date => ({
          trip_id: id,
          day_date: date,
          notes: null,
        }));

        const { error: insertError } = await supabase
          .from('itinerary_days')
          .insert(newDays);

        if (insertError) throw insertError;
      }

      // Find days to delete (in existingDatesMap but not in allDates)
      const daysToDelete = [];
      existingDatesMap.forEach((dayId, date) => {
        if (!allDates.includes(date)) {
          daysToDelete.push(dayId);
        }
      });

      // Delete days outside the date range
      if (daysToDelete.length > 0) {
        // First check if these days have activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id, day_id, name')
          .in('day_id', daysToDelete);

        if (activitiesError) throw activitiesError;

        // If there are activities on these days, ask for confirmation
        if (activitiesData && activitiesData.length > 0) {
          // Group activities by day for better user information
          const activitiesByDay = {};
          activitiesData.forEach(activity => {
            if (!activitiesByDay[activity.day_id]) {
              activitiesByDay[activity.day_id] = [];
            }
            activitiesByDay[activity.day_id].push(activity.name);
          });

          // Create a message showing which days and activities will be deleted
          let confirmMessage = 'Le seguenti attività verranno eliminate perché i giorni non rientrano più nell\'intervallo di date del viaggio:\n\n';

          // Get day dates for better display
          const dayIdsToLookup = Object.keys(activitiesByDay);
          const { data: daysData } = await supabase
            .from('itinerary_days')
            .select('id, day_date')
            .in('id', dayIdsToLookup);

          const daysMap = {};
          if (daysData) {
            daysData.forEach(day => {
              daysMap[day.id] = day.day_date;
            });
          }

          // Build the confirmation message
          Object.keys(activitiesByDay).forEach(dayId => {
            const dayDate = daysMap[dayId] || 'Data sconosciuta';
            confirmMessage += `${dayDate}:\n`;
            activitiesByDay[dayId].forEach(activityName => {
              confirmMessage += `- ${activityName}\n`;
            });
            confirmMessage += '\n';
          });

          confirmMessage += 'Sei sicuro di voler procedere con l\'eliminazione?';

          // Ask for confirmation
          const userConfirmed = confirm(confirmMessage);

          if (!userConfirmed) {
            // User canceled, don't delete anything
            return;
          }

          // User confirmed, proceed with deletion
          const activityIds = activitiesData.map(activity => activity.id);
          const { error: deleteActivitiesError } = await supabase
            .from('activities')
            .delete()
            .in('id', activityIds);

          if (deleteActivitiesError) throw deleteActivitiesError;
        }

        // Now delete the days
        const { error: deleteError } = await supabase
          .from('itinerary_days')
          .delete()
          .in('id', daysToDelete);

        if (deleteError) throw deleteError;
      }
    } catch (err) {
      console.error('Error updating itinerary days:', err);
      // We don't set an error here to avoid blocking the trip update
      // The user can still manually add days in the itinerary page
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to update a trip');
      return;
    }

    if (!isOwner) {
      setError('You do not have permission to edit this trip');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Validate dates
      if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('End date cannot be before start date');
        return;
      }

      // Get primary destination name for backward compatibility
      const primaryDestination = formData.destinations.primary
        ? formData.destinations.destinations.find(d => d.id === formData.destinations.primary)?.name
        : formData.destinations.destinations.length > 0
          ? formData.destinations.destinations[0].name
          : null;

      // Update the trip
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          name: formData.name,
          description: formData.description || null,
          destination: primaryDestination, // For backward compatibility
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          is_private: formData.isPrivate,
          budget_total: formData.budgetTotal ? parseFloat(formData.budgetTotal) : null,
          preferences: {
            currency: formData.currency,
            trip_type: formData.tripType,
            accommodation: formData.accommodation,
            notes: formData.notes,
            destinations: formData.destinations // Store full destinations data in preferences
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating trip:', updateError);
        throw updateError;
      }

      // If dates have changed, update the itinerary days
      if (formData.startDate && formData.endDate) {
        await updateItineraryDays(formData.startDate, formData.endDate);
      }

      setSuccess('Trip updated successfully!');

      // Redirect to the trip page after a short delay
      setTimeout(() => {
        router.push(`/trips/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating trip:', err);
      setError('Failed to update trip. Please try again.');
    } finally {
      setSaving(false);
    }
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

  if (error && !isOwner) {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />

          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {deleting ? 'Deleting...' : 'Delete Trip'}
          </button>
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Edit Trip</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary mb-6">
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Trip Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  placeholder="Summer Vacation 2025"
                />
              </div>

              <div>
                <DestinationSelector
                  value={formData.destinations}
                  onChange={handleDestinationsChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="budgetTotal" className="block text-sm font-medium text-foreground">
                    Budget
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="budgetTotal"
                      id="budgetTotal"
                      value={formData.budgetTotal}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="flex-1 block w-full border border-input bg-background text-foreground rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                      placeholder="1000"
                    />
                    <select
                      name="currency"
                      id="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="inline-flex items-center px-3 border border-l-0 border-input bg-secondary text-foreground rounded-r-md shadow-sm text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="tripType" className="block text-sm font-medium text-foreground">
                    Trip Type
                  </label>
                  <select
                    name="tripType"
                    id="tripType"
                    value={formData.tripType}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  >
                    <option value="vacation">Vacation</option>
                    <option value="business">Business</option>
                    <option value="weekend">Weekend Getaway</option>
                    <option value="roadtrip">Road Trip</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="accommodation" className="block text-sm font-medium text-foreground">
                  Accommodation Preferences
                </label>
                <input
                  type="text"
                  name="accommodation"
                  id="accommodation"
                  value={formData.accommodation}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  placeholder="Hotel, Airbnb, etc."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  placeholder="Describe your trip..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  placeholder="Any additional notes..."
                ></textarea>
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 block text-sm text-foreground">
                    Make this trip private
                  </label>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Private trips are only visible to you and people you invite
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-destructive py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-destructive-foreground hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50 transition-colors"
                >
                  Delete Trip
                </button>
                <div className="flex space-x-3">
                  <Link
                    href={`/trips/${id}`}
                    className="bg-secondary py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
