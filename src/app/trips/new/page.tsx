'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import TripLimitPrompt from '@/components/subscription/TripLimitPrompt';
import DestinationSelector from '@/components/destination/DestinationSelector';
import { TripDestinations } from '@/lib/types/destination';

export default function NewTrip() {
  const { user } = useAuth();
  const { canCreateTrip } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destinations: { destinations: [], primary: undefined } as TripDestinations,
    startDate: '',
    endDate: '',
    isPrivate: true,
    budgetTotal: '',
    currency: 'USD',
    tripType: 'vacation', // vacation, business, weekend, roadtrip
    accommodation: '',
    notes: '',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkTripLimit = async () => {
      if (user) {
        const canCreate = await canCreateTrip();
        setCanCreate(canCreate);
      }
    };

    checkTripLimit();
  }, [user, canCreateTrip]);

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

  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name) {
        setError('Trip name is required');
        return;
      }
    }

    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a trip');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Validate dates
      if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        setError('End date cannot be before start date');
        return;
      }

      console.log('Creating trip with data:', formData);

      // Get primary destination name for backward compatibility
      const primaryDestination = formData.destinations.primary
        ? formData.destinations.destinations.find(d => d.id === formData.destinations.primary)?.name
        : formData.destinations.destinations.length > 0
          ? formData.destinations.destinations[0].name
          : null;

      // Create the trip
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert([
          {
            name: formData.name,
            description: formData.description || null,
            destination: primaryDestination, // For backward compatibility
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            is_private: formData.isPrivate,
            budget_total: formData.budgetTotal ? parseFloat(formData.budgetTotal) : null,
            owner_id: user.id,
            preferences: {
              currency: formData.currency,
              trip_type: formData.tripType,
              accommodation: formData.accommodation,
              notes: formData.notes,
              destinations: formData.destinations // Store full destinations data in preferences
            }
          },
        ])
        .select();

      if (insertError) {
        console.error('Error inserting trip:', insertError);
        throw insertError;
      }

      if (data && data[0]) {
        console.log('Trip created successfully:', data[0]);

        // Add the owner as a participant with admin role
        const { error: participantError } = await supabase
          .from('trip_participants')
          .insert([
            {
              trip_id: data[0].id,
              user_id: user.id,
              role: 'admin',
              invitation_status: 'accepted',
            },
          ]);

        if (participantError) {
          console.error('Error adding participant:', participantError);
          throw participantError;
        }

        setSuccess('Trip created successfully!');

        // Redirect to the trip page after a short delay
        setTimeout(() => {
          router.push(`/trips/${data[0].id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setError('Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking if user can create a trip
  if (canCreate === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If user has reached the trip limit, show the upgrade prompt
  if (canCreate === false) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
            <BackButton href="/dashboard" label="Back to Dashboard" />
          </div>

          <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Create New Trip</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <TripLimitPrompt />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href="/dashboard" label="Back to Dashboard" />
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Create New Trip</h1>
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

            <div className="mb-8">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-foreground">
                  {currentStep === 1 ? 'Basic Information' :
                   currentStep === 2 ? 'Dates and Budget' : 'Additional Details'}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of 3
                </div>
              </div>
              <div className="mt-4 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-secondary">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-primary-foreground justify-center bg-primary"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
              {currentStep === 1 && (
                <>
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
                      <option value="other">Other</option>
                    </select>
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
                      placeholder="A brief description of your trip"
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
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
                      <input
                        type="number"
                        name="budgetTotal"
                        id="budgetTotal"
                        min="0"
                        step="0.01"
                        value={formData.budgetTotal}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                        placeholder="1000.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-foreground">
                        Currency
                      </label>
                      <select
                        name="currency"
                        id="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="accommodation" className="block text-sm font-medium text-foreground">
                      Accommodation
                    </label>
                    <input
                      type="text"
                      name="accommodation"
                      id="accommodation"
                      value={formData.accommodation}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                      placeholder="Hotel name or type of accommodation"
                    />
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
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
                      placeholder="Any additional notes or information about your trip"
                    />
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="isPrivate"
                        name="isPrivate"
                        type="checkbox"
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        className="focus:ring-2 focus:ring-primary h-4 w-4 text-primary border-input rounded bg-background"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="isPrivate" className="font-medium text-foreground">
                        Private Trip
                      </label>
                      <p className="text-muted-foreground">
                        Only invited participants can view this trip
                      </p>
                    </div>
                  </div>

                  <div className="bg-secondary/50 p-4 rounded-md border border-border">
                    <h3 className="text-lg font-medium text-foreground mb-2">Trip Summary</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Trip Name</dt>
                        <dd className="text-sm text-foreground">{formData.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Destination</dt>
                        <dd className="text-sm text-foreground">{formData.destination || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Dates</dt>
                        <dd className="text-sm text-foreground">
                          {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not set'} -
                          {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not set'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Budget</dt>
                        <dd className="text-sm text-foreground">
                          {formData.budgetTotal ? `${formData.budgetTotal} ${formData.currency}` : 'Not set'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="bg-secondary py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/dashboard"
                    className="bg-secondary py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : currentStep < 3 ? 'Next' : 'Create Trip'}
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
