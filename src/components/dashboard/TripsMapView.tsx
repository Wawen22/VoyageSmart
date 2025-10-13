'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapboxWrapper from "@/components/map/MapboxWrapper";
import Link from "next/link";
import type { FeatureCollection, Point } from "geojson";
import type { Destination, TripDestinations } from "@/lib/types/destination";
import { cn, formatCurrency } from "@/lib/utils";
import { logger } from "@/lib/logger";
import {
  ArrowUpRightIcon,
  CompassIcon,
  MapPinIcon,
  MaximizeIcon,
  MinimizeIcon,
  RotateCcwIcon,
  XIcon
} from "lucide-react";

const DEFAULT_CENTER: [number, number] = [12.4964, 41.9028];
const DEFAULT_ZOOM = 2.1;

type TripStatus = "upcoming" | "ongoing" | "completed" | "planning";

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  budget_total: number | null;
  created_at: string;
  preferences?: {
    currency?: string;
    destinations?: TripDestinations;
  };
};

type TripFilter = "all" | "upcoming" | "ongoing" | "past";

interface Coordinates {
  lat: number;
  lng: number;
}

interface ProcessedTrip extends Trip {
  status: TripStatus;
  coordinates?: Coordinates;
  primaryDestination?: string;
  labelCandidates: string[];
  needsGeocode: boolean;
}

interface TripMarker extends ProcessedTrip {
  coordinates: Coordinates;
}

const STATUS_META: Record<
  TripStatus,
  {
    label: string;
    emoji: string;
    markerColor: string;
    gradient: string;
    chipClass: string;
    textClass: string;
    glow: string;
  }
> = {
  upcoming: {
    label: "Upcoming",
    emoji: "🟢",
    markerColor: "#10b981",
    gradient: "linear-gradient(135deg, #34d399 0%, #047857 100%)",
    chipClass: "bg-emerald-500/15 text-emerald-300",
    textClass: "text-emerald-400",
    glow: "0 16px 32px rgba(16, 185, 129, 0.35)"
  },
  ongoing: {
    label: "Ongoing",
    emoji: "🧭",
    markerColor: "#f97316",
    gradient: "linear-gradient(135deg, #fb923c 0%, #c2410c 100%)",
    chipClass: "bg-orange-500/15 text-orange-300",
    textClass: "text-orange-400",
    glow: "0 16px 32px rgba(249, 115, 22, 0.35)"
  },
  completed: {
    label: "Completed",
    emoji: "✨",
    markerColor: "#a855f7",
    gradient: "linear-gradient(135deg, #c084fc 0%, #7c3aed 100%)",
    chipClass: "bg-purple-500/15 text-purple-300",
    textClass: "text-purple-400",
    glow: "0 16px 32px rgba(168, 85, 247, 0.35)"
  },
  planning: {
    label: "Planning",
    emoji: "🛠️",
    markerColor: "#0ea5e9",
    gradient: "linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)",
    chipClass: "bg-sky-500/15 text-sky-300",
    textClass: "text-sky-400",
    glow: "0 16px 32px rgba(14, 165, 233, 0.35)"
  }
};

const MAP_STYLE_OPTIONS = [
  { id: "streets-v12", emoji: "🗺️", label: "Streets" },
  { id: "outdoors-v12", emoji: "🏔️", label: "Outdoors" },
  { id: "satellite-v9", emoji: "🛰️", label: "Satellite" },
  { id: "dark-v11", emoji: "🌌", label: "Midnight" }
];

type MapboxGL = typeof import("mapbox-gl");

const labelCoordinateCache = new Map<string, Coordinates>();

const MARKER_SOURCE_ID = "trip-markers";
const MARKER_LAYER_ID = "trip-markers-points";
const MARKER_HALO_LAYER_ID = "trip-markers-halo";
const MARKER_RING_LAYER_ID = "trip-markers-ring";
const MARKER_LABEL_LAYER_ID = "trip-markers-label";
const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: []
} as const;

const formatCacheKey = (label: string) => label.trim().toLowerCase();

