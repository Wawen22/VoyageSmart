'use client';

import { useEffect, useRef, useState } from 'react';
import { Accommodation } from '@/lib/features/accommodationSlice';
import MapboxWrapper from './MapboxWrapper';

interface AccommodationsMapViewProps {
  accommodations: Accommodation[];
  height?: string;
  onMarkerClick?: (accommodation: Accommodation) => void;
}

export default function AccommodationsMapView({
  accommodations,
  height = '500px',
  onMarkerClick,
}: AccommodationsMapViewProps) {
  return (
    <MapboxWrapper>
      {(mapboxgl) => (
        <AccommodationsMapContent
          mapboxgl={mapboxgl}
          accommodations={accommodations}
          height={height}
          onMarkerClick={onMarkerClick}
        />
      )}
    </MapboxWrapper>
  );
}

interface AccommodationsMapContentProps extends AccommodationsMapViewProps {
  mapboxgl: any;
}

function AccommodationsMapContent({
  mapboxgl,
  accommodations,
  height = '500px',
  onMarkerClick,
}: AccommodationsMapContentProps) {
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

  // Update markers when accommodations change or map loads
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter accommodations with valid coordinates
    const validAccommodations = accommodations.filter(
      acc => acc.coordinates && acc.coordinates.x && acc.coordinates.y
    );

    if (validAccommodations.length === 0) return;

    // Add markers for each accommodation
    validAccommodations.forEach(accommodation => {
      if (!accommodation.coordinates || !map.current) return;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'accommodation-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.backgroundImage = 'url(/images/accommodation-marker.svg)';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      
      // Create popup with accommodation info
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <strong>${accommodation.name}</strong>
        ${accommodation.address ? `<p>${accommodation.address}</p>` : ''}
      `);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([accommodation.coordinates.x, accommodation.coordinates.y])
        .setPopup(popup)
        .addTo(map.current);
      
      // Add click handler if provided
      if (onMarkerClick) {
        el.addEventListener('click', () => {
          onMarkerClick(accommodation);
        });
      }
      
      // Store marker reference
      markers.current.push(marker);
    });

    // Fit map to show all markers
    if (validAccommodations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      validAccommodations.forEach(accommodation => {
        if (accommodation.coordinates) {
          bounds.extend([accommodation.coordinates.x, accommodation.coordinates.y]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }
  }, [accommodations, mapLoaded, onMarkerClick]);

  return (
    <div className="relative">
      <div ref={mapContainer} style={{ height, width: '100%', borderRadius: '0.375rem' }} />
    </div>
  );
}
