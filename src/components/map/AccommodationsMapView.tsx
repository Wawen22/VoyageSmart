'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MapboxMap, MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';
import { Building2Icon, CalendarIcon, MapPinIcon, XIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Accommodation } from '@/lib/features/accommodationSlice';
import MapboxWrapper from './MapboxWrapper';

const MARKER_SOURCE_ID = 'accommodations-markers';
const MARKER_HALO_LAYER_ID = 'accommodations-marker-halo';
const MARKER_LAYER_ID = 'accommodations-marker-circle';
const MARKER_LABEL_LAYER_ID = 'accommodations-marker-label';

type MarkerScreenPosition = {
  x: number;
  y: number;
  placement: 'above' | 'below';
};

type AccommodationFeature = Feature<
  Point,
  {
    id: string;
    name: string;
    address?: string;
  }
>;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersByIdRef = useRef<Record<string, [number, number]>>({});
  const latestFeatureCollectionRef = useRef<FeatureCollection>(EMPTY_FEATURE_COLLECTION);
  const previousSelectedRef = useRef<string | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<string | null>(null);
  const [markerScreenPosition, setMarkerScreenPosition] = useState<MarkerScreenPosition | null>(null);

  const validAccommodations = useMemo(
    () =>
      accommodations.filter(
        (accommodation) =>
          typeof accommodation.coordinates?.x === 'number' &&
          Number.isFinite(accommodation.coordinates.x) &&
          typeof accommodation.coordinates?.y === 'number' &&
          Number.isFinite(accommodation.coordinates.y)
      ),
    [accommodations]
  );

  const selectedAccommodation = useMemo(() => {
    if (!selectedAccommodationId) return null;
    return validAccommodations.find((item) => item.id === selectedAccommodationId) ?? null;
  }, [selectedAccommodationId, validAccommodations]);

  const ensureMarkerLayers = useCallback((mapInstance: MapboxMap) => {
    if (!mapInstance.getSource(MARKER_SOURCE_ID)) {
      mapInstance.addSource(MARKER_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      });
    }

    if (!mapInstance.getLayer(MARKER_HALO_LAYER_ID)) {
      mapInstance.addLayer({
        id: MARKER_HALO_LAYER_ID,
        type: 'circle',
        source: MARKER_SOURCE_ID,
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            20,
            16,
          ],
          'circle-color': 'rgba(16, 185, 129, 0.16)',
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.45,
            0.22,
          ],
          'circle-blur': 0.55,
        },
      });
    }

    if (!mapInstance.getLayer(MARKER_LAYER_ID)) {
      mapInstance.addLayer({
        id: MARKER_LAYER_ID,
        type: 'circle',
        source: MARKER_SOURCE_ID,
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            10,
            7.5,
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': '#10b981',
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            3.2,
            2.2,
          ],
          'circle-translate': [0, -2],
        },
      });
    }

    if (!mapInstance.getLayer(MARKER_LABEL_LAYER_ID)) {
      mapInstance.addLayer({
        id: MARKER_LABEL_LAYER_ID,
        type: 'symbol',
        source: MARKER_SOURCE_ID,
        layout: {
          'text-field': '🏨',
          'text-size': 18,
          'text-anchor': 'top',
          'text-offset': [0, 0.75],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#047857',
            '#0f172a',
          ],
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.6,
        },
      });
    }
  }, []);

  const updateMarkerOverlayPosition = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !selectedAccommodationId) {
      setMarkerScreenPosition(null);
      return;
    }

    const coordinates = markersByIdRef.current[selectedAccommodationId];
    if (!coordinates) {
      setMarkerScreenPosition(null);
      return;
    }

    const point = mapInstance.project(coordinates);
    const container = mapInstance.getContainer();
    const padding = 36;

    const clampedX = Math.min(container.clientWidth - padding, Math.max(padding, point.x));
    const clampedY = Math.min(container.clientHeight - padding, Math.max(padding, point.y));
    const placement: MarkerScreenPosition['placement'] =
      point.y < container.clientHeight / 2 ? 'below' : 'above';

    setMarkerScreenPosition({ x: clampedX, y: clampedY, placement });
  }, [selectedAccommodationId]);

  const syncSelectedFeatureState = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !mapLoaded) return;

    if (previousSelectedRef.current && previousSelectedRef.current !== selectedAccommodationId) {
      mapInstance.setFeatureState(
        { source: MARKER_SOURCE_ID, id: previousSelectedRef.current },
        { selected: false }
      );
    }

    if (!selectedAccommodationId) {
      if (previousSelectedRef.current) {
        mapInstance.setFeatureState(
          { source: MARKER_SOURCE_ID, id: previousSelectedRef.current },
          { selected: false }
        );
        previousSelectedRef.current = null;
      }
      return;
    }

    mapInstance.setFeatureState(
      { source: MARKER_SOURCE_ID, id: selectedAccommodationId },
      { selected: true }
    );
    previousSelectedRef.current = selectedAccommodationId;
  }, [mapLoaded, selectedAccommodationId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [12.4964, 41.9028],
      zoom: 2,
    });

    mapRef.current = mapInstance as MapboxMap;
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapInstance.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      mapRef.current = null;
    };
  }, [mapboxgl]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;
    ensureMarkerLayers(mapInstance);

    const handleStyleData = () => {
      ensureMarkerLayers(mapInstance);
      const markerSource = mapInstance.getSource(MARKER_SOURCE_ID) as GeoJSONSource | undefined;
      if (markerSource) {
        markerSource.setData(latestFeatureCollectionRef.current);
      }
      syncSelectedFeatureState();
      updateMarkerOverlayPosition();
    };

    mapInstance.on('styledata', handleStyleData);
    return () => {
      mapInstance.off('styledata', handleStyleData);
    };
  }, [ensureMarkerLayers, mapLoaded, syncSelectedFeatureState, updateMarkerOverlayPosition]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;
    ensureMarkerLayers(mapInstance);

    const markerSource = mapInstance.getSource(MARKER_SOURCE_ID) as GeoJSONSource | undefined;
    if (!markerSource) return;

    const markersById: Record<string, [number, number]> = {};
    const features: AccommodationFeature[] = validAccommodations.map((accommodation) => {
      const coordinates: [number, number] = [
        accommodation.coordinates!.x,
        accommodation.coordinates!.y,
      ];

      markersById[accommodation.id] = coordinates;

      return {
        type: 'Feature',
        id: accommodation.id,
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: {
          id: accommodation.id,
          name: accommodation.name,
          address: accommodation.address ?? '',
        },
      };
    });

    markersByIdRef.current = markersById;
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    latestFeatureCollectionRef.current = collection;
    markerSource.setData(collection);

    if (features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach((feature) => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });

      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, {
          padding: 60,
          maxZoom: 14.5,
        });
      }
    }

    if (selectedAccommodationId && !markersById[selectedAccommodationId]) {
      setSelectedAccommodationId(null);
    } else {
      syncSelectedFeatureState();
      updateMarkerOverlayPosition();
    }
  }, [
    ensureMarkerLayers,
    mapLoaded,
    selectedAccommodationId,
    syncSelectedFeatureState,
    updateMarkerOverlayPosition,
    validAccommodations,
  ]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;
    const reposition = () => updateMarkerOverlayPosition();

    mapInstance.on('move', reposition);
    mapInstance.on('zoom', reposition);
    mapInstance.on('pitch', reposition);
    mapInstance.on('rotate', reposition);
    mapInstance.on('resize', reposition);

    return () => {
      mapInstance.off('move', reposition);
      mapInstance.off('zoom', reposition);
      mapInstance.off('pitch', reposition);
      mapInstance.off('rotate', reposition);
      mapInstance.off('resize', reposition);
    };
  }, [mapLoaded, updateMarkerOverlayPosition]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;

    const handleMarkerClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const accommodationId = (feature.properties?.id || feature.id) as string | undefined;
      if (!accommodationId) return;

      setSelectedAccommodationId(accommodationId);
    };

    const handleMarkerMouseEnter = () => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    };

    const handleMarkerMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
    };

    mapInstance.on('click', MARKER_LAYER_ID, handleMarkerClick);
    mapInstance.on('click', MARKER_LABEL_LAYER_ID, handleMarkerClick);
    mapInstance.on('mouseenter', MARKER_LAYER_ID, handleMarkerMouseEnter);
    mapInstance.on('mouseleave', MARKER_LAYER_ID, handleMarkerMouseLeave);
    mapInstance.on('mouseenter', MARKER_LABEL_LAYER_ID, handleMarkerMouseEnter);
    mapInstance.on('mouseleave', MARKER_LABEL_LAYER_ID, handleMarkerMouseLeave);

    return () => {
      mapInstance.off('click', MARKER_LAYER_ID, handleMarkerClick);
      mapInstance.off('click', MARKER_LABEL_LAYER_ID, handleMarkerClick);
      mapInstance.off('mouseenter', MARKER_LAYER_ID, handleMarkerMouseEnter);
      mapInstance.off('mouseleave', MARKER_LAYER_ID, handleMarkerMouseLeave);
      mapInstance.off('mouseenter', MARKER_LABEL_LAYER_ID, handleMarkerMouseEnter);
      mapInstance.off('mouseleave', MARKER_LABEL_LAYER_ID, handleMarkerMouseLeave);
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;

    const handleBackgroundClick = (event: MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(event.point, {
        layers: [MARKER_LAYER_ID, MARKER_LABEL_LAYER_ID],
      });

      if (features.length === 0) {
        setSelectedAccommodationId(null);
      }
    };

    mapInstance.on('click', handleBackgroundClick);
    return () => {
      mapInstance.off('click', handleBackgroundClick);
    };
  }, [mapLoaded]);

  useEffect(() => {
    updateMarkerOverlayPosition();
    syncSelectedFeatureState();
  }, [selectedAccommodationId, syncSelectedFeatureState, updateMarkerOverlayPosition]);

  const handleOpenDetails = useCallback(() => {
    if (selectedAccommodation && onMarkerClick) {
      onMarkerClick(selectedAccommodation);
    }
  }, [onMarkerClick, selectedAccommodation]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className="overflow-hidden rounded-2xl border border-border/60"
        style={{ height, width: '100%' }}
      />

      {validAccommodations.length > 0 && (
        <div className="pointer-events-none absolute right-4 top-4 hidden flex-col items-end gap-2 sm:right-6 sm:top-6 sm:flex">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-background/90 px-4 py-2 text-sm font-semibold text-emerald-600 shadow-lg shadow-black/10 backdrop-blur">
            <MapPinIcon className="h-4 w-4 text-emerald-500" />
            <span>{validAccommodations.length}</span>
            <span className="text-muted-foreground">
              {validAccommodations.length === 1 ? 'mapped stay' : 'mapped stays'}
            </span>
          </div>
        </div>
      )}

      {selectedAccommodation && markerScreenPosition && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="pointer-events-auto absolute"
            style={{ left: markerScreenPosition.x, top: markerScreenPosition.y }}
          >
            <div
              className="relative w-[260px] max-w-xs rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl"
              style={{
                transform:
                  markerScreenPosition.placement === 'above'
                    ? 'translate(-50%, calc(-100% - 22px))'
                    : 'translate(-50%, 24px)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedAccommodationId(null)}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground transition hover:text-foreground"
                aria-label="Close accommodation preview"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>

              <div className="pr-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15">
                    <Building2Icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedAccommodation.name}</p>
                    {selectedAccommodation.type && (
                      <span className="mt-1 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                        {selectedAccommodation.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedAccommodation.address && (
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 text-emerald-500" />
                  <span className="leading-relaxed">{selectedAccommodation.address}</span>
                </div>
              )}

              {renderStayDates(selectedAccommodation)}

              <button
                type="button"
                onClick={handleOpenDetails}
                className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20"
              >
                View details
              </button>

              <span
                className="pointer-events-none absolute h-3 w-3 border border-border/70 bg-background/95"
                style={
                  markerScreenPosition.placement === 'above'
                    ? {
                        top: '100%',
                        left: '50%',
                        transform: 'translate(-50%, -60%) rotate(45deg)',
                      }
                    : {
                        bottom: '100%',
                        left: '50%',
                        transform: 'translate(-50%, 60%) rotate(45deg)',
                      }
                }
              />
            </div>
          </div>
        </div>
      )}

      {!selectedAccommodation && validAccommodations.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-background/85 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/10 backdrop-blur">
          Tap a marker to preview accommodation details
        </div>
      )}
    </div>
  );
}

function renderStayDates(accommodation: Accommodation) {
  const checkIn = safeFormatDate(accommodation.check_in_date);
  const checkOut = safeFormatDate(accommodation.check_out_date);

  if (!checkIn && !checkOut) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-2 text-foreground">
        <CalendarIcon className="h-3.5 w-3.5 text-emerald-500" />
        <span className="font-semibold text-xs text-foreground">
          {checkIn && checkOut ? `${checkIn} → ${checkOut}` : checkIn ?? checkOut}
        </span>
      </div>
      {checkIn && checkOut && (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
          Stay duration
        </p>
      )}
    </div>
  );
}

function safeFormatDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return format(parsed, 'PPP');
  } catch (error) {
    return null;
  }
}