function normalizeCoordinates(
  input?: { lat?: number | string | null; lng?: number | string | null } | null
): Coordinates | undefined {
  if (!input) return undefined;

  const latValue =
    typeof input.lat === "string" ? parseFloat(input.lat) : input.lat;
  const lngValue =
    typeof input.lng === "string" ? parseFloat(input.lng) : input.lng;

  if (typeof latValue !== "number" || !Number.isFinite(latValue)) {
    return undefined;
  }
  if (typeof lngValue !== "number" || !Number.isFinite(lngValue)) {
    return undefined;
  }

  if (latValue < -90 || latValue > 90 || lngValue < -180 || lngValue > 180) {
    return undefined;
  }

  if (latValue === 0 && lngValue === 0) {
    return undefined;
  }

  return { lat: latValue, lng: lngValue };
}

function cacheCoordinates(
  coords: Coordinates,
  ...labels: Array<string | undefined | null>
) {
  const normalized = normalizeCoordinates(coords);
  if (!normalized) return;

  labels.forEach((label) => {
    if (!label) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    labelCoordinateCache.set(formatCacheKey(trimmed), normalized);
  });
}

function getCachedCoordinates(
  ...labels: Array<string | undefined | null>
): Coordinates | undefined {
  for (const label of labels) {
    if (!label) continue;
    const trimmed = label.trim();
    if (!trimmed) continue;
    const cached = labelCoordinateCache.get(formatCacheKey(trimmed));
    if (!cached) continue;
    const normalized = normalizeCoordinates(cached);
    if (normalized) return normalized;
    labelCoordinateCache.delete(formatCacheKey(trimmed));
  }
  return undefined;
}

function deriveStatus(trip: Trip, reference: Date): TripStatus {
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    if (reference < start) return "upcoming";
    if (reference >= start && reference <= end) return "ongoing";
    return "completed";
  }

  if (trip.start_date) {
    const start = new Date(trip.start_date);
    return reference < start ? "upcoming" : "planning";
  }

  return "planning";
}

function sanitizeDestinations(source?: TripDestinations): Destination[] {
  if (!source?.destinations || !Array.isArray(source.destinations)) {
    return [];
  }

  return source.destinations.filter(
    (item): item is Destination =>
      Boolean(item) && typeof item.name === "string" && item.name.trim().length
  );
}

function derivePrimaryDestination(
  trip: Trip
): {
  primaryDestination?: string;
  coordinates?: Coordinates;
  labelCandidates: string[];
  needsGeocode: boolean;
} {
  const destinations = sanitizeDestinations(trip.preferences?.destinations);
  const preferredId = trip.preferences?.destinations?.primary;
  const preferred = preferredId
    ? destinations.find((destination) => destination.id === preferredId)
    : undefined;

  const preferredWithCoordinates = preferred
    ? normalizeCoordinates(preferred.coordinates)
    : undefined;

  const firstWithCoordinates = destinations.find((destination) =>
    Boolean(normalizeCoordinates(destination.coordinates))
  );

  const selectedDestination =
    (preferredWithCoordinates && preferred) ?? firstWithCoordinates ?? preferred ?? destinations[0];

  const primaryDestination =
    selectedDestination?.name ?? trip.destination ?? undefined;

  const coordinates = normalizeCoordinates(selectedDestination?.coordinates);

  const labelCandidates = new Set<string>();
  if (primaryDestination) labelCandidates.add(primaryDestination);
  if (trip.destination) labelCandidates.add(trip.destination);
  destinations.forEach((destination) => {
    if (destination?.name) {
      labelCandidates.add(destination.name);
    }
  });

  return {
    primaryDestination,
    coordinates,
    labelCandidates: Array.from(labelCandidates),
    needsGeocode: !coordinates && labelCandidates.size > 0
  };
}

function matchesTripFilter(
  trip: ProcessedTrip,
  filter: TripFilter,
  searchTerm: string
): boolean {
  if (filter === "upcoming" && trip.status !== "upcoming") return false;
  if (filter === "ongoing" && trip.status !== "ongoing") return false;
  if (filter === "past" && trip.status !== "completed") return false;

  if (!searchTerm) return true;

  const term = searchTerm.toLowerCase();
  const haystack = [
    trip.name,
    trip.primaryDestination,
    trip.destination,
    trip.description
  ]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());

  return haystack.some((value) => value.includes(term));
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "Dates not set";

  const format = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "TBD";

  if (start && end) {
    return `${format(start)} – ${format(end)}`;
  }

  return format(start ?? end);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDestinationLabel(label: string): string {
  if (label.length <= 24) return label;
  return `${label.slice(0, 21)}…`;
}

