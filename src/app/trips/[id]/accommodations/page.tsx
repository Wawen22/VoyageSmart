'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
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
  AlertTriangleIcon,
  Info
} from 'lucide-react';
import AccommodationCard from '@/components/accommodations/AccommodationCard';
import AccommodationSkeleton from '@/components/accommodations/AccommodationSkeleton';
// Lazy load heavy modal components for better performance
const AccommodationModal = lazy(() => import('@/components/accommodations/AccommodationModal'));
const AccommodationDetailsModal = lazy(() => import('@/components/accommodations/AccommodationDetailsModal'));
import { LazyMapView, LazyAccommodationsMapView } from '@/components/LazyComponents';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import AccommodationCounterWidget from '@/components/ui/AccommodationCounterWidget';

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
      <header className="relative overflow-visible mb-6">
        {/* Modern Glassmorphism Background - Emerald/Teal Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background/95 to-teal-500/10 backdrop-blur-xl overflow-hidden"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02] glass-grid-pattern"></div>
        </div>

        {/* Glass border effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

        {/* Navigation Bar with Glass Effect */}
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <BackButton
              href={`/trips/${id}`}
              label="Back to Trip"
              theme="green"
            />
          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-30 trip-header-mobile accommodations-header-mobile">
          <div className="animate-glass-fade-in">
            {/* Section Title with Modern Typography */}
            <div className="relative mb-6">
              {/* Mobile Layout - Stacked */}
              <div className="flex flex-col space-y-4 md:hidden">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20">
                      <Building2Icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-emerald-500 to-foreground bg-clip-text text-transparent">
                        Accommodations
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Counter Widget - Mobile */}
                <div className="flex justify-center gap-3">
                  <div className="glass-info-card flex items-center px-4 py-2 rounded-xl">
                    <div className="p-1 rounded-full bg-emerald-500/20 mr-2">
                      <Building2Icon className="h-3 w-3 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-emerald-500">{accommodations.length}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {accommodations.length === 1 ? 'Stay' : 'Stays'}
                      </span>
                    </div>
                  </div>

                  {/* Free Plan Limit Indicator - Mobile */}
                  {subscription?.tier === 'free' && (
                    <div className="relative group/limit-mobile z-[9999]">
                      <div className="glass-info-card flex items-center px-3 py-2 rounded-xl border border-emerald-500/30 cursor-help transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-95">
                        <Info className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                        <div className="text-center">
                          <span className="text-xs font-semibold text-emerald-600">{accommodations.length}/5</span>
                          <span className="text-[10px] text-muted-foreground ml-1">used</span>
                        </div>
                      </div>

                      {/* Tooltip - Mobile (click/tap) & Desktop (hover) */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 invisible group-hover/limit-mobile:opacity-100 group-hover/limit-mobile:visible transition-all duration-200 z-[9999] pointer-events-none group-hover/limit-mobile:pointer-events-auto">
                        <div className="p-3 bg-popover border border-border rounded-lg shadow-2xl">
                          <div className="text-xs space-y-1.5">
                            <p className="font-semibold text-foreground">Free Plan Limit</p>
                            <p className="text-muted-foreground">
                              You're using <span className="font-bold text-emerald-600">{accommodations.length} of 5</span> accommodations
                            </p>
                            <p className="text-xs text-muted-foreground pt-1.5 border-t border-border">
                              💎 Upgrade to Premium for unlimited accommodations
                            </p>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout - Side by Side */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20">
                      <Building2Icon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      <span className="bg-gradient-to-r from-foreground via-emerald-500 to-foreground bg-clip-text text-transparent">
                        Accommodations
                      </span>
                    </h1>
                    {trip && (
                      <p className="text-base text-muted-foreground mt-1">
                        {trip.name} {trip.destination && `• ${trip.destination}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Counter Widget - Desktop */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="glass-info-card flex items-center px-4 py-2.5 rounded-2xl">
                    <div className="p-1.5 rounded-full bg-emerald-500/20 mr-3">
                      <Building2Icon className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-500">{accommodations.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {accommodations.length === 1 ? 'Stay' : 'Stays'}
                      </div>
                    </div>
                  </div>

                  {/* Free Plan Limit Indicator - Desktop */}
                  {subscription?.tier === 'free' && (
                    <div className="relative group/limit-desktop z-[9999]">
                      <div className="glass-info-card flex items-center px-4 py-2.5 rounded-2xl border border-emerald-500/30 cursor-help transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:scale-105">
                        <Info className="h-4 w-4 text-emerald-500 mr-2" />
                        <div className="text-center">
                          <div className="text-sm font-bold text-emerald-600">{accommodations.length}/5</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Limit</div>
                        </div>
                      </div>

                      {/* Tooltip - Desktop (hover) - Portal-like positioning */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 invisible group-hover/limit-desktop:opacity-100 group-hover/limit-desktop:visible transition-all duration-200 z-[9999] pointer-events-none group-hover/limit-desktop:pointer-events-auto">
                        <div className="p-3 bg-popover border border-border rounded-lg shadow-2xl">
                          <div className="text-xs space-y-1.5">
                            <p className="font-semibold text-foreground">Free Plan Limit</p>
                            <p className="text-muted-foreground">
                              You're using <span className="font-bold text-emerald-600">{accommodations.length} of 5</span> accommodations
                            </p>
                            <p className="text-xs text-muted-foreground pt-1.5 border-t border-border">
                              💎 Upgrade to Premium for unlimited accommodations
                            </p>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500/20 rounded-full animate-ping"></div>
              <div className="absolute -bottom-1 -right-4 w-2 h-2 bg-teal-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 accommodations-section-mobile">
        {/* Free plan limitation warning - Modernized */}
        {subscription?.tier === 'free' && accommodations.length >= 4 && (
          <div className="mb-6 glass-card rounded-2xl p-4 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 animate-glass-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 backdrop-blur-sm">
                <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {accommodations.length >= 5
                    ? "You've reached the free plan limit of 5 accommodations per trip."
                    : `You're approaching the free plan limit (${accommodations.length}/5 accommodations).`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upgrade to Premium for unlimited accommodations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Section - Modernized */}
        <div className="mb-6 glass-card rounded-2xl p-4 md:p-6 animate-glass-fade-in accommodations-controls-mobile" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Add Button */}
            {canEdit && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddAccommodation}
                  disabled={!canAddMore}
                  className={`glass-button-primary inline-flex items-center px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                    !canAddMore ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-emerald-500/25'
                  }`}
                >
                  <div className="p-1 rounded-lg bg-white/20 mr-2">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  Add Accommodation
                  {!canAddMore && subscription?.tier === 'free' && (
                    <span className="ml-2 text-xs opacity-75">(Limit reached)</span>
                  )}
                </button>

                {/* Quick Stats */}
                <div className="hidden md:flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span>{accommodations.length} total</span>
                  </div>
                  {subscription?.tier === 'free' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <span>{5 - accommodations.length} remaining</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Tabs - Modernized */}
        <div className="mb-6 glass-card rounded-2xl p-4 animate-glass-fade-in accommodations-view-mobile" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">View Options</h3>
              <p className="text-sm text-muted-foreground">Choose how to display your accommodations</p>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'map')} className="w-auto">
              <TabsList className="glass-nav rounded-xl p-1 border border-white/20">
                <TabsTrigger
                  value="list"
                  className="flex items-center px-4 py-2 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600 transition-all duration-300"
                >
                  <ListIcon className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger
                  value="map"
                  className="flex items-center px-4 py-2 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600 transition-all duration-300"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <AccommodationSkeleton />
        ) : error ? (
          <div className="glass-card rounded-2xl p-8 text-center animate-glass-fade-in">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-2xl bg-destructive/20 backdrop-blur-sm">
                <AlertTriangleIcon className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
                <p className="text-destructive text-sm mb-4">Error: {error}</p>
              </div>
              <button
                onClick={() => dispatch(fetchAccommodations(id as string))}
                className="glass-button-primary inline-flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-glass-fade-in">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/20">
                  <Building2Icon className="h-12 w-12 text-emerald-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400/20 rounded-full animate-ping"></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">No accommodations yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Add your first accommodation to keep track of your stays during this trip.
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={handleAddAccommodation}
                  className="glass-button-primary inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  <div className="p-1 rounded-lg bg-white/20 mr-2">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  Add Your First Stay
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <div className="animate-glass-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {accommodations.map((accommodation, index) => (
                    <div
                      key={accommodation.id}
                      className="animate-stagger-in"
                      style={{ animationDelay: `${index * 100 + 400}ms` }}
                    >
                      <AccommodationCard
                        accommodation={accommodation}
                        onView={handleViewAccommodation}
                        onEdit={handleEditAccommodation}
                        canEdit={canEdit}
                      />
                    </div>
                  ))}
                </div>
                {/* Mobile Layout - Flexbox */}
                <div className="md:hidden accommodations-grid-mobile">
                  {accommodations.map((accommodation, index) => (
                    <div
                      key={accommodation.id}
                      className="animate-stagger-in w-full"
                      style={{ animationDelay: `${index * 100 + 400}ms` }}
                    >
                      <AccommodationCard
                        accommodation={accommodation}
                        onView={handleViewAccommodation}
                        onEdit={handleEditAccommodation}
                        canEdit={canEdit}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'map' && (
              <div className="glass-card rounded-2xl overflow-hidden animate-glass-fade-in accommodations-map-mobile" style={{ animationDelay: '300ms' }}>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 backdrop-blur-sm">
                      <MapIcon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Map View</h3>
                      <p className="text-sm text-muted-foreground">Explore accommodations on the map</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="h-[500px] relative">
                    <LazyAccommodationsMapView
                      accommodations={accommodations}
                      height="500px"
                      onMarkerClick={handleViewAccommodation}
                    />

                    {/* Map Sidebar - Modernized */}
                    <div className="absolute top-4 left-4 z-10 glass-card rounded-2xl p-4 max-h-[450px] overflow-y-auto w-64 md:w-72 border-emerald-500/20 max-w-[calc(100vw-2rem)]">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20">
                          <Building2Icon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h3 className="font-semibold text-foreground">Accommodations</h3>
                        <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-600 rounded-full">
                          {accommodations.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {accommodations.map((accommodation, index) => (
                          <div
                            key={accommodation.id}
                            className="group p-3 rounded-xl backdrop-blur-sm bg-background/30 border border-white/10 hover:bg-background/50 hover:border-emerald-500/30 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                            onClick={() => handleViewAccommodation(accommodation)}
                          >
                            <p className="font-medium text-sm text-foreground group-hover:text-emerald-500 transition-colors">
                              {accommodation.name}
                            </p>
                            {accommodation.check_in_date && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {format(parseISO(accommodation.check_in_date), 'MMM d, yyyy')}
                              </div>
                            )}
                            {accommodation.address && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                <span className="truncate">{accommodation.address}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals with Suspense for better performance */}
      <Suspense fallback={null}>
        {isAddModalOpen && (
          <AccommodationModal
            tripId={id as string}
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
          />
        )}

        {isEditModalOpen && currentAccommodation && (
          <AccommodationModal
            tripId={id as string}
            accommodation={currentAccommodation}
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
          />
        )}

        {isDetailsModalOpen && currentAccommodation && (
          <AccommodationDetailsModal
            accommodation={currentAccommodation}
            isOpen={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            onEdit={handleEditFromDetails}
            canEdit={canEdit}
          />
        )}
      </Suspense>
    </div>
  );
}
