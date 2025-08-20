'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPinIcon, CalendarIcon, UsersIcon, DollarSignIcon, InfoIcon, ZoomInIcon, ZoomOutIcon, LayersIcon, MaximizeIcon, MinimizeIcon, FilterIcon, RotateCcwIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import MapboxWrapper from '@/components/map/MapboxWrapper';
import { TripDestinations } from '@/lib/types/destination';

interface Trip {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  budget_total: number | null;
  created_at: string;
  preferences?: {
    currency?: string;
    trip_type?: string;
    destinations?: TripDestinations;
  };
}

interface TripsMapViewProps {
  trips: Trip[];
  searchTerm?: string;
  filter?: 'all' | 'upcoming' | 'ongoing' | 'past';
}

interface ProcessedTrip extends Trip {
  status: 'upcoming' | 'ongoing' | 'completed' | 'planning';
  coordinates?: { lat: number; lng: number };
  primaryDestination?: string;
}

export default function TripsMapView({ trips, searchTerm = '', filter = 'all' }: TripsMapViewProps) {
  return (
    <MapboxWrapper
      fallback={
        <div className="w-full h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center border border-border">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <MapPinIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Map Loading...</h3>
              <p className="text-sm text-muted-foreground">Preparing your travel map</p>
            </div>
          </div>
        </div>
      }
    >
      {(mapboxgl) => (
        <TripsMapContent
          mapboxgl={mapboxgl}
          trips={trips}
          searchTerm={searchTerm}
          filter={filter}
        />
      )}
    </MapboxWrapper>
  );
}

interface TripsMapContentProps {
  mapboxgl: any;
  trips: Trip[];
  searchTerm: string;
  filter: 'all' | 'upcoming' | 'ongoing' | 'past';
}