function buildPopupContent(trip: TripMarker): string {
  const status = STATUS_META[trip.status];
  const currency = trip.preferences?.currency ?? "USD";
  const budget =
    typeof trip.budget_total === "number"
      ? formatCurrency(trip.budget_total, currency)
      : null;
  const destination =
    trip.primaryDestination ?? trip.destination ?? "Destination TBD";

  return `
    <div class="min-w-[260px] max-w-[320px] rounded-2xl bg-background/95 p-4 text-left text-foreground shadow-xl shadow-black/20">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold">${escapeHtml(trip.name)}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(destination)}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.chipClass}">
          ${status.label}
        </span>
      </div>
      <div class="mt-3 space-y-2 text-xs text-muted-foreground">
        <div>${escapeHtml(formatDateRange(trip.start_date, trip.end_date))}</div>
        ${
          budget
            ? `<div class="font-medium text-foreground">Budget: ${escapeHtml(budget)}</div>`
            : ""
        }
      </div>
      <a class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80" href="/trips/${trip.id}">
        View trip
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H4a1 1 0 110-2h10.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </a>
    </div>
  `;
}

async function geocodeDestination(
  destination: string,
  token: string
): Promise<Coordinates | null> {
  const encoded = encodeURIComponent(destination);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&language=en`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`);
  }

  const data = await response.json();
  const feature = data?.features?.[0];
  if (!feature?.center || feature.center.length < 2) {
    return null;
  }

  const [lng, lat] = feature.center;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  return { lat, lng };
}

type TripProcessingResult = {
  processedTrips: ProcessedTrip[];
  isGeocoding: boolean;
};

