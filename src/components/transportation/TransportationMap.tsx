'use client';

import { useEffect, useRef, useState } from 'react';
import { Transportation } from '@/lib/features/transportationSlice';
import MapboxWrapper from '../map/MapboxWrapper';

interface TransportationMapProps {
  transportations: Transportation[];
  height?: string;
  onMarkerClick?: (transportation: Transportation) => void;
}

export default function TransportationMap({
  transportations,
  height = '500px',
  onMarkerClick,
}: TransportationMapProps) {
  return (
    <MapboxWrapper>
      {(mapboxgl) => (
        <TransportationMapContent
          mapboxgl={mapboxgl}
          transportations={transportations}
          height={height}
          onMarkerClick={onMarkerClick}
        />
      )}
    </MapboxWrapper>
  );
}

interface TransportationMapContentProps extends TransportationMapProps {
  mapboxgl: any;
}

function TransportationMapContent({
  mapboxgl,
  transportations,
  height = '500px',
  onMarkerClick,
}: TransportationMapContentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

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
      setMapLoaded(true);
    });

    // Clean up on unmount
    return () => {
      // Remove all markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when transportations change or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers and routes
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Remove existing route layers and sources
    transportations.forEach((transportation, index) => {
      const routeId = `route-${index}`;
      if (map.current?.getLayer(routeId)) {
        map.current.removeLayer(routeId);
      }
      if (map.current?.getSource(routeId)) {
        map.current.removeSource(routeId);
      }
    });

    // Filter transportations with valid coordinates
    const validTransportations = transportations.filter(
      t => (t.departure_coordinates && t.departure_coordinates.x && t.departure_coordinates.y) ||
           (t.arrival_coordinates && t.arrival_coordinates.x && t.arrival_coordinates.y)
    );

    if (validTransportations.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    // Add markers and routes for each transportation
    validTransportations.forEach((transportation, index) => {
      // Add departure marker if coordinates exist
      if (transportation.departure_coordinates) {
        const { x: lng, y: lat } = transportation.departure_coordinates;
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'transportation-marker departure-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundImage = 'url(/images/departure-marker.svg)';
        el.style.backgroundSize = 'cover';
        el.style.cursor = 'pointer';
        
        // Create and add marker (without popup for better UX)
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Add click handler if provided
        if (onMarkerClick) {
          el.addEventListener('click', () => {
            onMarkerClick(transportation);
          });
        }
        
        // Store marker reference
        markers.current.push(marker);
        
        // Extend bounds
        bounds.extend([lng, lat]);
      }
      
      // Add arrival marker if coordinates exist
      if (transportation.arrival_coordinates) {
        const { x: lng, y: lat } = transportation.arrival_coordinates;
        
        // Create marker element
        const el = document.createElement('div');
        el.className = 'transportation-marker arrival-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundImage = 'url(/images/arrival-marker.svg)';
        el.style.backgroundSize = 'cover';
        el.style.cursor = 'pointer';
        
        // Create and add marker (without popup for better UX)
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Add click handler if provided
        if (onMarkerClick) {
          el.addEventListener('click', () => {
            onMarkerClick(transportation);
          });
        }
        
        // Store marker reference
        markers.current.push(marker);
        
        // Extend bounds
        bounds.extend([lng, lat]);
      }
      
      // Add route line if both departure and arrival coordinates exist
      if (transportation.departure_coordinates && transportation.arrival_coordinates) {
        const departureCoords = [
          transportation.departure_coordinates.x,
          transportation.departure_coordinates.y
        ];
        const arrivalCoords = [
          transportation.arrival_coordinates.x,
          transportation.arrival_coordinates.y
        ];
        
        // Add route line
        const routeId = `route-${index}`;
        
        // Add the route source
        map.current!.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [departureCoords, arrivalCoords]
            }
          }
        });
        
        // Add the route layer
        map.current!.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': getRouteColor(transportation.type),
            'line-width': 3,
            'line-opacity': 0.8,
            'line-dasharray': [1, 1]
          }
        });
      }
      
      // Add stops if they exist
      if (transportation.stops && transportation.stops.length > 0) {
        transportation.stops.forEach((stop, stopIndex) => {
          if (stop.coordinates) {
            const { x: lng, y: lat } = stop.coordinates;
            
            // Create marker element
            const el = document.createElement('div');
            el.className = 'transportation-marker stop-marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.backgroundImage = 'url(/images/stop-marker.svg)';
            el.style.backgroundSize = 'cover';
            el.style.cursor = 'pointer';
            
            // Create and add marker (without popup for better UX)
            const marker = new mapboxgl.Marker(el)
              .setLngLat([lng, lat])
              .addTo(map.current!);
            
            // Add click handler if provided
            if (onMarkerClick) {
              el.addEventListener('click', () => {
                onMarkerClick(transportation);
              });
            }
            
            // Store marker reference
            markers.current.push(marker);
            
            // Extend bounds
            bounds.extend([lng, lat]);
          }
        });
      }
    });

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }
  }, [transportations, mapLoaded, onMarkerClick]);

  // Helper function to get route color based on transportation type
  const getRouteColor = (type: string) => {
    switch (type) {
      case 'flight':
        return '#3B82F6'; // blue
      case 'train':
        return '#10B981'; // green
      case 'bus':
        return '#F59E0B'; // amber
      case 'car':
        return '#EF4444'; // red
      case 'ferry':
        return '#6366F1'; // indigo
      default:
        return '#6B7280'; // gray
    }
  };

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height, width: '100%', borderRadius: '0.375rem' }} />
    </div>
  );
}
