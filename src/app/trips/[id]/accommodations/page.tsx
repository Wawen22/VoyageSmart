'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAccommodations, Accommodation, setCurrentAccommodation } from '@/lib/features/accommodationSlice';
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
  Building2Icon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  ListIcon,
  MapIcon
} from 'lucide-react';
import AccommodationCard from '@/components/accommodations/AccommodationCard';
import AccommodationModal from '@/components/accommodations/AccommodationModal';
import AccommodationDetailsModal from '@/components/accommodations/AccommodationDetailsModal';
import MapView from '@/components/map/MapView';
import AccommodationsMapView from '@/components/map/AccommodationsMapView';

type Trip = {
  id: string;
  name: string;
  destination: string | null;
};

export default function AccommodationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
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

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <BackButton href={`/trips/${id}`} />
          <h1 className="text-2xl font-bold ml-2 flex items-center">
            <Building2Icon className="h-6 w-6 mr-2" />
            Accommodations
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{trip.name}</h2>
            {trip.destination && (
              <p className="text-muted-foreground flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {trip.destination}
              </p>
            )}
          </div>

          {canEdit && (
            <Button onClick={handleAddAccommodation}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Accommodation
            </Button>
          )}
        </div>
      </header>

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
          <p>Loading accommodations...</p>
        </div>
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
          {/* List View */}
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

          {/* Map View */}
          {viewMode === 'map' && (
            <Card>
              <CardContent className="p-4">
                <div className="h-[500px] relative">
                  <AccommodationsMapView
                    accommodations={accommodations}
                    height="500px"
                    onMarkerClick={handleViewAccommodation}
                  />

                  {/* Accommodation list */}
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

      {/* Modals */}
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
