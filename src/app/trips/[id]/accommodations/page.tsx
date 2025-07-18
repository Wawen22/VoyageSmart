'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAccommodations, Accommodation, setCurrentAccommodation } from '@/lib/features/accommodationSlice';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { format, parseISO } from 'date-fns';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Building2Icon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  ListIcon,
  MapIcon,
  AlertTriangleIcon
} from 'lucide-react';
import AccommodationCard from '@/components/accommodations/AccommodationCard';
import AccommodationSkeleton from '@/components/accommodations/AccommodationSkeleton';
import AccommodationModal from '@/components/accommodations/AccommodationModal';
import AccommodationDetailsModal from '@/components/accommodations/AccommodationDetailsModal';
import { LazyMapView, LazyAccommodationsMapView } from '@/components/LazyComponents';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  owner_id?: string;
};

export default function AccommodationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { canAccessFeature, canAddAccommodation: canAddAccommodationToTrip, subscription } = useSubscription();
  const { accommodations, loading, error, currentAccommodation } = useSelector(
    (state: RootState) => state.accommodations
  );

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { canEdit } = useRolePermissions(id as string);
  const [canAddMore, setCanAddMore] = useState(true);

  useEffect(() => {
    const checkAccommodationLimit = async () => {
      if (user && id) {
        const canAdd = await canAddAccommodationToTrip(id as string);
        setCanAddMore(canAdd);
      }
    };

    checkAccommodationLimit();
  }, [user, id, canAddAccommodationToTrip, accommodations]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        if (!user) return;

        // Create a cache key for this trip
        const cacheKey = `trip_details_${id}`;

        // Check if we have cached data
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp;
            const now = Date.now();

            // Use cache if it's less than 5 minutes old
            if (now - cacheTime < 5 * 60 * 1000) {
              console.log('[Accommodations] Using cached trip data');
              setTrip(parsed.trip);
              setIsParticipant(parsed.isParticipant);

              // Fetch accommodations (this will use its own cache)
              dispatch(fetchAccommodations(id as string));
              return;
            }
          } catch (e) {
            console.error('Error parsing cached trip data:', e);
            // Continue with normal fetch if cache parsing fails
          }
        }

        console.log('[Accommodations] Fetching fresh trip data');

        // Fetch trip details and participant status in parallel
        const [tripResponse, participantResponse] = await Promise.all([
          supabase
            .from('trips')
            .select('id, name, destination, owner_id')
            .eq('id', id)
            .single(),
          supabase
            .from('trip_participants')
            .select('id')
            .eq('trip_id', id)
            .eq('user_id', user.id)
            .eq('invitation_status', 'accepted')
            .maybeSingle()
        ]);

        if (tripResponse.error) throw tripResponse.error;
        const tripData = tripResponse.data;
        setTrip(tripData);

        if (participantResponse.error) throw participantResponse.error;
        const isUserParticipant = !!participantResponse.data || tripData.owner_id === user.id;
        setIsParticipant(isUserParticipant);

        // Cache the trip data
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            trip: tripData,
            isParticipant: isUserParticipant
          }));
        } catch (e) {
          console.error('Error caching trip data:', e);
          // Continue even if caching fails
        }

        // Fetch accommodations
        dispatch(fetchAccommodations(id as string));
      } catch (error) {
        console.error('Error fetching trip details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load trip details. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchTripDetails();
  }, [id, user, dispatch]);

  const handleAddAccommodation = () => {
    dispatch(setCurrentAccommodation(null));
    setIsAddModalOpen(true);
  };

  const handleEditAccommodation = (accommodation: Accommodation) => {
    dispatch(setCurrentAccommodation(accommodation));
    setIsEditModalOpen(true);
  };

  const handleViewAccommodation = (accommodation: Accommodation) => {
    dispatch(setCurrentAccommodation(accommodation));
    setIsDetailsModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
  };

  const handleEditFromDetails = () => {
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading trip details...</p>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="container mx-auto py-8">
        <p>You do not have access to this trip.</p>
      </div>
    );
  }

  // Accommodations are now free for all users - no access check needed

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border mb-6">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <Building2Icon className="h-6 w-6 mr-2" />
              Accommodations
            </h1>

            {trip && (
              <p className="text-sm text-muted-foreground">
                {trip.name} {trip.destination && `• ${trip.destination}`}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Free plan limitation warning */}
        {subscription?.tier === 'free' && accommodations.length >= 4 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {accommodations.length >= 5
                  ? "You've reached the free plan limit of 5 accommodations per trip. Upgrade to Premium for unlimited accommodations."
                  : `You're approaching the free plan limit (${accommodations.length}/5 accommodations). Upgrade to Premium for unlimited accommodations.`
                }
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {canEdit && (
            <Button
              onClick={handleAddAccommodation}
              disabled={!canAddMore}
              className={!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Accommodation
              {!canAddMore && subscription?.tier === 'free' && (
                <span className="ml-2 text-xs">(Limit reached)</span>
              )}
            </Button>
          )}
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'map')} className="mb-6">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="list" className="flex items-center">
              <ListIcon className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center">
              <MapIcon className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <AccommodationSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => dispatch(fetchAccommodations(id as string))}
            >
              Try Again
            </Button>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="text-center py-12">
            <Building2Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No accommodations yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first accommodation to keep track of your stays during this trip.
            </p>
            {canEdit && (
              <Button onClick={handleAddAccommodation}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Accommodation
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accommodations.map((accommodation) => (
                  <AccommodationCard
                    key={accommodation.id}
                    accommodation={accommodation}
                    onView={handleViewAccommodation}
                    onEdit={handleEditAccommodation}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}

            {viewMode === 'map' && (
              <Card>
                <CardContent className="p-4">
                  <div className="h-[500px] relative">
                    <LazyAccommodationsMapView
                      accommodations={accommodations}
                      height="500px"
                      onMarkerClick={handleViewAccommodation}
                    />

                    <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-4 rounded-md shadow max-h-[450px] overflow-y-auto w-72">
                      <h3 className="font-medium mb-3">Accommodations</h3>
                      <div className="space-y-2">
                        {accommodations.map((accommodation) => (
                          <div
                            key={accommodation.id}
                            className="p-2 border rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => handleViewAccommodation(accommodation)}
                          >
                            <p className="font-medium text-sm">{accommodation.name}</p>
                            {accommodation.check_in_date && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {format(parseISO(accommodation.check_in_date), 'MMM d, yyyy')}
                              </div>
                            )}
                            {accommodation.address && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{accommodation.address}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <AccommodationModal
        tripId={id as string}
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
      />

      <AccommodationModal
        tripId={id as string}
        accommodation={currentAccommodation}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />

      <AccommodationDetailsModal
        accommodation={currentAccommodation}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        onEdit={handleEditFromDetails}
        canEdit={canEdit}
      />
    </div>
  );
}
