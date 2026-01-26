'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPinIcon } from 'lucide-react';
import MapboxWrapper from '@/components/map/MapboxWrapper';

type Activity = {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  coordinates?: string | { x: number; y: number } | null;
};

type ItineraryMapViewProps = {
  activities?: Activity[];
  selectedActivityIndex?: number | null;
  onMarkerClick?: (activityIndex: number) => void;
};

type ActivityMarker = {
  index: number;
  coordinates: [number, number];
  label: string;
};

const DEFAULT_CENTER: [number, number] = [12.4964, 41.9028];
const DEFAULT_ZOOM = 2;

export default function ItineraryMapView({
  activities = [],
  selectedActivityIndex,
  onMarkerClick,
}: ItineraryMapViewProps) {
  return (
    <MapboxWrapper
      fallback={
        <div className="h-full w-full bg-card/40 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading map...</div>
        </div>
      }
    >
      {(mapboxgl) => (
        <ItineraryMapContent
          mapboxgl={mapboxgl}
          activities={activities}
          selectedActivityIndex={selectedActivityIndex}
          onMarkerClick={onMarkerClick}
        />
      )}
    </MapboxWrapper>
  );
}

interface ItineraryMapContentProps extends ItineraryMapViewProps {
  mapboxgl: any;
}

function normalizeCoordinates(
  input?: string | { x: number; y: number } | null
): [number, number] | null {
  if (!input) return null;

  let lng: number | null = null;
  let lat: number | null = null;

  if (typeof input === 'string') {
    const match = input.replace(/[()]/g, '').split(',');
    if (match.length === 2) {
      lng = Number.parseFloat(match[0]);
      lat = Number.parseFloat(match[1]);
    }
  } else {
    lng = input.x;
    lat = input.y;
  }

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng === 0 && lat === 0) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

  return [lng, lat];
}

function ItineraryMapContent({
  mapboxgl,
  activities = [],
  selectedActivityIndex,
  onMarkerClick,
}: ItineraryMapContentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<
    Array<{
      marker: any;
      element: HTMLButtonElement;
      index: number;
      coordinates: [number, number];
      onClick: () => void;
    }>
  >([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const markers = useMemo<ActivityMarker[]>(() => {
    return activities.reduce<ActivityMarker[]>((acc, activity, index) => {
      const coordinates = normalizeCoordinates(activity.coordinates);
      if (!coordinates) return acc;
      acc.push({
        index,
        coordinates,
        label: activity.name || activity.location || `Stop ${index + 1}`,
      });
      return acc;
    }, []);
  }, [activities]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(({ marker, element, onClick }) => {
        element.removeEventListener('click', onClick);
        marker.remove();
      });
      markersRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxgl]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach(({ marker, element, onClick }) => {
      element.removeEventListener('click', onClick);
      marker.remove();
    });
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    markers.forEach(({ index, coordinates, label }) => {
      const markerEl = document.createElement('button');
      markerEl.type = 'button';
      markerEl.className = 'itinerary-map-marker';
      markerEl.textContent = String(index + 1);
      markerEl.setAttribute('aria-label', label);

      const handleClick = () => {
        onMarkerClick?.(index);
      };

      markerEl.addEventListener('click', handleClick);

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat(coordinates)
        .addTo(mapRef.current);

      markersRef.current.push({
        marker,
        element: markerEl,
        index,
        coordinates,
        onClick: handleClick,
      });

      bounds.extend(coordinates);
    });

    if (markers.length > 0) {
      mapRef.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 14,
        duration: 0,
      });
    } else {
      mapRef.current.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 0 });
    }
  }, [mapLoaded, mapboxgl, markers, onMarkerClick]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    markersRef.current.forEach(({ element, index, coordinates }) => {
      if (selectedActivityIndex === index) {
        element.classList.add('is-selected');
        mapRef.current.easeTo({
          center: coordinates,
          zoom: Math.max(mapRef.current.getZoom(), 12),
          duration: 350,
        });
      } else {
        element.classList.remove('is-selected');
      }
    });
  }, [selectedActivityIndex, mapLoaded]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <MapPinIcon className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nessuna posizione disponibile
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Aggiungi attività con coordinate per visualizzare la mappa
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