function TripsMapContent({ mapboxgl, trips, searchTerm, filter }: TripsMapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const fullscreenMapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ProcessedTrip | null>(null);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [showClusters, setShowClusters] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredTrip, setHoveredTrip] = useState<string | null>(null);

  // Create trip marker function
  const createTripMarker = (trip: ProcessedTrip, mapboxgl: any) => {
    if (!trip.coordinates || !map.current) return null;

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'trip-marker';

    const statusConfig = getStatusConfig(trip.status);

    el.innerHTML = `
      <div class="relative group cursor-pointer">
        <div class="w-10 h-10 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border-3 shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        ${statusConfig.pulseClass ? `<div class="absolute inset-0 rounded-full ${statusConfig.pulseClass} animate-ping opacity-75"></div>` : ''}
      </div>
    `;

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      className: 'trip-popup'
    }).setHTML(createPopupContent(trip));

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([trip.coordinates.lng, trip.coordinates.lat])
      .setPopup(popup)
      .addTo(map.current);

    // Add hover and click handlers
    el.addEventListener('mouseenter', () => {
      setHoveredTrip(trip.id);
    });

    el.addEventListener('mouseleave', () => {
      setHoveredTrip(null);
    });

    el.addEventListener('click', () => {
      setSelectedTrip(trip);
      // Fly to the trip location
      map.current.flyTo({
        center: [trip.coordinates!.lng, trip.coordinates!.lat],
        zoom: 12,
        duration: 1000
      });
    });

    return marker;
  };

  // Process trips with coordinates and status
  const processedTrips = useMemo(() => {
    const now = new Date();
    
    return trips.map(trip => {
      let status: 'upcoming' | 'ongoing' | 'completed' | 'planning' = 'planning';
      
      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        
        if (now < start) status = 'upcoming';
        else if (now >= start && now <= end) status = 'ongoing';
        else status = 'completed';
      }

      // Get coordinates from destinations
      let coordinates: { lat: number; lng: number } | undefined;
      let primaryDestination = trip.destination;

      if (trip.preferences?.destinations?.destinations?.length > 0) {
        const destinations = trip.preferences.destinations.destinations;
        const primary = destinations.find(d => d.id === trip.preferences?.destinations?.primary) || destinations[0];
        
        if (primary) {
          coordinates = primary.coordinates;
          primaryDestination = primary.name;
        }
      }

      return {
        ...trip,
        status,
        coordinates,
        primaryDestination
      } as ProcessedTrip;
    });
  }, [trips]);

  // Filter trips based on search and filter criteria
  const filteredTrips = useMemo(() => {
    return processedTrips.filter(trip => {
      // Only show trips with coordinates
      if (!trip.coordinates) return false;

      // Apply status filter
      if (filter !== 'all') {
        if (filter === 'upcoming' && trip.status !== 'upcoming') return false;
        if (filter === 'ongoing' && trip.status !== 'ongoing') return false;
        if (filter === 'past' && trip.status !== 'completed') return false;
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          trip.name.toLowerCase().includes(term) ||
          (trip.primaryDestination?.toLowerCase().includes(term) || false) ||
          (trip.description?.toLowerCase().includes(term) || false)
        );
      }

      return true;
    });
  }, [processedTrips, filter, searchTerm]);

  // Initialize map
  useEffect(() => {
    const container = isFullscreen ? fullscreenMapContainer.current : mapContainer.current;
    if (!container) return;

    // Remove existing map if style changed or container changed
    if (map.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current.remove();
      map.current = null;
      setMapLoaded(false);
    }

    map.current = new mapboxgl.Map({
      container: container,
      style: mapStyle,
      center: [12.4964, 41.9028], // Default to Rome
      zoom: 2,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Add attribution control at bottom
    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }), 'bottom-right');

    map.current.on('load', () => {
      console.log('Map loaded with style:', mapStyle, 'fullscreen:', isFullscreen);
      setMapLoaded(true);

      // Immediately create markers when map loads
      setTimeout(() => {
        if (filteredTrips.length > 0) {
          console.log('Creating markers immediately after map load');
          // Clear existing markers
          markers.current.forEach(marker => marker.remove());
          markers.current = [];

          // Create markers for each trip
          filteredTrips.forEach(trip => {
            if (!trip.coordinates) return;
            const marker = createTripMarker(trip, mapboxgl);
            if (marker) markers.current.push(marker);
          });

          console.log('Created', markers.current.length, 'markers immediately');
        }
      }, 100);
    });

    return () => {
      // Cleanup markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, isFullscreen]);

  // Update markers when trips change or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('Creating markers for', filteredTrips.length, 'trips');

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (filteredTrips.length === 0) return;

    // Create markers for each trip
    filteredTrips.forEach(trip => {
      if (!trip.coordinates) return;

      const marker = createTripMarker(trip, mapboxgl);
      if (marker) markers.current.push(marker);
    });

    console.log('Created', markers.current.length, 'markers');

  }, [filteredTrips, mapLoaded, mapboxgl]);

  // Separate effect for fitting bounds only when trips change (not style)
  useEffect(() => {
    if (!map.current || !mapLoaded || filteredTrips.length === 0) return;

    // Use a timeout to ensure markers are rendered before fitting bounds
    setTimeout(() => {
      if (map.current && markers.current.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        filteredTrips.forEach(trip => {
          if (trip.coordinates) {
            bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
          }
        });

        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 10,
          duration: 1000
        });
      }
    }, 200);
  }, [filteredTrips, mapLoaded]);

  // Force marker recreation when map style or fullscreen changes
  useEffect(() => {
    if (!map.current || filteredTrips.length === 0) return;

    console.log('Map style/fullscreen changed, forcing marker recreation');

    // Wait for map to be ready and then recreate markers
    const recreateMarkers = () => {
      if (!map.current) return;

      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      // Recreate markers
      filteredTrips.forEach(trip => {
        if (!trip.coordinates) return;
        const marker = createTripMarker(trip, mapboxgl);
        if (marker) markers.current.push(marker);
      });

      console.log('Force recreated', markers.current.length, 'markers');
    };

    if (mapLoaded) {
      // If map is already loaded, recreate immediately
      setTimeout(recreateMarkers, 100);
    } else {
      // If map is not loaded yet, wait for it
      const checkMapLoaded = setInterval(() => {
        if (mapLoaded) {
          clearInterval(checkMapLoaded);
          setTimeout(recreateMarkers, 100);
        }
      }, 100);

      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkMapLoaded), 5000);
    }
  }, [mapStyle, isFullscreen, filteredTrips, mapboxgl]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'upcoming':
        return {
          bgColor: 'bg-emerald-500',
          borderColor: 'border-emerald-300',
          pulseClass: 'bg-emerald-400'
        };
      case 'ongoing':
        return {
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-300',
          pulseClass: 'bg-orange-400'
        };
      case 'completed':
        return {
          bgColor: 'bg-purple-500',
          borderColor: 'border-purple-300',
          pulseClass: null
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-300',
          pulseClass: null
        };
    }
  };

  const createPopupContent = (trip: ProcessedTrip) => {
    const statusConfig = getStatusConfig(trip.status);
    const currency = trip.preferences?.currency || 'USD';
    
    return `
      <div class="p-4 min-w-[280px]">
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-semibold text-lg text-gray-900 dark:text-white pr-2">${trip.name}</h3>
          <span class="px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bgColor} text-white capitalize">${trip.status}</span>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex items-center text-gray-600 dark:text-gray-300">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            ${trip.primaryDestination || 'Unknown destination'}
          </div>
          
          ${trip.start_date ? `
            <div class="flex items-center text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
              ${new Date(trip.start_date).toLocaleDateString()}
              ${trip.end_date ? ` - ${new Date(trip.end_date).toLocaleDateString()}` : ''}
            </div>
          ` : ''}
          
          ${trip.budget_total ? `
            <div class="flex items-center text-gray-600 dark:text-gray-300">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
              </svg>
              ${formatCurrency(trip.budget_total, currency)}
            </div>
          ` : ''}
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <a href="/trips/${trip.id}" class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            View Details
            <svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    `;
  };

  const mapStyles = [
    { id: 'streets-v12', name: 'Streets', icon: '🗺️' },
    { id: 'satellite-v9', name: 'Satellite', icon: '🛰️' },
    { id: 'outdoors-v12', name: 'Outdoors', icon: '🏔️' },
    { id: 'dark-v11', name: 'Dark', icon: '🌙' }
  ];

  const handleStyleChange = (styleId: string) => {
    const newStyle = `mapbox://styles/mapbox/${styleId}`;
    setMapStyle(newStyle);

    // Auto-reset view when style changes
    setTimeout(() => {
      resetMapView();
    }, 800); // Wait for map style to load before resetting view
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    console.log('Toggling fullscreen:', newFullscreenState);
    setIsFullscreen(newFullscreenState);

    // The map will be recreated by the useEffect when isFullscreen changes
    // No need for manual resize since we're recreating the entire map
  };

  const resetMapView = () => {
    if (!map.current || filteredTrips.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    filteredTrips.forEach(trip => {
      if (trip.coordinates) {
        bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
      }
    });

    map.current.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 10,
      duration: 1000
    });
  };

  if (isFullscreen) {
    return (
      <>
        {/* Fullscreen overlay */}
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={toggleFullscreen}
        />

        {/* Fullscreen map container */}
        <div className="fixed inset-4 z-[9999] rounded-2xl overflow-hidden border border-border shadow-2xl bg-background">
          <div ref={fullscreenMapContainer} className="w-full h-full" />

          {/* Fullscreen controls */}
          <div className="absolute top-4 left-4 z-10 space-y-2">
            {/* Style Selector */}
            <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2">
              <div className="flex items-center gap-1">
                {mapStyles.map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md transition-all duration-200",
                      mapStyle.includes(style.id)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                    title={style.name}
                  >
                    {style.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Controls - Compact */}
            <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1 w-max">
              <div className="flex gap-0.5">
                <button
                  onClick={resetMapView}
                  className="p-1.5 text-xs rounded-md transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Reset View"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-xs rounded-md transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Exit Fullscreen"
                >
                  <MinimizeIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Fullscreen trip counter and legend */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{filteredTrips.length}</span>
                <span className="text-muted-foreground">
                  {filteredTrips.length === 1 ? 'trip' : 'trips'}
                </span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">Trip Status</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span>Upcoming</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Ongoing</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Planning</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State for fullscreen */}
          {filteredTrips.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <div className="text-center space-y-4 max-w-md mx-auto p-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <MapPinIcon className="h-10 w-10 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No trips to display</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || filter !== 'all'
                      ? 'Try adjusting your filters or search terms to see more trips on the map'
                      : 'Create your first trip with destinations to see it on the map'
                    }
                  </p>
                </div>
                {!searchTerm && filter === 'all' && (
                  <div className="mt-6">
                    <a
                      href="/trips/new"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create Your First Trip
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-border shadow-lg">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {/* Style Selector */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2">
          <div className="flex items-center gap-1">
            {mapStyles.map(style => (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md transition-all duration-200",
                  mapStyle.includes(style.id)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
                title={style.name}
              >
                {style.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Controls - Compact */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1 w-max">
          <div className="flex gap-0.5">
            <button
              onClick={resetMapView}
              className="p-1.5 text-xs rounded-md transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Reset View"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-xs rounded-md transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <MinimizeIcon className="h-3.5 w-3.5" /> : <MaximizeIcon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Trip Counter and Status Legend */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-primary" />
            <span className="font-medium">{filteredTrips.length}</span>
            <span className="text-muted-foreground">
              {filteredTrips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Trip Status</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Upcoming</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Ongoing</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Planning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTrips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto">
              <MapPinIcon className="h-10 w-10 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No trips to display</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your filters or search terms to see more trips on the map'
                  : 'Create your first trip with destinations to see it on the map'
                }
              </p>
            </div>
            {!searchTerm && filter === 'all' && (
              <div className="mt-6">
                <a
                  href="/trips/new"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Trip
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
