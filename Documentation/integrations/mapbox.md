# Mapbox Integration

VoyageSmart uses Mapbox for maps and location services. This document provides detailed information on how Mapbox is integrated into VoyageSmart.

## Overview

Mapbox provides the following features in VoyageSmart:

- **Interactive Maps**: Visualize trips, activities, accommodations, and transportation on maps
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Places API**: Search for locations and get suggestions
- **Directions API**: Get directions and optimize routes

## Setup

### 1. Create a Mapbox Account

1. Go to [Mapbox](https://www.mapbox.com/) and sign up for an account
2. Navigate to your account dashboard
3. Create a new access token with the following scopes:
   - Maps
   - Geocoding
   - Directions
   - Places

### 2. Configure Environment Variables

Add your Mapbox access token to your `.env.local` file:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### 3. Install Dependencies

VoyageSmart uses the following Mapbox-related packages:

```bash
npm install mapbox-gl @mapbox/mapbox-gl-geocoder
```

## Implementation

### Map Component

VoyageSmart uses a reusable `Map` component for displaying maps throughout the application:

```tsx
// components/Map.tsx
import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    color?: string;
    label?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (coordinates: [number, number]) => void;
  style?: React.CSSProperties;
}

const Map: React.FC<MapProps> = ({
  center = [-74.5, 40],
  zoom = 9,
  markers = [],
  onMapClick,
  style = { width: '100%', height: '400px' },
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center,
      zoom,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (!map.current) return;
    map.current.setCenter(center);
    map.current.setZoom(zoom);
  }, [center, zoom]);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach((marker) => marker.remove());

    // Add new markers
    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = marker.color || '#FF0000';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';

      if (marker.label) {
        const label = document.createElement('div');
        label.className = 'marker-label';
        label.textContent = marker.label;
        label.style.color = 'white';
        label.style.fontWeight = 'bold';
        label.style.textAlign = 'center';
        label.style.lineHeight = '20px';
        el.appendChild(label);
      }

      if (marker.onClick) {
        el.addEventListener('click', marker.onClick);
      }

      new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .addTo(map.current!);
    });
  }, [markers, mapLoaded]);

  return <div ref={mapContainer} style={style} />;
};

export default Map;
```

### Geocoding

VoyageSmart uses Mapbox's Geocoding API to convert addresses to coordinates:

```tsx
// utils/geocoding.ts
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface GeocodeResult {
  coordinates: [number, number];
  placeName: string;
  error?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${mapboxgl.accessToken}`
    );
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coordinates: feature.center,
        placeName: feature.place_name,
      };
    } else {
      return {
        coordinates: [0, 0],
        placeName: '',
        error: 'No results found',
      };
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return {
      coordinates: [0, 0],
      placeName: '',
      error: 'Error geocoding address',
    };
  }
}
```

### Location Search

VoyageSmart uses Mapbox's Places API for location search and suggestions:

```tsx
// components/LocationSearch.tsx
import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { name: string; coordinates: [number, number] }) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a location',
}) => {
  const [suggestions, setSuggestions] = useState<Array<{
    id: string;
    name: string;
    coordinates: [number, number];
  }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            value
          )}.json?access_token=${mapboxgl.accessToken}&types=place,address`
        );
        
        const data = await response.json();
        
        if (data.features) {
          const formattedSuggestions = data.features.map((feature: any) => ({
            id: feature.id,
            name: feature.place_name,
            coordinates: feature.center,
          }));
          setSuggestions(formattedSuggestions);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className="location-search">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="location-search-input"
      />
      
      {loading && <div className="location-search-loading">Loading...</div>}
      
      {suggestions.length > 0 && (
        <ul className="location-search-suggestions">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onClick={() => {
                onChange(suggestion.name);
                onSelect(suggestion);
                setSuggestions([]);
              }}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
```

## Usage Examples

### Itinerary Map View

The `ItineraryMapView` component uses Mapbox to display activities on a map:

```tsx
// components/itinerary/ItineraryMapView.tsx
import React, { useState } from 'react';
import Map from '../Map';
import { Activity } from '@/types';

interface ItineraryMapViewProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
}

const ItineraryMapView: React.FC<ItineraryMapViewProps> = ({
  activities,
  onActivityClick,
}) => {
  const [center, setCenter] = useState<[number, number]>([-74.5, 40]);
  const [zoom, setZoom] = useState(9);

  // Calculate center based on activities
  React.useEffect(() => {
    if (activities.length === 0) return;

    // Calculate average coordinates
    const validActivities = activities.filter(
      (activity) => activity.coordinates && activity.coordinates.length === 2
    );

    if (validActivities.length === 0) return;

    const sumLng = validActivities.reduce(
      (sum, activity) => sum + activity.coordinates[0],
      0
    );
    const sumLat = validActivities.reduce(
      (sum, activity) => sum + activity.coordinates[1],
      0
    );

    setCenter([
      sumLng / validActivities.length,
      sumLat / validActivities.length,
    ]);
  }, [activities]);

  // Create markers from activities
  const markers = activities
    .filter((activity) => activity.coordinates && activity.coordinates.length === 2)
    .map((activity, index) => ({
      id: activity.id,
      coordinates: activity.coordinates as [number, number],
      color: getColorByActivityType(activity.type),
      label: (index + 1).toString(),
      onClick: () => onActivityClick(activity),
    }));

  return (
    <div className="itinerary-map-view">
      <Map
        center={center}
        zoom={zoom}
        markers={markers}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};

// Helper function to get color based on activity type
function getColorByActivityType(type: string): string {
  switch (type.toLowerCase()) {
    case 'sightseeing':
      return '#4CAF50'; // Green
    case 'food':
      return '#FF9800'; // Orange
    case 'adventure':
      return '#F44336'; // Red
    case 'relaxation':
      return '#2196F3'; // Blue
    case 'shopping':
      return '#9C27B0'; // Purple
    default:
      return '#607D8B'; // Gray
  }
}

export default ItineraryMapView;
```

## Best Practices

- **Lazy Loading**: Load Mapbox only when needed to improve performance
- **Geocoding Caching**: Cache geocoding results to reduce API calls
- **Error Handling**: Always handle errors gracefully
- **Responsive Design**: Make maps responsive for different screen sizes
- **Accessibility**: Ensure maps are accessible with keyboard navigation and screen readers

## Troubleshooting

### Common Issues

#### Map Not Displaying

- Check if your Mapbox access token is correct
- Ensure the container element has a width and height
- Check for JavaScript errors in the console

#### Geocoding Not Working

- Verify your Mapbox access token has geocoding permissions
- Check if you're exceeding Mapbox's rate limits
- Ensure you're handling errors properly

#### Performance Issues

- Reduce the number of markers on the map
- Use clustering for large numbers of markers
- Optimize map loading with lazy loading

---

Next: [Gemini AI](./gemini-ai.md)
