'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchTransportations, Transportation, setCurrentTransportation } from '@/lib/features/transportationSlice';
import { useAuth } from '@/lib/auth';
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
  TrainIcon,
  BusIcon,
  CarIcon,
  ShipIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import TransportationCard from '@/components/transportation/TransportationCard';
import TransportationModal from '@/components/transportation/TransportationModal';
import TransportationDetailsModal from '@/components/transportation/TransportationDetailsModal';
import TransportationMap from '@/components/transportation/TransportationMap';

type Trip = {
  id: string;
  name: string;
  destination: string | null;
};

export default function TransportationPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, name, destination')
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
          .eq('invitation_status', 'accepted')
          .maybeSingle();

        if (participantError) throw participantError;
        setIsParticipant(!!participantData || tripData.owner_id === user.id);

        // Fetch transportations
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
    switch (type) {
      case 'flight':
        return <PlaneTakeoffIcon className="h-5 w-5 text-primary" />;
      case 'train':
        return <TrainIcon className="h-5 w-5 text-primary" />;
      case 'bus':
        return <BusIcon className="h-5 w-5 text-primary" />;
      case 'car':
        return <CarIcon className="h-5 w-5 text-primary" />;
      case 'ferry':
        return <ShipIcon className="h-5 w-5 text-primary" />;
      default:
        return <MoreHorizontalIcon className="h-5 w-5 text-primary" />;
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
      {/* Header */}
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {canEdit && (
            <Button onClick={handleAddTransportation}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transportation
            </Button>
          )}
        </div>

        {/* View Mode Tabs */}
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

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <p>Loading transportation...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => dispatch(fetchTransportations(id as string))}
            >
              Try Again
            </Button>
          </div>
        ) : transportations.length === 0 ? (
          <div className="text-center py-12">
            <PlaneTakeoffIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No transportation yet</h3>
            <p className="text-muted-foreground mb-6">
              Add your first transportation to keep track of your travels during this trip.
            </p>
            {canEdit && (
              <Button onClick={handleAddTransportation}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Transportation
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {transportations.map((transportation) => (
                  <TransportationCard
                    key={transportation.id}
                    transportation={transportation}
                    onView={handleViewTransportation}
                    onEdit={handleEditTransportation}
                    canEdit={canEdit}
                    getIcon={getTransportationIcon}
                  />
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <Card>
                <CardContent className="p-4">
                  <div className="h-[500px] relative">
                    <TransportationMap
                      transportations={transportations}
                      height="500px"
                      onMarkerClick={handleViewTransportation}
                    />

                    {/* Transportation list */}
                    <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-4 rounded-md shadow max-h-[450px] overflow-y-auto w-72">
                      <h3 className="font-medium mb-3">Transportation</h3>
                      <div className="space-y-2">
                        {transportations.map((transportation) => (
                          <div
                            key={transportation.id}
                            className="p-2 border rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => handleViewTransportation(transportation)}
                          >
                            <div className="flex items-center">
                              {getTransportationIcon(transportation.type)}
                              <p className="font-medium text-sm ml-2">
                                {transportation.provider || transportation.type}
                              </p>
                            </div>
                            {transportation.departure_time && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {format(parseISO(transportation.departure_time), 'MMM d, yyyy HH:mm')}
                              </div>
                            )}
                            {transportation.departure_location && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{transportation.departure_location}</span>
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

      {/* Modals */}
      <TransportationModal
        tripId={id as string}
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
      />

      <TransportationModal
        tripId={id as string}
        transportation={currentTransportation}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
      />

      <TransportationDetailsModal
        transportation={currentTransportation}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        onEdit={handleEditFromDetails}
        canEdit={canEdit}
        getIcon={getTransportationIcon}
      />
    </div>
  );
}
