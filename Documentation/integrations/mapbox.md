# Mapbox Integration

## Overview

Mapbox provides interactive maps, geocoding, and location services for VoyageSmart. This integration enables users to visualize trip locations, plan routes, and explore destinations with high-quality maps and geographic data.

## Setup and Configuration

### Environment Variables

```bash
# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=pk.eyJ1...your-token
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1...your-public-token
```

### Installation

```bash
npm install mapbox-gl @mapbox/mapbox-gl-geocoder
npm install --save-dev @types/mapbox-gl
```

### Basic Setup

```typescript
// lib/mapbox.ts
import mapboxgl from 'mapbox-gl';

// Set access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export { mapboxgl };

// Mapbox service class
export class MapboxService {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;
  }

  async geocode(query: string): Promise<GeocodingResult[]> {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${this.accessToken}&limit=5`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    return data.features.map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      bbox: feature.bbox,
      properties: feature.properties,
      context: feature.context
    }));
  }

  async reverseGeocode(longitude: number, latitude: number): Promise<GeocodingResult[]> {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${this.accessToken}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();
    return data.features;
  }

  async getDirections(
    start: [number, number],
    end: [number, number],
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<DirectionsResult> {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?access_token=${this.accessToken}&geometries=geojson&overview=full`
    );

    if (!response.ok) {
      throw new Error('Directions request failed');
    }

    return response.json();
  }
}
```

## Map Components

### Basic Map Component

```typescript
// components/maps/MapboxMap.tsx
import { useEffect, useRef, useState } from 'react';
import { mapboxgl } from '@/lib/mapbox';

interface MapboxMapProps {
  center?: [number, number];
  zoom?: number;
  style?: string;
  markers?: MapMarker[];
  onMapLoad?: (map: mapboxgl.Map) => void;
  className?: string;
}

interface MapMarker {
  id: string;
  coordinates: [number, number];
  title: string;
  description?: string;
  color?: string;
}

export function MapboxMap({
  center = [0, 0],
  zoom = 2,
  style = 'mapbox://styles/mapbox/streets-v11',
  markers = [],
  onMapLoad,
  className = 'h-96 w-full'
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      attributionControl: false
    });

    // Add attribution control
    map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-right');

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Handle map load
    map.current.on('load', () => {
      setIsLoaded(true);
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.style.backgroundColor = marker.color || '#3b82f6';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold">${marker.title}</h3>
            ${marker.description ? `<p class="text-sm text-gray-600">${marker.description}</p>` : ''}
          </div>
        `);

      new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [markers, isLoaded]);

  return <div ref={mapContainer} className={className} />;
}
```

### Geocoding Component

```typescript
// components/maps/LocationSearch.tsx
import { useState, useEffect, useRef } from 'react';
import { MapboxService } from '@/lib/mapbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationSearchProps {
  onLocationSelect: (location: GeocodingResult) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSearch({
  onLocationSelect,
  placeholder = "Search for a location...",
  className
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const mapboxService = useRef(new MapboxService());
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await mapboxService.current.geocode(query);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Geocoding error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleLocationSelect = (location: GeocodingResult) => {
    setQuery(location.place_name);
    setShowResults(false);
    onLocationSelect(location);
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />

      {showResults && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleLocationSelect(result)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{result.place_name}</div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Trip Integration

### Trip Map Component

```typescript
// components/trips/TripMap.tsx
import { useMemo } from 'react';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { Trip, Activity, Accommodation } from '@/types';

interface TripMapProps {
  trip: Trip;
  activities?: Activity[];
  accommodations?: Accommodation[];
  className?: string;
}

export function TripMap({ trip, activities = [], accommodations = [], className }: TripMapProps) {
  const markers = useMemo(() => {
    const allMarkers: MapMarker[] = [];

    // Add activity markers
    activities.forEach(activity => {
      if (activity.location?.coordinates) {
        allMarkers.push({
          id: `activity-${activity.id}`,
          coordinates: [
            activity.location.coordinates.lng,
            activity.location.coordinates.lat
          ],
          title: activity.title,
          description: activity.description,
          color: '#3b82f6' // Blue for activities
        });
      }
    });

    // Add accommodation markers
    accommodations.forEach(accommodation => {
      if (accommodation.coordinates) {
        allMarkers.push({
          id: `accommodation-${accommodation.id}`,
          coordinates: [
            accommodation.coordinates.lng,
            accommodation.coordinates.lat
          ],
          title: accommodation.name,
          description: accommodation.address,
          color: '#10b981' // Green for accommodations
        });
      }
    });

    return allMarkers;
  }, [activities, accommodations]);

  // Calculate map center and zoom based on markers
  const { center, zoom } = useMemo(() => {
    if (markers.length === 0) {
      return { center: [0, 0] as [number, number], zoom: 2 };
    }

    if (markers.length === 1) {
      return { center: markers[0].coordinates, zoom: 12 };
    }

    // Calculate bounds
    const lngs = markers.map(m => m.coordinates[0]);
    const lats = markers.map(m => m.coordinates[1]);
    
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calculate appropriate zoom level
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    
    let zoom = 10;
    if (maxDiff > 10) zoom = 4;
    else if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.1) zoom = 10;
    else zoom = 12;

    return { center: [centerLng, centerLat] as [number, number], zoom };
  }, [markers]);

  return (
    <MapboxMap
      center={center}
      zoom={zoom}
      markers={markers}
      className={className}
    />
  );
}
```

### Itinerary Map View

```typescript
// components/itinerary/ItineraryMapView.tsx
import { useState } from 'react';
import { MapboxMap } from '@/components/maps/MapboxMap';
import { Button } from '@/components/ui/button';
import { Activity } from '@/types';

interface ItineraryMapViewProps {
  activities: Activity[];
  selectedDay?: number;
  onActivitySelect?: (activity: Activity) => void;
}

export function ItineraryMapView({
  activities,
  selectedDay,
  onActivitySelect
}: ItineraryMapViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Filter activities by selected day
  const filteredActivities = selectedDay
    ? activities.filter(activity => {
        const activityDay = new Date(activity.date).getDate();
        return activityDay === selectedDay;
      })
    : activities;

  const markers = filteredActivities.map(activity => ({
    id: activity.id,
    coordinates: [
      activity.location?.coordinates?.lng || 0,
      activity.location?.coordinates?.lat || 0
    ] as [number, number],
    title: activity.title,
    description: `${activity.start_time} - ${activity.category}`,
    color: selectedActivity === activity.id ? '#ef4444' : '#3b82f6'
  }));

  const handleMapLoad = (map: mapboxgl.Map) => {
    // Add route between activities if there are multiple
    if (filteredActivities.length > 1) {
      // Implementation for route visualization
    }
  };

  return (
    <div className="space-y-4">
      {/* Day selector */}
      {selectedDay && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Day {selectedDay}</span>
          <span className="text-sm text-muted-foreground">
            {filteredActivities.length} activities
          </span>
        </div>
      )}

      {/* Map */}
      <MapboxMap
        markers={markers}
        onMapLoad={handleMapLoad}
        className="h-96 w-full rounded-lg"
      />

      {/* Activity list */}
      <div className="space-y-2">
        {filteredActivities.map(activity => (
          <Button
            key={activity.id}
            variant={selectedActivity === activity.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedActivity(activity.id);
              onActivitySelect?.(activity);
            }}
            className="w-full justify-start"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: selectedActivity === activity.id ? '#ef4444' : '#3b82f6'
                }}
              />
              <span>{activity.title}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {activity.start_time}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Features

### Route Optimization

```typescript
// lib/mapbox/routeOptimization.ts
export class RouteOptimizer {
  private mapboxService: MapboxService;

  constructor() {
    this.mapboxService = new MapboxService();
  }

  async optimizeRoute(waypoints: [number, number][]): Promise<OptimizedRoute> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required');
    }

    // Use Mapbox Optimization API
    const coordinates = waypoints.map(wp => `${wp[0]},${wp[1]}`).join(';');
    
    const response = await fetch(
      `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&roundtrip=false&source=first&destination=last`
    );

    if (!response.ok) {
      throw new Error('Route optimization failed');
    }

    const data = await response.json();
    return {
      optimizedOrder: data.waypoints.map((wp: any) => wp.waypoint_index),
      totalDistance: data.trips[0].distance,
      totalDuration: data.trips[0].duration,
      geometry: data.trips[0].geometry
    };
  }

  async getWalkingDirections(
    start: [number, number],
    end: [number, number]
  ): Promise<WalkingDirections> {
    return this.mapboxService.getDirections(start, end, 'walking');
  }
}
```

### Offline Maps

```typescript
// lib/mapbox/offlineSupport.ts
export class OfflineMapSupport {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VoyageSmartMaps', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('tiles')) {
          db.createObjectStore('tiles', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
      };
    });
  }

  async cacheTilesForTrip(trip: Trip): Promise<void> {
    // Implementation for caching map tiles for offline use
    // This would cache tiles for the trip's geographic area
  }

  async getCachedRoute(routeId: string): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['routes'], 'readonly');
      const store = transaction.objectStore('routes');
      const request = store.get(routeId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

## Error Handling

### Mapbox Error Types

```typescript
// lib/errors/mapboxErrors.ts
export class MapboxError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'MapboxError';
  }
}

export function handleMapboxError(error: any): MapboxError {
  if (error.message?.includes('Unauthorized')) {
    return new MapboxError('Invalid Mapbox access token', 'UNAUTHORIZED', 401);
  }
  
  if (error.message?.includes('Rate limit')) {
    return new MapboxError('Mapbox rate limit exceeded', 'RATE_LIMIT', 429);
  }
  
  if (error.message?.includes('No route found')) {
    return new MapboxError('No route found between locations', 'NO_ROUTE', 404);
  }

  return new MapboxError(error.message || 'Unknown Mapbox error');
}
```

## Performance Optimization

### Map Performance

```typescript
// lib/mapbox/performance.ts
export class MapPerformanceOptimizer {
  static optimizeForMobile(map: mapboxgl.Map): void {
    // Reduce quality for better performance on mobile
    map.setRenderWorldCopies(false);
    map.setMaxZoom(16);
    
    // Disable pitch and bearing for simpler rendering
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
  }

  static enableClustering(map: mapboxgl.Map, sourceId: string): void {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layers
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });
  }
}
```

## Testing

### Mapbox Testing

```typescript
// __tests__/mapbox/mapboxService.test.ts
import { MapboxService } from '@/lib/mapbox';

// Mock Mapbox API
global.fetch = jest.fn();

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(() => {
    service = new MapboxService();
    (fetch as jest.Mock).mockClear();
  });

  it('should geocode location successfully', async () => {
    const mockResponse = {
      features: [
        {
          id: '1',
          place_name: 'Paris, France',
          center: [2.3522, 48.8566],
          properties: {},
          context: []
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const results = await service.geocode('Paris');
    
    expect(results).toHaveLength(1);
    expect(results[0].place_name).toBe('Paris, France');
    expect(results[0].center).toEqual([2.3522, 48.8566]);
  });

  it('should handle geocoding errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    await expect(service.geocode('Invalid')).rejects.toThrow('Geocoding request failed');
  });
});
```

## Best Practices

### Mapbox Integration Guidelines

1. **Access Token Security**
   - Use public tokens for client-side code
   - Restrict token permissions and domains
   - Rotate tokens regularly

2. **Performance Optimization**
   - Implement clustering for many markers
   - Use appropriate zoom levels
   - Cache tiles for offline use

3. **User Experience**
   - Provide loading states
   - Handle errors gracefully
   - Optimize for mobile devices

4. **Rate Limiting**
   - Monitor API usage
   - Implement client-side caching
   - Use appropriate request intervals

5. **Accessibility**
   - Provide alternative text for maps
   - Support keyboard navigation
   - Include location descriptions