function useTripMarkers(trips: Trip[], token: string | null): TripProcessingResult {
  const [coordinateOverrides, setCoordinateOverrides] = useState<Record<string, Coordinates>>(
    {}
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  const processedTrips = useMemo<ProcessedTrip[]>(() => {
    const now = new Date();
    return trips.map((trip) => {
      const status = deriveStatus(trip, now);
      const derived = derivePrimaryDestination(trip);

      const overrideCoordinates = normalizeCoordinates(coordinateOverrides[trip.id]);
      const cachedCoordinates = getCachedCoordinates(...derived.labelCandidates);

      const coordinates =
        overrideCoordinates ?? derived.coordinates ?? cachedCoordinates;

      if (coordinates) {
        cacheCoordinates(
          coordinates,
          derived.primaryDestination,
          trip.destination
        );
      }

      return {
        ...trip,
        status,
        coordinates,
        primaryDestination: derived.primaryDestination,
        labelCandidates: derived.labelCandidates,
        needsGeocode: derived.needsGeocode && !coordinates
      };
    });
  }, [coordinateOverrides, trips]);

  useEffect(() => {
    if (!token) {
      if (processedTrips.some((trip) => trip.needsGeocode)) {
        logger.warn("Mapbox token missing; skipping trip geocoding.");
      }
      return;
    }

    const queue = processedTrips.filter((trip) => trip.needsGeocode);
    if (queue.length === 0) {
      setIsGeocoding(false);
      return;
    }

    let cancelled = false;
    setIsGeocoding(true);

    const geocodeSequentially = async () => {
      for (const trip of queue) {
        if (cancelled) break;

        let resolved = getCachedCoordinates(...trip.labelCandidates);
        if (!resolved) {
          const [primaryLabel] = trip.labelCandidates;
          if (!primaryLabel) continue;
          try {
            const coords = await geocodeDestination(primaryLabel, token);
            if (coords) {
              cacheCoordinates(coords, ...trip.labelCandidates);
              resolved = coords;
            }
          } catch (error) {
            logger.error("Failed to geocode trip destination", {
              destination: primaryLabel,
              error
            });
          }
        }

        if (resolved && !cancelled) {
          cacheCoordinates(resolved, ...trip.labelCandidates);
          setCoordinateOverrides((prev) => ({
            ...prev,
            [trip.id]: resolved!
          }));
        }
      }

      if (!cancelled) {
        setIsGeocoding(false);
      }
    };

    void geocodeSequentially();

    return () => {
      cancelled = true;
    };
  }, [processedTrips, token]);

  return {
    processedTrips,
    isGeocoding
  };
}

type TripsMapViewProps = {
  trips: Trip[];
  searchTerm?: string;
  filter?: TripFilter;
  onTripFocus?: (tripId: string | null) => void;
};

export default function TripsMapView({
  trips,
  searchTerm = "",
  filter = "all",
  onTripFocus
}: TripsMapViewProps) {
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  return (
    <MapboxWrapper
      fallback={
        <div className="flex h-[520px] w-full items-center justify-center rounded-3xl border border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapPinIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Preparing your map
            </h3>
            <p className="text-sm text-muted-foreground">
              Loading destinations and calibrating markers…
            </p>
          </div>
        </div>
      }
    >
      {(mapboxgl) => (
        <TripsMapCanvas
          mapboxgl={mapboxgl}
          trips={trips}
          searchTerm={searchTerm}
          filter={filter}
          mapStyle={mapStyle}
          onStyleChange={setMapStyle}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          onTripFocus={onTripFocus}
        />
      )}
    </MapboxWrapper>
  );
}

type TripsMapCanvasProps = TripsMapViewProps & {
  mapboxgl: MapboxGL;
  mapStyle: string;
  onStyleChange: (style: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

function TripsMapCanvas({
  mapboxgl,
  trips,
  searchTerm = "",
  filter = "all",
  mapStyle,
  onStyleChange,
  isFullscreen,
  onToggleFullscreen,
  onTripFocus
}: TripsMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapStyleRef = useRef(mapStyle);
  const markersDataRef = useRef<TripMarker[]>([]);
  const previousSelectedRef = useRef<string | null>(null);
  const previousMarkerIdsRef = useRef<string[]>([]);
  const shouldAutoFitRef = useRef(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [markerScreenPosition, setMarkerScreenPosition] = useState<{
    x: number;
    y: number;
    placement: "above" | "below";
  } | null>(null);
  const updateMarkerOverlayPosition = useCallback(() => {
    const map = mapRef.current;
    if (!map || !selectedTripId) {
      setMarkerScreenPosition(null);
      return;
    }

    const trip = markersDataRef.current.find(
      (item) => item.id === selectedTripId
    );
    if (!trip?.coordinates) {
      setMarkerScreenPosition(null);
      return;
    }

    const point = map.project([
      trip.coordinates.lng,
      trip.coordinates.lat
    ]);
    const container = map.getContainer();
    const padding = 32;
    const maxX = container.clientWidth - padding;
    const maxY = container.clientHeight - padding;
    const clampedX = Math.min(maxX, Math.max(padding, point.x));
    const clampedY = Math.min(maxY, Math.max(padding, point.y));
    const placement = clampedY < 180 ? "below" : "above";

    setMarkerScreenPosition({
      x: clampedX,
      y: clampedY,
      placement
    });
  }, [selectedTripId]);

  const token = useMemo(
    () => process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null,
    []
  );

  const { processedTrips, isGeocoding } = useTripMarkers(trips, token);

  const filteredTrips = useMemo(
    () =>
      processedTrips.filter((trip) =>
        matchesTripFilter(trip, filter, searchTerm)
      ),
    [processedTrips, filter, searchTerm]
  );

  const filteredMarkers = useMemo<TripMarker[]>(() => {
    return filteredTrips.reduce<TripMarker[]>((acc, trip) => {
      if (!trip.coordinates) return acc;
      acc.push({ ...trip, coordinates: trip.coordinates });
      return acc;
    }, []);
  }, [filteredTrips]);

  const filteredUnmappedCount = filteredTrips.length - filteredMarkers.length;

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return filteredMarkers.find((trip) => trip.id === selectedTripId) ?? null;
  }, [filteredMarkers, selectedTripId]);

  useEffect(() => {
    markersDataRef.current = filteredMarkers;
  }, [filteredMarkers]);

  useEffect(() => {
    if (!selectedTripId) return;
    if (!filteredMarkers.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(null);
      onTripFocus?.(null);
    }
  }, [filteredMarkers, onTripFocus, selectedTripId]);

  useEffect(() => {
    shouldAutoFitRef.current = true;
  }, [filter, searchTerm]);

  useEffect(() => {
    const markerIds = filteredMarkers.map((marker) => marker.id).sort();
    const previous = previousMarkerIdsRef.current;
    const changed =
      previous.length !== markerIds.length ||
      previous.some((value, index) => value !== markerIds[index]);
    if (changed) {
      previousMarkerIdsRef.current = markerIds;
      shouldAutoFitRef.current = true;
    }
  }, [filteredMarkers]);

  const ensureMarkerLayers = useCallback(
    (map: mapboxgl.Map) => {
      if (!map.getSource(MARKER_SOURCE_ID)) {
        map.addSource(MARKER_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_FEATURE_COLLECTION
        });
      }

      if (!map.getLayer(MARKER_HALO_LAYER_ID)) {
        map.addLayer({
          id: MARKER_HALO_LAYER_ID,
          type: "circle",
          source: MARKER_SOURCE_ID,
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              18,
              12
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.25,
              0.12
            ],
            "circle-blur": 0.6
          }
        });
      }

      if (!map.getLayer(MARKER_RING_LAYER_ID)) {
        map.addLayer({
          id: MARKER_RING_LAYER_ID,
          type: "circle",
          source: MARKER_SOURCE_ID,
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              16,
              12
            ],
            "circle-color": ["get", "color"],
            "circle-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.25,
              0.16
            ],
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              0.9,
              0.45
            ],
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              1.4,
            0.8
          ],
          "circle-translate": [0, -4],
          "circle-blur": 0.2
        }
        }, map.getLayer(MARKER_LAYER_ID) ? MARKER_LAYER_ID : undefined);
      }

      if (!map.getLayer(MARKER_LAYER_ID)) {
        map.addLayer({
          id: MARKER_LAYER_ID,
          type: "circle",
          source: MARKER_SOURCE_ID,
          paint: {
            "circle-radius": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              10,
              7.5
            ],
            "circle-color": "#ffffff",
            "circle-stroke-color": ["get", "color"],
            "circle-stroke-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2.8,
              2
            ],
            "circle-opacity": 0.96,
            "circle-translate": [0, -2]
          }
        });
      }

      if (!map.getLayer(MARKER_LABEL_LAYER_ID)) {
        map.addLayer({
          id: MARKER_LABEL_LAYER_ID,
          type: "symbol",
          source: MARKER_SOURCE_ID,
          layout: {
            "text-field": ["get", "emoji"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 16,
            "text-anchor": "center",
            "text-offset": [0, 0.95],
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#e2e8f0",
              "#0f172a"
            ],
            "text-halo-color": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              "#0f172a",
              "#ffffff"
            ],
            "text-halo-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2.4,
              1.2
            ]
          }
        });
      }
    },
    []
  );

  const fitToMarkers = useCallback(
    (map: mapboxgl.Map, items: TripMarker[]) => {
      if (items.length === 0) return;

      if (items.length === 1) {
        const only = items[0];
        map.flyTo({
          center: [only.coordinates.lng, only.coordinates.lat],
          zoom: 6.2,
          speed: 0.8,
          curve: 1.2,
          essential: true
        });
        return;
      }

      const bounds = new mapboxgl.LngLatBounds();
      items.forEach((trip) => {
        bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: isFullscreen
            ? { top: 120, bottom: 200, left: 120, right: 120 }
            : { top: 96, bottom: 200, left: 240, right: 240 },
          duration: 850,
          maxZoom: 9.2
        });
      }
    },
    [isFullscreen, mapboxgl]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );

    const handleLoad = () => {
      ensureMarkerLayers(map);
      shouldAutoFitRef.current = true;
      setMapReady(true);
    };
    map.on("load", handleLoad);

    const handleMapClick = () => {
      setSelectedTripId(null);
      onTripFocus?.(null);
    };
    map.on("click", handleMapClick);

    const disableAutoFit = () => {
      shouldAutoFitRef.current = false;
    };
    map.on("dragstart", disableAutoFit);
    map.on("zoomstart", disableAutoFit);

    return () => {
      map.off("load", handleLoad);
      map.off("click", handleMapClick);
      map.off("dragstart", disableAutoFit);
      map.off("zoomstart", disableAutoFit);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [ensureMarkerLayers, mapboxgl, mapStyle, onTripFocus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mapStyleRef.current === mapStyle) return;

    mapStyleRef.current = mapStyle;
    setMapReady(false);

    const handleStyleLoad = () => setMapReady(true);
    map.once("style.load", () => {
      ensureMarkerLayers(map);
      handleStyleLoad();
    });
    map.setStyle(mapStyle);

    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [ensureMarkerLayers, mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    ensureMarkerLayers(map);

    const source = map.getSource(MARKER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const featureCollection: FeatureCollection<Point, Record<string, string>> = {
      type: "FeatureCollection",
      features: filteredMarkers.map((trip) => ({
        type: "Feature",
        id: trip.id,
        geometry: {
          type: "Point",
          coordinates: [trip.coordinates.lng, trip.coordinates.lat]
        },
        properties: {
          id: trip.id,
          status: trip.status,
          color: STATUS_META[trip.status].markerColor,
          name: trip.name,
          emoji: STATUS_META[trip.status].emoji,
          destination:
            trip.primaryDestination ??
            trip.destination ??
            "Destination TBD",
          destinationLabel: formatDestinationLabel(
            trip.primaryDestination ??
              trip.destination ??
              "Destination TBD"
          )
        }
      }))
    };

    source.setData(featureCollection);

    if (!selectedTripId && shouldAutoFitRef.current) {
      fitToMarkers(map, filteredMarkers);
      shouldAutoFitRef.current = false;
    }
  }, [ensureMarkerLayers, filteredMarkers, fitToMarkers, mapReady, selectedTripId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer(MARKER_LAYER_ID)) return;

    const handleMarkerClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const tripId = feature?.properties?.id as string | undefined;
      if (!tripId) return;
      const trip = markersDataRef.current.find((item) => item.id === tripId);
      if (!trip) return;
      shouldAutoFitRef.current = false;
      setSelectedTripId(trip.id);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", MARKER_LAYER_ID, handleMarkerClick);
    map.on("click", MARKER_HALO_LAYER_ID, handleMarkerClick);
    map.on("mouseenter", MARKER_LAYER_ID, handleMouseEnter);
    map.on("mouseenter", MARKER_HALO_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", MARKER_LAYER_ID, handleMouseLeave);
    map.on("mouseleave", MARKER_HALO_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", MARKER_LAYER_ID, handleMarkerClick);
      map.off("click", MARKER_HALO_LAYER_ID, handleMarkerClick);
      map.off("mouseenter", MARKER_LAYER_ID, handleMouseEnter);
      map.off("mouseenter", MARKER_HALO_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", MARKER_LAYER_ID, handleMouseLeave);
      map.off("mouseleave", MARKER_HALO_LAYER_ID, handleMouseLeave);
    };
  }, [mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getSource(MARKER_SOURCE_ID)) return;

    const previousSelected = previousSelectedRef.current;
    if (previousSelected && previousSelected !== selectedTripId) {
      map.setFeatureState(
        { source: MARKER_SOURCE_ID, id: previousSelected },
        { selected: false }
      );
    }

    if (selectedTripId) {
      const exists = filteredMarkers.some((marker) => marker.id === selectedTripId);
      if (exists) {
        map.setFeatureState(
          { source: MARKER_SOURCE_ID, id: selectedTripId },
          { selected: true }
        );
      }
    }

    previousSelectedRef.current = selectedTripId;
  }, [filteredMarkers, mapReady, selectedTripId]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    if (!selectedTripId) {
      setMarkerScreenPosition(null);
      onTripFocus?.(null);
      shouldAutoFitRef.current = true;
      return;
    }

    const trip = markersDataRef.current.find(
      (item) => item.id === selectedTripId
    );
    if (!trip?.coordinates) {
      setSelectedTripId(null);
      onTripFocus?.(null);
      setMarkerScreenPosition(null);
      return;
    }

    shouldAutoFitRef.current = false;
    map.easeTo({
      center: [trip.coordinates.lng, trip.coordinates.lat],
      zoom: Math.max(map.getZoom(), 4),
      duration: 600,
      padding: isFullscreen
        ? { top: 140, bottom: 200, left: 140, right: 140 }
        : { top: 140, bottom: 160, left: 140, right: 140 }
    });

    updateMarkerOverlayPosition();
    onTripFocus?.(trip.id);
  }, [
    isFullscreen,
    mapReady,
    onTripFocus,
    selectedTripId,
    updateMarkerOverlayPosition
  ]);

  useEffect(() => {
    if (!mapReady) {
      setMarkerScreenPosition(null);
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    if (!selectedTripId) {
      setMarkerScreenPosition(null);
      return;
    }

    const handleUpdate = () => updateMarkerOverlayPosition();
    handleUpdate();

    map.on("move", handleUpdate);
    map.on("zoom", handleUpdate);
    map.on("resize", handleUpdate);

    return () => {
      map.off("move", handleUpdate);
      map.off("zoom", handleUpdate);
      map.off("resize", handleUpdate);
    };
  }, [mapReady, selectedTripId, updateMarkerOverlayPosition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const resize = () => map.resize();
    const timer = window.setTimeout(resize, 220);
    return () => window.clearTimeout(timer);
  }, [isFullscreen, filteredMarkers.length]);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    shouldAutoFitRef.current = false;
    setSelectedTripId(null);
    setMarkerScreenPosition(null);
    onTripFocus?.(null);
    fitToMarkers(map, filteredMarkers);
  }, [filteredMarkers, fitToMarkers, onTripFocus]);

  return (
    <div
      className={cn(
        "relative h-full min-h-[520px] overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-xl transition duration-300",
        isFullscreen ? "fixed inset-4 z-[9999] flex flex-col" : ""
      )}
    >
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6 sm:gap-3">
          <div className="rounded-xl border border-border/60 bg-background/85 px-3 py-2 shadow-md shadow-black/10 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Style
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {MAP_STYLE_OPTIONS.map((option) => {
                  const active = mapStyle.endsWith(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        onStyleChange(`mapbox://styles/mapbox/${option.id}`)
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <span>{option.emoji}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/85 px-2 py-1.5 shadow-md shadow-black/10 backdrop-blur">
            <button
              type="button"
              onClick={resetView}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label="Reset map view"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:text-foreground"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <MinimizeIcon className="h-4 w-4" />
              ) : (
                <MaximizeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-background/90 px-4 py-2 text-sm font-semibold text-foreground shadow-lg shadow-black/10 backdrop-blur-md">
            <MapPinIcon className="h-4 w-4 text-primary" />
            <span>{filteredMarkers.length}</span>
            <span className="text-muted-foreground">
              {filteredMarkers.length === 1 ? "mapped trip" : "mapped trips"}
            </span>
          </div>
        </div>

        {selectedTrip && markerScreenPosition && (
          <div
            className="pointer-events-auto absolute"
            style={{
              left: markerScreenPosition.x,
              top: markerScreenPosition.y
            }}
          >
            <div
              className="relative w-[260px] max-w-xs rounded-2xl border border-border/80 bg-background/95 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl transition-transform duration-200"
              style={{
                transform:
                  markerScreenPosition.placement === "above"
                    ? "translate(-50%, calc(-100% - 20px))"
                    : "translate(-50%, 24px)"
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedTripId(null)}
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground transition hover:text-foreground"
                aria-label="Close trip preview"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
              <div className="pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {selectedTrip.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      STATUS_META[selectedTrip.status].chipClass
                    )}
                  >
                    {STATUS_META[selectedTrip.status].emoji}
                    {STATUS_META[selectedTrip.status].label}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedTrip.primaryDestination ??
                  selectedTrip.destination ??
                  "Destination coming soon"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{formatDateRange(selectedTrip.start_date, selectedTrip.end_date)}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="font-medium text-foreground">
                  {selectedTrip.preferences?.currency ?? "USD"}
                </span>
              </div>
              <Link
                href={`/trips/${selectedTrip.id}`}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
              >
                Open trip
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
              <span
                className="pointer-events-none absolute h-3 w-3 border border-border/80 bg-background/95"
                style={
                  markerScreenPosition.placement === "above"
                    ? {
                        top: "100%",
                        left: "50%",
                        transform: "translate(-50%, -60%) rotate(45deg)"
                      }
                    : {
                        bottom: "100%",
                        left: "50%",
                        transform: "translate(-50%, 60%) rotate(45deg)"
                      }
                }
              />
            </div>
          </div>
        )}

        {!selectedTrip && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border/70 bg-background/85 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/10 backdrop-blur">
            Tap a marker to preview trip details
          </div>
        )}

        {(isGeocoding || filteredUnmappedCount > 0) && (
          <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-400 shadow-lg shadow-amber-500/10 backdrop-blur sm:bottom-6 sm:right-6">
            <CompassIcon className="h-3.5 w-3.5 animate-spin" />
            {isGeocoding
              ? "Calibrating new destinations…"
              : `${filteredUnmappedCount} trip${
                  filteredUnmappedCount === 1 ? "" : "s"
                } missing coordinates`}
          </div>
        )}
      </div>

      {(!mapReady || filteredMarkers.length === 0) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          {mapReady && filteredMarkers.length === 0 ? (
            <div className="mx-auto max-w-md rounded-3xl border border-border/70 bg-card/90 p-8 text-center shadow-xl shadow-black/20">
              <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                No trips match the current filters
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Adjust your filters or add destinations to your trips to see them on the map.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/95 px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg shadow-black/20">
              <CompassIcon className="h-4 w-4 animate-spin" /> Calibrating map…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Legacy marker helper removed.
