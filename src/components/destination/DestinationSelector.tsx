'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PlusIcon, XIcon, MapPinIcon } from 'lucide-react';
import { Destination, TripDestinations } from '@/lib/types/destination';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface DestinationSelectorProps {
  value: TripDestinations;
  onChange: (value: TripDestinations) => void;
  error?: string;
}

export default function DestinationSelector({
  value,
  onChange,
  error,
}: DestinationSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create the map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [12.4964, 41.9028], // Default to Rome
      zoom: 2,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Wait for map to load before allowing operations
    map.current.on('load', () => {
      console.log('Destination selector map loaded successfully');
      setMapLoaded(true);
    });

    // Clean up on unmount
    return () => {
      // Remove all markers
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when destinations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add markers for each destination
    value.destinations.forEach(destination => {
      addMarkerToMap(destination);
    });

    // Fit map to markers if there are any
    if (value.destinations.length > 0) {
      fitMapToMarkers();
    }
  }, [value.destinations, mapLoaded]);

  // Add a marker to the map
  const addMarkerToMap = (destination: Destination) => {
    if (!map.current) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'destination-marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.backgroundImage = 'url(/images/map-marker.svg)';
    el.style.backgroundSize = 'cover';
    el.style.cursor = 'pointer';

    // Create popup with destination info
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <strong>${destination.name}</strong>
    `);

    // Create and add marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([destination.coordinates.lng, destination.coordinates.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    // Store marker reference
    markers.current[destination.id] = marker;
  };

  // Fit map to markers
  const fitMapToMarkers = () => {
    if (!map.current || value.destinations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    
    // Extend bounds with each destination
    value.destinations.forEach(destination => {
      bounds.extend([destination.coordinates.lng, destination.coordinates.lat]);
    });

    // Fit map to bounds with padding
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  };

  // Search for places using Mapbox Geocoding API
  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxgl.accessToken}&types=place,locality,neighborhood,address&limit=5`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      setSearchResults(data.features);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchInput(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchPlaces(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Add a destination from search results
  const addDestination = (feature: any) => {
    const newDestination: Destination = {
      id: uuidv4(),
      name: feature.place_name,
      coordinates: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
      placeId: feature.id,
    };

    // Add to destinations
    const newDestinations = {
      ...value,
      destinations: [...value.destinations, newDestination],
      // Set as primary if it's the first destination
      primary: value.destinations.length === 0 ? newDestination.id : value.primary,
    };

    onChange(newDestinations);
    
    // Clear search
    setSearchInput('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Remove a destination
  const removeDestination = (id: string) => {
    const newDestinations = value.destinations.filter(d => d.id !== id);
    
    // Update primary if needed
    let newPrimary = value.primary;
    if (value.primary === id) {
      newPrimary = newDestinations.length > 0 ? newDestinations[0].id : undefined;
    }

    onChange({
      destinations: newDestinations,
      primary: newPrimary,
    });
  };

  // Set a destination as primary
  const setPrimaryDestination = (id: string) => {
    onChange({
      ...value,
      primary: id,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-foreground">
          Destinations
        </label>
        
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder="Search for a destination..."
            className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          
          {/* Search results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map(feature => (
                <div
                  key={feature.id}
                  className="p-2 hover:bg-accent cursor-pointer"
                  onClick={() => addDestination(feature)}
                >
                  <div className="font-medium">{feature.text}</div>
                  <div className="text-sm text-muted-foreground">{feature.place_name}</div>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-64 rounded-md overflow-hidden border border-input"
      />
      
      {/* Selected destinations */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Selected Destinations
        </label>
        
        {value.destinations.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No destinations selected. Search for a place to add it.
          </div>
        ) : (
          <div className="space-y-2">
            {value.destinations.map(destination => (
              <div 
                key={destination.id}
                className={`flex items-center justify-between p-2 rounded-md ${
                  destination.id === value.primary 
                    ? 'bg-primary/10 border border-primary' 
                    : 'bg-card border border-input'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{destination.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {destination.id !== value.primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryDestination(destination.id)}
                      className="text-xs bg-secondary hover:bg-accent px-2 py-1 rounded"
                    >
                      Set as Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeDestination(destination.id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
