'use client';

import { useEffect, useRef, useState } from 'react';
import MapboxWrapper from './MapboxWrapper';

interface MapViewProps {
  address?: string;
  coordinates?: { x: number; y: number } | null;
  interactive?: boolean;
  height?: string;
  onLocationSelect?: (coordinates: { x: number; y: number }) => void;
}

export default function MapView({
  address,
  coordinates,
  interactive = true,
  height = '300px',
  onLocationSelect,
}: MapViewProps) {
  return (
    <MapboxWrapper>
      {(mapboxgl) => (
        <MapViewContent
          mapboxgl={mapboxgl}
          address={address}
          coordinates={coordinates}
          interactive={interactive}
          height={height}
          onLocationSelect={onLocationSelect}
        />
      )}
    </MapboxWrapper>
  );
}

interface MapViewContentProps extends MapViewProps {
  mapboxgl: any;
}

function MapViewContent({
  mapboxgl,
  address,
  coordinates,
  interactive = true,
  height = '300px',
  onLocationSelect,
}: MapViewContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create the map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates ? [coordinates.x, coordinates.y] : [12.4964, 41.9028], // Default to Rome if no coordinates
      zoom: coordinates ? 14 : 2,
    });

    // Add navigation controls
    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    // Wait for map to load before allowing operations
    map.current.on('load', () => {
      // Map loaded successfully
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    if (!map.current) return;

    // If we have coordinates, add or update the marker
    if (coordinates) {
      if (marker.current) {
        marker.current.setLngLat([coordinates.x, coordinates.y]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([coordinates.x, coordinates.y])
          .addTo(map.current);
      }

      // Center the map on the marker
      map.current.flyTo({
        center: [coordinates.x, coordinates.y],
        zoom: 14,
        essential: true,
      });
    } else if (marker.current) {
      // Remove the marker if no coordinates
      marker.current.remove();
      marker.current = null;
    }
  }, [coordinates]);

  // Geocode address when it changes
  useEffect(() => {
    if (!address) return;
    setGeocodingError(null);

    // Use a default location for Rome, Italy if geocoding fails
    const defaultLocation = { lng: 12.4964, lat: 41.9028 };

    const geocodeAddress = async () => {
      // Wait for map to be initialized
      if (!map.current) {
        console.log('Map not initialized yet, waiting...');
        setTimeout(geocodeAddress, 500);
        return;
      }

      try {
        // Now we'll use the actual Mapbox geocoding API
        console.log('Geocoding address:', address);

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapboxgl.accessToken}&limit=1`
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          // Make sure map is still available
          if (!map.current) return;

          // Update the marker
          if (marker.current) {
            marker.current.setLngLat([lng, lat]);
          } else {
            marker.current = new mapboxgl.Marker()
              .setLngLat([lng, lat])
              .addTo(map.current);
          }

          // Center the map on the marker
          // Make sure the map is loaded before calling flyTo
          if (map.current.loaded()) {
            map.current.flyTo({
              center: [lng, lat],
              zoom: 14,
              essential: true,
            });
          } else {
            map.current.on('load', () => {
              if (map.current) {
                map.current.flyTo({
                  center: [lng, lat],
                  zoom: 14,
                  essential: true,
                });
              }
            });
          }

          // Call the callback if provided
          if (onLocationSelect) {
            onLocationSelect({ x: lng, y: lat });
          }
        } else {
          setGeocodingError('Address not found');
          // Use default coordinates if address not found
          useDefaultLocation();
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
        setGeocodingError('Using default location');

        // Use default coordinates in case of error
        useDefaultLocation();
      }
    };

    // Helper function to use default location
    const useDefaultLocation = () => {
      // Make sure map is initialized
      if (!map.current) return;

      const lng = defaultLocation.lng;
      const lat = defaultLocation.lat;

      // Update the marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      // Center the map on the marker
      // Make sure the map is loaded before calling flyTo
      if (map.current.loaded()) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
        });
      } else {
        map.current.on('load', () => {
          if (map.current) {
            map.current.flyTo({
              center: [lng, lat],
              zoom: 14,
              essential: true,
            });
          }
        });
      }

      // Call the callback if provided
      if (onLocationSelect) {
        onLocationSelect({ x: lng, y: lat });
      }
    };

    geocodeAddress();
  }, [address, onLocationSelect]);

  // Add click handler for interactive maps
  useEffect(() => {
    if (!map.current || !interactive || !onLocationSelect) return;

    const handleMapClick = (e: any) => {
      const { lng, lat } = e.lngLat;

      // Update the marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      // Call the callback
      onLocationSelect({ x: lng, y: lat });
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [interactive, onLocationSelect]);

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height, width: '100%', borderRadius: '0.375rem' }} />
      {geocodingError && (
        <div className="absolute bottom-2 left-2 bg-destructive text-destructive-foreground px-3 py-1 text-sm rounded-md">
          {geocodingError}
        </div>
      )}
    </div>
  );
}
