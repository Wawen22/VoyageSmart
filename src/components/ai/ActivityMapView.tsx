'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Navigation, Route, Maximize, Minimize } from 'lucide-react';

// Set your Mapbox token here
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Tipo per le attività generate
type GeneratedActivity = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference?: string;
  priority: number;
  cost?: number;
  currency?: string;
  notes?: string;
  status: string;
  day_id: string;
  day_date: string;
  coordinates?: { x: number; y: number } | null;
};

interface ActivityMapViewProps {
  activities: GeneratedActivity[];
  height?: string;
  onMarkerClick?: (activity: GeneratedActivity) => void;
  onCoordinatesUpdate?: (activity: GeneratedActivity, coordinates: { x: number; y: number }) => void;
}

export default function ActivityMapView({
  activities,
  height = '450px',
  onMarkerClick,
  onCoordinatesUpdate
}: ActivityMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);

  // Colori per i tipi di attività
  const activityColors: Record<string, string> = {
    sightseeing: '#3b82f6', // blue
    food: '#f97316', // orange
    shopping: '#ec4899', // pink
    nature: '#22c55e', // green
    culture: '#8b5cf6', // purple
    relax: '#14b8a6', // teal
    sport: '#ef4444', // red
    entertainment: '#6366f1', // indigo
    default: '#6b7280' // gray
  };

  // Inizializza la mappa quando il componente viene montato
  useEffect(() => {
    if (!mapContainer.current) return;

    // Crea l'istanza della mappa
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [12.4964, 41.9028], // Default a Roma
      zoom: 2,
    });

    // Aggiungi controlli di navigazione
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Attendi che la mappa sia caricata prima di permettere operazioni
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Pulizia alla rimozione del componente
    return () => {
      // Rimuovi tutti i marker
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Aggiorna i marker quando cambiano le attività o quando la mappa è caricata
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Rimuovi i marker esistenti
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filtra le attività con location valida
    const activitiesWithLocation = activities.filter(activity => activity.location && activity.location.trim() !== '');

    // Se non ci sono attività con location, non fare nulla
    if (activitiesWithLocation.length === 0) return;

    // Crea un bounds per contenere tutti i marker
    const bounds = new mapboxgl.LngLatBounds();

    // Aggiungi marker per ogni attività
    activitiesWithLocation.forEach(async (activity, index) => {
      // Se l'attività ha già coordinate, usa quelle
      if (activity.coordinates) {
        addMarker(activity, activity.coordinates);
        bounds.extend([activity.coordinates.x, activity.coordinates.y]);
      } else {
        // Altrimenti, geocodifica la location
        try {
          const coordinates = await geocodeLocation(activity.location);
          if (coordinates) {
            // Aggiungi il marker
            addMarker(activity, coordinates);
            bounds.extend([coordinates.x, coordinates.y]);

            // Aggiorna le coordinate dell'attività
            if (onCoordinatesUpdate) {
              onCoordinatesUpdate(activity, coordinates);
            }
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
        }
      }
    });

    // Adatta la mappa per mostrare tutti i marker
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }
  }, [activities, mapLoaded, onMarkerClick, onCoordinatesUpdate]);

  // Funzione per geocodificare una location
  const geocodeLocation = async (location: string): Promise<{ x: number; y: number } | null> => {
    try {
      // Miglioriamo la query per ottenere risultati più precisi
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?access_token=${mapboxgl.accessToken}&limit=1&types=place,locality,neighborhood,address,poi&autocomplete=true`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log(`Geocoded "${location}" to coordinates: [${lng}, ${lat}]`);
        return { x: lng, y: lat };
      }

      console.warn(`No geocoding results found for "${location}"`);
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  };

  // Funzione per aggiungere un marker alla mappa
  const addMarker = (activity: GeneratedActivity, coordinates: { x: number; y: number }) => {
    if (!map.current) return;

    // Crea l'elemento del marker
    const el = document.createElement('div');
    el.className = 'activity-marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = activityColors[activity.type.toLowerCase()] || activityColors.default;
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';

    // Aggiungi un'icona o un numero all'interno del marker
    const innerText = document.createElement('span');
    innerText.style.color = 'white';
    innerText.style.fontWeight = 'bold';
    innerText.style.fontSize = '14px';
    innerText.textContent = (markers.current.length + 1).toString();
    el.appendChild(innerText);

    // Formatta l'orario
    const formatTime = (timeString: string) => {
      try {
        const date = new Date(timeString);
        return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return timeString;
      }
    };

    // Crea popup con info sull'attività
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div style="max-width: 250px; background-color: #fff; color: #000; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <strong style="font-size: 14px; color: #000; display: block; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${activity.name}</strong>
        <p style="font-size: 12px; margin: 4px 0; color: #000;">
          <span style="color: #6b7280; font-weight: 500;">Orario:</span>
          ${formatTime(activity.start_time)} - ${formatTime(activity.end_time)}
        </p>
        <p style="font-size: 12px; margin: 4px 0; color: #000;">
          <span style="color: #6b7280; font-weight: 500;">Luogo:</span>
          ${activity.location}
        </p>
        ${activity.cost ? `
          <p style="font-size: 12px; margin: 4px 0; color: #000;">
            <span style="color: #6b7280; font-weight: 500;">Costo:</span>
            ${activity.cost} ${activity.currency || 'EUR'}
          </p>
        ` : ''}
        ${activity.notes ? `
          <p style="font-size: 12px; margin: 8px 0 0 0; color: #4b5563; background-color: #f3f4f6; padding: 4px 6px; border-radius: 3px;">
            ${activity.notes}
          </p>
        ` : ''}
        <div style="font-size: 11px; margin-top: 8px; text-align: center; color: #6b7280;">
          Clicca per maggiori dettagli
        </div>
      </div>
    `);

    // Crea e aggiungi il marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([coordinates.x, coordinates.y])
      .setPopup(popup)
      .addTo(map.current);

    // Aggiungi handler per il click se fornito
    if (onMarkerClick) {
      el.addEventListener('click', () => {
        onMarkerClick(activity);
      });
    }

    // Memorizza il riferimento al marker
    markers.current.push(marker);
  };

  // Funzione per ottimizzare il percorso
  const optimizeRoute = async () => {
    if (!map.current || markers.current.length < 2) return;

    setIsOptimizingRoute(true);

    try {
      // Raccogli le coordinate di tutti i marker
      const coordinates = markers.current.map(marker => {
        const lngLat = marker.getLngLat();
        return [lngLat.lng, lngLat.lat];
      });

      // Crea la stringa di coordinate per l'API Directions
      const coordinatesString = coordinates.map(coord => coord.join(',')).join(';');

      // Chiama l'API Directions di Mapbox
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatesString}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Directions request failed');
      }

      const data = await response.json();

      // Rimuovi eventuali layer e source esistenti
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

      // Aggiungi il percorso alla mappa
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: data.routes[0].geometry
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  // Funzione per attivare/disattivare la modalità fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);

    // Ridimensiona la mappa dopo il cambio di dimensione
    setTimeout(() => {
      if (map.current) {
        map.current.resize();

        // Se ci sono marker, adatta la mappa per mostrarli tutti
        if (markers.current.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          markers.current.forEach(marker => {
            bounds.extend(marker.getLngLat());
          });
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          });
        }
      }
    }, 100);
  };

  return (
    <TooltipProvider>
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
        <div
          ref={mapContainer}
          style={{
            height: isFullscreen ? 'calc(100% - 50px)' : height,
            width: '100%',
            borderRadius: '0.375rem',
            minWidth: '300px' // Assicura una larghezza minima
          }}
        />

        <div className="absolute top-2 right-2 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{isFullscreen ? 'Riduci mappa' : 'Espandi mappa'}</p>
            </TooltipContent>
          </Tooltip>

          {markers.current.length >= 2 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={optimizeRoute}
                  disabled={isOptimizingRoute}
                >
                  {isOptimizingRoute ? (
                    <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Route className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">Ottimizza percorso</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Button
              variant="default"
              size="sm"
              onClick={toggleFullscreen}
            >
              Chiudi mappa
            </Button>
          </div>
        )}

        {activities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-center p-4">
              <MapPin className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-muted-foreground">Nessuna attività da visualizzare sulla mappa</p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
