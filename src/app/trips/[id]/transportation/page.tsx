'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchTransportations, Transportation, setCurrentTransportation } from '@/lib/features/transportationSlice';
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
  PlaneTakeoffIcon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  ListIcon,
  MapIcon,
  CarIcon,
  TrainIcon,
  ShipIcon,
  BusIcon,
  AlertTriangleIcon
} from 'lucide-react';
import TransportationCard from '@/components/transportation/TransportationCard';
import TransportationSkeleton from '@/components/transportation/TransportationSkeleton';
import TransportationModal from '@/components/transportation/TransportationModal';
import TransportationDetailsModal from '@/components/transportation/TransportationDetailsModal';
import { LazyTransportationMap } from '@/components/LazyComponents';

type Trip = {
  id: string;
  name: string;
  destination: string | null;
  owner_id?: string;
};

export default function TransportationPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { canAccessFeature, canAddTransportation: canAddTransportationToTrip, subscription } = useSubscription();
  const { transportations, loading, error, currentTransportation } = useSelector(
    (state: RootState) => state.transportation
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
    const checkTransportationLimit = async () => {
      if (user && id) {
        const canAdd = await canAddTransportationToTrip(id as string);
        setCanAddMore(canAdd);
      }
    };
    
    checkTransportationLimit();
  }, [user, id, canAddTransportationToTrip, transportations]);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        if (!user) return;

        const cacheKey = `trip_details_${id}`;
        const cachedData = sessionStorage.getItem(cacheKey);
        
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp;
            const now = Date.now();

            if (now - cacheTime < 5 * 60 * 1000) {
              setTrip(parsed.trip);
              setIsParticipant(parsed.isParticipant);
              dispatch(fetchTransportations(id as string));
              return;
            }
          } catch (e) {
            console.error('Error parsing cached trip data:', e);
          }
        }

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

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            trip: tripData,
            isParticipant: isUserParticipant
          }));
        } catch (e) {
          console.error('Error caching trip data:', e);
        }

        dispatch(fetchTransportations(id as string));
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

  const handleAddTransportation = () => {
    dispatch(setCurrentTransportation(null));
    setIsAddModalOpen(true);
  };

  const handleEditTransportation = (transportation: Transportation) => {
    dispatch(setCurrentTransportation(transportation));
    setIsEditModalOpen(true);
  };

  const handleViewTransportation = (transportation: Transportation) => {
    dispatch(setCurrentTransportation(transportation));
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

  const getTransportationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'flight':
        return <PlaneTakeoffIcon className="h-4 w-4 text-primary" />;
      case 'train':
        return <TrainIcon className="h-4 w-4 text-primary" />;
      case 'car':
        return <CarIcon className="h-4 w-4 text-primary" />;
      case 'bus':
        return <BusIcon className="h-4 w-4 text-primary" />;
      case 'ferry':
      case 'boat':
        return <ShipIcon className="h-4 w-4 text-primary" />;
      default:
        return <PlaneTakeoffIcon className="h-4 w-4 text-primary" />;
    }
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border mb-6">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <PlaneTakeoffIcon className="h-6 w-6 mr-2" />
              Transportation
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
        {subscription?.tier === 'free' && transportations.length >= 4 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {transportations.length >= 5
                  ? "You've reached the free plan limit of 5 transportation items per trip. Upgrade to Premium for unlimited transportation."
                  : `You're approaching the free plan limit (${transportations.length}/5 transportation items). Upgrade to Premium for unlimited transportation.`
                }
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {canEdit && (
            <Button 
              onClick={handleAddTransportation}
              disabled={!canAddMore}
              className={!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transportation
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

          <TabsContent value="list" className="mt-0">
            {loading && transportations.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <TransportationSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive mb-4">Error loading transportations: {error}</p>
                <Button onClick={() => dispatch(fetchTransportations(id as string))}>
                  Try Again
                </Button>
              </div>
            ) : transportations.length === 0 ? (
              <div className="text-center py-12">
                <PlaneTakeoffIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No transportation yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your flights, trains, and other transportation to keep track of your journey.
                </p>
                {canEdit && (
                  <Button onClick={handleAddTransportation} disabled={!canAddMore}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Transportation
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transportations.map((transportation) => (
                  <TransportationCard
                    key={transportation.id}
                    transportation={transportation}
                    onEdit={canEdit ? handleEditTransportation : undefined}
                    onView={handleViewTransportation}
                    canEdit={canEdit}
                    getIcon={getTransportationIcon}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
              <LazyTransportationMap
                transportations={transportations}
                onTransportationClick={handleViewTransportation}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <Suspense fallback={null}>
        {/* Add Transportation Modal */}
        {isAddModalOpen && (
          <TransportationModal
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
            tripId={id as string}
          />
        )}

        {/* Edit Transportation Modal */}
        {isEditModalOpen && currentTransportation && (
          <TransportationModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            tripId={id as string}
            transportation={currentTransportation}
          />
        )}

        {/* Transportation Details Modal */}
        {isDetailsModalOpen && currentTransportation && (
          <TransportationDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            transportation={currentTransportation}
            onEdit={canEdit ? handleEditFromDetails : undefined}
            getIcon={getTransportationIcon}
          />
        )}
      </Suspense>
    </div>
  );
}
