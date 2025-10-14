'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { GeoJSONSource, Map as MapboxMap, MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl';
import { CalendarIcon, MapPinIcon, XIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Transportation } from '@/lib/features/transportationSlice';
import MapboxWrapper from '../map/MapboxWrapper';

const MARKER_SOURCE_ID = 'transportation-markers';
const MARKER_HALO_LAYER_ID = 'transportation-marker-halo';
const MARKER_LAYER_ID = 'transportation-marker-circle';
const MARKER_LABEL_LAYER_ID = 'transportation-marker-label';
const ROUTE_LAYER_PREFIX = 'transportation-route-';

type MarkerType = 'departure' | 'arrival' | 'stop';

type TransportationMarkerFeature = Feature<
  Point,
  {
    id: string;
    transportationId: string;
    markerType: MarkerType;
    icon?: string;
    label?: string;
  }
>;

type MarkerScreenPosition = {
  x: number;
  y: number;
  placement: 'above' | 'below';
};

type SelectedMarker = {
  featureId: string;
  transportationId: string;
  coordinates: [number, number];
  markerType: MarkerType;
  label?: string;
};

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const TRANSPORT_TYPE_META: Record<Transportation['type'], { label: string; emoji: string; chipClass: string }> = {
  flight: {
    label: 'Flight',
    emoji: '✈️',
    chipClass: 'border-sky-500/30 bg-sky-500/15 text-sky-600',
  },
  train: {
    label: 'Train',
    emoji: '🚆',
    chipClass: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600',
  },
  bus: {
    label: 'Bus',
    emoji: '🚌',
    chipClass: 'border-amber-500/30 bg-amber-500/15 text-amber-600',
  },
  car: {
    label: 'Car',
    emoji: '🚗',
    chipClass: 'border-rose-500/30 bg-rose-500/15 text-rose-600',
  },
  ferry: {
    label: 'Ferry',
    emoji: '⛴️',
    chipClass: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-600',
  },
  other: {
    label: 'Transport',
    emoji: '📍',
    chipClass: 'border-slate-500/30 bg-slate-500/15 text-slate-600',
  },
};

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersByFeatureRef = useRef<Record<string, [number, number]>>({});
  const latestFeatureCollectionRef = useRef<FeatureCollection>(EMPTY_FEATURE_COLLECTION);
  const routeIdsRef = useRef<string[]>([]);
  const previousSelectedFeatureRef = useRef<string | null>(null);
  const previousHighlightedRouteRef = useRef<string | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [markerScreenPosition, setMarkerScreenPosition] = useState<MarkerScreenPosition | null>(null);

  const validTransportations = useMemo(
    () =>
      transportations.filter((transportation) =>
        Boolean(
          transportation.departure_coordinates ||
            transportation.arrival_coordinates ||
            transportation.stops?.some((stop) =>
              typeof stop.coordinates?.x === 'number' && Number.isFinite(stop.coordinates.x) &&
              typeof stop.coordinates?.y === 'number' && Number.isFinite(stop.coordinates.y)
            )
        )
      ),
    [transportations]
  );

  const selectedTransportation = useMemo(() => {
    if (!selectedMarker) return null;
    return validTransportations.find((item) => item.id === selectedMarker.transportationId) ?? null;
  }, [selectedMarker, validTransportations]);

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
            'match',
            ['get', 'markerType'],
            'stop',
            ['case', ['boolean', ['feature-state', 'selected'], false], 16, 13],
            ['case', ['boolean', ['feature-state', 'selected'], false], 22, 18],
          ],
          'circle-color': [
            'match',
            ['get', 'markerType'],
            'departure', 'rgba(37, 99, 235, 0.20)',
            'arrival', 'rgba(34, 197, 94, 0.20)',
            'stop', 'rgba(249, 115, 22, 0.18)',
            'rgba(148, 163, 184, 0.18)',
          ],
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.55,
            0.28,
          ],
          'circle-blur': 0.45,
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
            'match',
            ['get', 'markerType'],
            'stop',
            ['case', ['boolean', ['feature-state', 'selected'], false], 7.5, 5.5],
            ['case', ['boolean', ['feature-state', 'selected'], false], 10.5, 8],
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': [
            'match',
            ['get', 'markerType'],
            'departure', '#2563eb',
            'arrival', '#22c55e',
            'stop', '#f97316',
            '#1f2937',
          ],
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
          'text-field': ['coalesce', ['get', 'icon'], '•'],
          'text-size': 14,
          'text-anchor': 'top',
          'text-offset': [0, 0.7],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': [
            'match',
            ['get', 'markerType'],
            'departure', '#1d4ed8',
            'arrival', '#047857',
            'stop', '#b45309',
            '#1f2937',
          ],
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.4,
        },
      });
    }
  }, []);

  const updateMarkerOverlayPosition = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !selectedMarker) {
      setMarkerScreenPosition(null);
      return;
    }

    const coordinates = markersByFeatureRef.current[selectedMarker.featureId] ?? selectedMarker.coordinates;
    const point = mapInstance.project(coordinates);
    const container = mapInstance.getContainer();
    const padding = 40;

    const clampedX = Math.min(container.clientWidth - padding, Math.max(padding, point.x));
    const clampedY = Math.min(container.clientHeight - padding, Math.max(padding, point.y));
    const placement: MarkerScreenPosition['placement'] =
      point.y < container.clientHeight / 2 ? 'below' : 'above';

    setMarkerScreenPosition({ x: clampedX, y: clampedY, placement });
  }, [selectedMarker]);

  const syncSelectedFeatureState = useCallback(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !mapLoaded) return;

    if (previousSelectedFeatureRef.current && previousSelectedFeatureRef.current !== selectedMarker?.featureId) {
      mapInstance.setFeatureState(
        { source: MARKER_SOURCE_ID, id: previousSelectedFeatureRef.current },
        { selected: false }
      );
    }

    if (!selectedMarker) {
      if (previousSelectedFeatureRef.current) {
        mapInstance.setFeatureState(
          { source: MARKER_SOURCE_ID, id: previousSelectedFeatureRef.current },
          { selected: false }
        );
        previousSelectedFeatureRef.current = null;
      }

      if (previousHighlightedRouteRef.current && mapInstance.getLayer(previousHighlightedRouteRef.current)) {
        mapInstance.setPaintProperty(previousHighlightedRouteRef.current, 'line-width', 3);
        mapInstance.setPaintProperty(previousHighlightedRouteRef.current, 'line-opacity', 0.85);
      }
      previousHighlightedRouteRef.current = null;
      return;
    }

    mapInstance.setFeatureState(
      { source: MARKER_SOURCE_ID, id: selectedMarker.featureId },
      { selected: true }
    );
    previousSelectedFeatureRef.current = selectedMarker.featureId;

    const currentRouteId = `${ROUTE_LAYER_PREFIX}${selectedMarker.transportationId}`;
    if (previousHighlightedRouteRef.current && previousHighlightedRouteRef.current !== currentRouteId) {
      if (mapInstance.getLayer(previousHighlightedRouteRef.current)) {
        mapInstance.setPaintProperty(previousHighlightedRouteRef.current, 'line-width', 3);
        mapInstance.setPaintProperty(previousHighlightedRouteRef.current, 'line-opacity', 0.85);
      }
    }

    if (mapInstance.getLayer(currentRouteId)) {
      mapInstance.setPaintProperty(currentRouteId, 'line-width', 3.8);
      mapInstance.setPaintProperty(currentRouteId, 'line-opacity', 1);
      previousHighlightedRouteRef.current = currentRouteId;
    } else {
      previousHighlightedRouteRef.current = null;
    }
  }, [mapLoaded, selectedMarker]);

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
      rebuildRoutes(mapInstance, validTransportations, routeIdsRef);
      syncSelectedFeatureState();
      updateMarkerOverlayPosition();
    };

    mapInstance.on('styledata', handleStyleData);
    return () => {
      mapInstance.off('styledata', handleStyleData);
    };
  }, [
    ensureMarkerLayers,
    mapLoaded,
    syncSelectedFeatureState,
    updateMarkerOverlayPosition,
    validTransportations,
  ]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const mapInstance = mapRef.current;
    ensureMarkerLayers(mapInstance);

    const markerSource = mapInstance.getSource(MARKER_SOURCE_ID) as GeoJSONSource | undefined;
    if (!markerSource) return;

    markersByFeatureRef.current = {};

    const features: TransportationMarkerFeature[] = [];

    routeIdsRef.current.forEach((routeId) => {
      if (mapInstance.getLayer(routeId)) {
        mapInstance.removeLayer(routeId);
      }
      if (mapInstance.getSource(routeId)) {
        mapInstance.removeSource(routeId);
      }
    });
    routeIdsRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasBounds = false;

    validTransportations.forEach((transportation) => {
    const pushFeature = (
      markerType: MarkerType,
      coordinates: [number, number],
      options: { idSuffix: string; label?: string; stopIndex?: number }
    ) => {
      const featureId = `${transportation.id}-${options.idSuffix}`;

      markersByFeatureRef.current[featureId] = coordinates;

      features.push({
          type: 'Feature',
          id: featureId,
          geometry: {
            type: 'Point',
            coordinates,
          },
          properties: {
            id: featureId,
            transportationId: transportation.id,
            markerType,
            icon: getMarkerIcon(markerType, transportation.type, options.stopIndex),
            label: options.label,
          },
        });

        bounds.extend(coordinates);
        hasBounds = true;
      };

      if (transportation.departure_coordinates) {
        const coords: [number, number] = [
          transportation.departure_coordinates.x,
          transportation.departure_coordinates.y,
        ];
        pushFeature('departure', coords, {
          idSuffix: 'departure',
          label: transportation.departure_location ?? 'Departure',
        });
      }

      if (transportation.arrival_coordinates) {
        const coords: [number, number] = [
          transportation.arrival_coordinates.x,
          transportation.arrival_coordinates.y,
        ];
        pushFeature('arrival', coords, {
          idSuffix: 'arrival',
          label: transportation.arrival_location ?? 'Arrival',
        });
      }

      transportation.stops?.forEach((stop, index) => {
        if (typeof stop.coordinates?.x === 'number' && typeof stop.coordinates?.y === 'number') {
          const coords: [number, number] = [stop.coordinates.x, stop.coordinates.y];
          pushFeature('stop', coords, {
            idSuffix: `stop-${stop.id ?? index}`,
            stopIndex: index,
            label: stop.location ?? `Stop ${index + 1}`,
          });
        }
      });

      if (
        transportation.departure_coordinates &&
        transportation.arrival_coordinates &&
        (transportation.departure_coordinates.x !== transportation.arrival_coordinates.x ||
          transportation.departure_coordinates.y !== transportation.arrival_coordinates.y)
      ) {
        const routeId = `${ROUTE_LAYER_PREFIX}${transportation.id}`;

        mapInstance.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [
                  transportation.departure_coordinates.x,
                  transportation.departure_coordinates.y,
                ],
                [
                  transportation.arrival_coordinates.x,
                  transportation.arrival_coordinates.y,
                ],
              ],
            },
          },
        });

        mapInstance.addLayer(
          {
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': getRouteColor(transportation.type),
              'line-width': 3,
              'line-opacity': 0.85,
              'line-dasharray': [1.1, 1],
            },
          },
          MARKER_HALO_LAYER_ID
        );

        routeIdsRef.current.push(routeId);
      }
    });

    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    latestFeatureCollectionRef.current = collection;
    markerSource.setData(collection);

    if (hasBounds && !bounds.isEmpty()) {
      mapInstance.fitBounds(bounds, {
        padding: 70,
        maxZoom: 13.5,
      });
    }

    if (selectedMarker) {
      const updated = markersByFeatureRef.current[selectedMarker.featureId];
      if (!updated) {
        setSelectedMarker(null);
      } else if (
        updated[0] !== selectedMarker.coordinates[0] ||
        updated[1] !== selectedMarker.coordinates[1]
      ) {
        setSelectedMarker((prev) => (prev ? { ...prev, coordinates: updated } : prev));
      }
    }

    syncSelectedFeatureState();
    updateMarkerOverlayPosition();
  }, [
    ensureMarkerLayers,
    mapLoaded,
    selectedMarker,
    syncSelectedFeatureState,
    updateMarkerOverlayPosition,
    validTransportations,
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

      const featureId = (feature.properties?.id || feature.id) as string | undefined;
      const transportationId = feature.properties?.transportationId as string | undefined;
      const markerType = feature.properties?.markerType as MarkerType | undefined;

      if (!featureId || !transportationId || !markerType) return;

      const coordinates = markersByFeatureRef.current[featureId];
      if (!coordinates) return;

      setSelectedMarker({
        featureId,
        transportationId,
        markerType,
        coordinates,
        label: feature.properties?.label as string | undefined,
      });
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
        setSelectedMarker(null);
      }
    };

    mapInstance.on('click', handleBackgroundClick);
    return () => {
      mapInstance.off('click', handleBackgroundClick);
    };
  }, [mapLoaded]);

  useEffect(() => {
    syncSelectedFeatureState();
    updateMarkerOverlayPosition();
  }, [selectedMarker, syncSelectedFeatureState, updateMarkerOverlayPosition]);

  const handleOpenDetails = useCallback(() => {
    if (selectedTransportation && onMarkerClick) {
      onMarkerClick(selectedTransportation);
    }
  }, [onMarkerClick, selectedTransportation]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className="overflow-hidden rounded-2xl border border-border/60"
        style={{ height, width: '100%' }}
      />

      {validTransportations.length > 0 && (
        <div className="pointer-events-none absolute right-4 top-4 hidden flex-col items-end gap-2 sm:right-6 sm:top-6 sm:flex">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-background/90 px-4 py-2 text-sm font-semibold text-sky-600 shadow-lg shadow-black/10 backdrop-blur">
            <MapPinIcon className="h-4 w-4 text-sky-500" />
            <span>{validTransportations.length}</span>
            <span className="text-muted-foreground">
              {validTransportations.length === 1 ? 'mapped journey' : 'mapped journeys'}
            </span>
          </div>
        </div>
      )}

      {selectedTransportation && selectedMarker && markerScreenPosition && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="pointer-events-auto absolute"
            style={{ left: markerScreenPosition.x, top: markerScreenPosition.y }}
          >
            <div
              className="relative w-[280px] max-w-sm rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl"
              style={{
                transform:
                  markerScreenPosition.placement === 'above'
                    ? 'translate(-50%, calc(-100% - 22px))'
                    : 'translate(-50%, 24px)',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedMarker(null)}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground transition hover:text-foreground"
                aria-label="Close transportation preview"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>

              <div className="pr-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-lg">
                    <span>{TRANSPORT_TYPE_META[selectedTransportation.type].emoji}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedTransportation.provider ?? TRANSPORT_TYPE_META[selectedTransportation.type].label}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TRANSPORT_TYPE_META[selectedTransportation.type].chipClass}`}
                    >
                      {TRANSPORT_TYPE_META[selectedTransportation.type].label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 text-sky-500" />
                  <span className="leading-relaxed">
                    {selectedTransportation.departure_location ?? 'Departure TBD'}
                    {' → '}
                    {selectedTransportation.arrival_location ?? 'Arrival TBD'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground">
                  {renderDateRow('Departure', selectedTransportation.departure_time, 'text-sky-600')}
                  {renderDateRow('Arrival', selectedTransportation.arrival_time, 'text-emerald-600')}
                </div>
              </div>

              {selectedMarker.markerType === 'stop' && selectedMarker.label && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600">
                  Stop: {selectedMarker.label}
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenDetails}
                className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-600 transition hover:bg-sky-500/20"
              >
                View transportation
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

      {!selectedMarker && validTransportations.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-background/85 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/10 backdrop-blur">
          Tap a marker to preview transportation details
        </div>
      )}
    </div>
  );
}

function renderDateRow(label: string, value: string | null | undefined, accentClass: string) {
  const formatted = safeFormatDateTime(value);
  if (!formatted) return null;

  return (
    <div className="flex items-center gap-2">
      <CalendarIcon className={`h-3.5 w-3.5 ${accentClass}`} />
      <span className="font-semibold text-foreground">
        {formatted}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{label}</span>
    </div>
  );
}

function safeFormatDateTime(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return format(parsed, 'MMM d, HH:mm');
  } catch {
    return null;
  }
}

function getRouteColor(type: Transportation['type']) {
  switch (type) {
    case 'flight':
      return '#3B82F6';
    case 'train':
      return '#10B981';
    case 'bus':
      return '#F59E0B';
    case 'car':
      return '#EF4444';
    case 'ferry':
      return '#6366F1';
    default:
      return '#6B7280';
  }
}

function rebuildRoutes(
  mapInstance: MapboxMap,
  transportations: Transportation[],
  routeIdsRef: MutableRefObject<string[]>
) {
  routeIdsRef.current.forEach((routeId) => {
    if (mapInstance.getLayer(routeId)) {
      mapInstance.removeLayer(routeId);
    }
    if (mapInstance.getSource(routeId)) {
      mapInstance.removeSource(routeId);
    }
  });

  routeIdsRef.current = [];

  transportations.forEach((transportation) => {
    if (
      transportation.departure_coordinates &&
      transportation.arrival_coordinates &&
      (transportation.departure_coordinates.x !== transportation.arrival_coordinates.x ||
        transportation.departure_coordinates.y !== transportation.arrival_coordinates.y)
    ) {
      const routeId = `${ROUTE_LAYER_PREFIX}${transportation.id}`;

      mapInstance.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [
                transportation.departure_coordinates.x,
                transportation.departure_coordinates.y,
              ],
              [
                transportation.arrival_coordinates.x,
                transportation.arrival_coordinates.y,
              ],
            ],
          },
        },
      });

      mapInstance.addLayer(
        {
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': getRouteColor(transportation.type),
            'line-width': 3,
            'line-opacity': 0.85,
            'line-dasharray': [1.1, 1],
          },
        },
        MARKER_HALO_LAYER_ID
      );

      routeIdsRef.current.push(routeId);
    }
  });
}

function getMarkerIcon(
  markerType: MarkerType,
  transportationType: Transportation['type'],
  stopIndex?: number
) {
  if (markerType === 'stop') {
    return typeof stopIndex === 'number' ? `${stopIndex + 1}` : '•';
  }

  const meta = TRANSPORT_TYPE_META[transportationType];

  if (markerType === 'departure') {
    return transportationType === 'flight' ? '🛫' : meta.emoji;
  }

  if (markerType === 'arrival') {
    return transportationType === 'flight' ? '🛬' : meta.emoji;
  }

  return meta.emoji;
}
