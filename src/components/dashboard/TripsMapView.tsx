'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Point } from "geojson";
import MapboxWrapper from "@/components/map/MapboxWrapper";
import { cn, formatCurrency } from "@/lib/utils";
import { TripDestinations } from "@/lib/types/destination";
import { logger } from "@/lib/logger";
import {
  CompassIcon,
  LayersIcon,
  MapPinIcon,
  MaximizeIcon,
  MinimizeIcon,
  RotateCcwIcon
} from "lucide-react";

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
    trip_type?: string;
    destinations?: TripDestinations;
  };
};

type TripFilter = "all" | "upcoming" | "ongoing" | "past";

interface TripsMapViewProps {
  trips: Trip[];
  searchTerm?: string;
  filter?: TripFilter;
  onTripFocus?: (tripId: string | null) => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface ProcessedTrip extends Trip {
  status: "upcoming" | "ongoing" | "completed" | "planning";
  coordinates?: Coordinates;
  primaryDestination?: string;
  geocoded?: boolean;
}

interface TripFeatureProperties {
  tripId: string;
  status: ProcessedTrip["status"];
  name: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  currency: string;
}

const DEFAULT_CENTER: [number, number] = [12.4964, 41.9028];

const STATUS_CONFIG: Record<
  ProcessedTrip["status"],
  { label: string; indicator: string; legend: string }
> = {
  upcoming: {
    label: "Upcoming",
    indicator: "bg-emerald-500",
    legend: "text-emerald-500"
  },
  ongoing: {
    label: "Ongoing",
    indicator: "bg-orange-500",
    legend: "text-orange-500"
  },
  completed: {
    label: "Completed",
    indicator: "bg-purple-500",
    legend: "text-purple-500"
  },
  planning: {
    label: "Planning",
    indicator: "bg-sky-500",
    legend: "text-sky-500"
  }
};

const MAP_STYLE_OPTIONS = [
  { id: "streets-v12", emoji: "🗺️", label: "Streets" },
  { id: "satellite-v9", emoji: "🛰️", label: "Satellite" },
  { id: "outdoors-v12", emoji: "🏔️", label: "Outdoors" },
  { id: "dark-v11", emoji: "🌙", label: "Dark" }
];

const TRIP_SOURCE_ID = "dashboard-trip-points";
const TRIP_LAYER_HALO_ID = "dashboard-trip-points-halo";
const TRIP_LAYER_CORE_ID = "dashboard-trip-points-core";

const STATUS_COLOR_EXPRESSION: any = [
  "match",
  ["get", "status"],
  "upcoming",
  "#34d399",
  "ongoing",
  "#fb923c",
  "completed",
  "#a855f7",
  "#0ea5e9"
];

const HALO_COLOR_EXPRESSION: any = [
  "match",
  ["get", "status"],
  "upcoming",
  "rgba(52, 211, 153, 0.28)",
  "ongoing",
  "rgba(251, 146, 60, 0.25)",
  "completed",
  "rgba(168, 85, 247, 0.28)",
  "rgba(14, 165, 233, 0.25)"
];

const destinationCoordinateCache = new Map<string, Coordinates>();

export default function TripsMapView({
  trips,
  searchTerm = "",
  filter = "all",
  onTripFocus
}: TripsMapViewProps) {
  const [mapStyle, setMapStyle] = useState(
    "mapbox://styles/mapbox/streets-v12"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  return (
    <MapboxWrapper
      fallback={
        <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950">
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

interface TripsMapCanvasProps extends TripsMapViewProps {
  mapboxgl: any;
  mapStyle: string;
  onStyleChange: (style: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

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
  const mapRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const styleRef = useRef(mapStyle);
  const [mapReady, setMapReady] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);
  const [coordinatesCache, setCoordinatesCache] = useState<Record<string, Coordinates>>({});
  const coordinatesCacheRef = useRef<Record<string, Coordinates>>({});
  const visibleTripsRef = useRef<ProcessedTrip[]>([]);
  const featureIdsRef = useRef<Set<string>>(new Set());
  const previousSelectedRef = useRef<string | null>(null);
  const previousHoveredRef = useRef<string | null>(null);

  useEffect(() => {
    coordinatesCacheRef.current = coordinatesCache;
  }, [coordinatesCache]);

  const token = useMemo(
    () => process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
    []
  );

  const processedTrips = useMemo<ProcessedTrip[]>(() => {
    const now = new Date();

    return trips.map((trip) => {
      let status: ProcessedTrip["status"] = "planning";

      if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);
        if (now < start) status = "upcoming";
        else if (now >= start && now <= end) status = "ongoing";
        else status = "completed";
      } else if (trip.start_date) {
        const start = new Date(trip.start_date);
        status = now < start ? "upcoming" : "planning";
      }

      let coordinates: Coordinates | undefined;
      let primaryDestination = trip.destination ?? undefined;

      const destinationGroup = trip.preferences?.destinations;
      if (destinationGroup?.destinations?.length) {
        const candidates = destinationGroup.destinations;
        const preferredCandidate = destinationGroup.primary
          ? candidates.find((dest) => dest.id === destinationGroup.primary)
          : undefined;
        const candidateWithCoordinates =
          (preferredCandidate?.coordinates && preferredCandidate) ??
          candidates.find((dest) => dest.coordinates);
        const resolvedCandidate =
          candidateWithCoordinates ?? preferredCandidate ?? candidates[0];

        if (resolvedCandidate?.coordinates) {
          coordinates = resolvedCandidate.coordinates;
        }

        if (resolvedCandidate?.name) {
          primaryDestination = resolvedCandidate.name;
        }
      }

      return {
        ...trip,
        status,
        coordinates,
        primaryDestination
      };
    });
  }, [trips]);

  const resolvedTrips = useMemo<ProcessedTrip[]>(() => {
    return processedTrips.map((trip) => {
      const cached = coordinatesCache[trip.id];
      if (cached && !trip.coordinates) {
        return { ...trip, coordinates: cached, geocoded: true };
      }
      return trip;
    });
  }, [processedTrips, coordinatesCache]);

  const visibleTrips = useMemo<ProcessedTrip[]>(() => {
    return resolvedTrips.filter((trip) => {
      if (!trip.coordinates) return false;

      if (filter === "upcoming" && trip.status !== "upcoming") return false;
      if (filter === "ongoing" && trip.status !== "ongoing") return false;
      if (filter === "past" && trip.status !== "completed") return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const haystack = [
          trip.name,
          trip.primaryDestination,
          trip.description,
          trip.destination
        ]
          .filter(Boolean)
          .map((value) => value!.toLowerCase());
        if (!haystack.some((value) => value.includes(term))) {
          return false;
        }
      }

      return true;
    });
  }, [resolvedTrips, filter, searchTerm]);

  const featureCollection = useMemo<FeatureCollection<Point, TripFeatureProperties>>(
    () => ({
      type: "FeatureCollection",
      features: visibleTrips.map((trip) => ({
        type: "Feature",
        id: trip.id,
        properties: {
          tripId: trip.id,
          status: trip.status,
          name: trip.name,
          destination:
            trip.primaryDestination ?? trip.destination ?? "Destination coming soon",
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: typeof trip.budget_total === "number" ? trip.budget_total : null,
          currency: trip.preferences?.currency ?? "USD"
        },
        geometry: {
          type: "Point",
          coordinates: [trip.coordinates!.lng, trip.coordinates!.lat]
        }
      }))
    }),
    [visibleTrips]
  );

  useEffect(() => {
    visibleTripsRef.current = visibleTrips;
    featureIdsRef.current = new Set(visibleTrips.map((trip) => trip.id));
  }, [visibleTrips]);

  const unmappedTripCount = useMemo(() => {
    return resolvedTrips.filter((trip) => !trip.coordinates).length;
  }, [resolvedTrips]);

  const ensureSourceAndLayers = useCallback((map: any) => {
    if (!map || !map.isStyleLoaded()) return;

    if (!map.getSource(TRIP_SOURCE_ID)) {
      map.addSource(TRIP_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        },
        promoteId: "tripId"
      });
    }

    if (!map.getLayer(TRIP_LAYER_HALO_ID)) {
      map.addLayer({
        id: TRIP_LAYER_HALO_ID,
        type: "circle",
        source: TRIP_SOURCE_ID,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            16,
            10,
            48
          ],
          "circle-color": HALO_COLOR_EXPRESSION,
          "circle-blur": 0.55,
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.55,
            ["boolean", ["feature-state", "hovered"], false],
            0.35,
            0.18
          ]
        }
      });
    }

    if (!map.getLayer(TRIP_LAYER_CORE_ID)) {
      map.addLayer({
        id: TRIP_LAYER_CORE_ID,
        type: "circle",
        source: TRIP_SOURCE_ID,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            6,
            10,
            16
          ],
          "circle-color": STATUS_COLOR_EXPRESSION,
          "circle-stroke-color": "rgba(255,255,255,0.95)",
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            2.4,
            ["boolean", ["feature-state", "hovered"], false],
            1.6,
            1.1
          ],
          "circle-opacity": 0.95
        }
      });
    }
  }, []);

  const updateSourceData = useCallback(
    (targetMap?: any) => {
      const map = targetMap ?? mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      ensureSourceAndLayers(map);
      const source = map.getSource(TRIP_SOURCE_ID) as any;
      if (source) {
        source.setData(featureCollection);
      }
    },
    [ensureSourceAndLayers, featureCollection]
  );

  const focusTrip = useCallback((trip: ProcessedTrip) => {
    const map = mapRef.current;
    if (!map || !trip.coordinates) return;

    map.flyTo({
      center: [trip.coordinates.lng, trip.coordinates.lat],
      zoom: 9,
      speed: 1.15,
      curve: 1.35,
      essential: true
    });
  }, []);

  const closePopup = useCallback(() => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
  }, []);

  const openPopupForTrip = useCallback(
    (trip: ProcessedTrip) => {
      const map = mapRef.current;
      if (!map || !trip.coordinates) return;

      closePopup();

      popupRef.current = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "trip-popup"
      })
        .setLngLat([trip.coordinates.lng, trip.coordinates.lat])
        .setHTML(buildPopupContent(trip))
        .addTo(map);
    },
    [closePopup, mapboxgl]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: 2.2,
      attributionControl: false
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
      "bottom-right"
    );
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    const handleLoad = () => {
      ensureSourceAndLayers(map);
      updateSourceData(map);
      setMapReady(true);
    };

    map.on("load", handleLoad);

    return () => {
      map.off("load", handleLoad);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      closePopup();
    };
  }, [closePopup, ensureSourceAndLayers, mapStyle, mapboxgl, updateSourceData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (styleRef.current === mapStyle) return;

    styleRef.current = mapStyle;
    setMapReady(false);
    map.setStyle(mapStyle);

    const handleStyleLoad = () => {
      ensureSourceAndLayers(map);
      updateSourceData(map);
      setMapReady(true);
    };

    map.once("style.load", handleStyleLoad);

    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [ensureSourceAndLayers, mapStyle, updateSourceData]);

  useEffect(() => {
    updateSourceData();
  }, [updateSourceData]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseMove = (event: any) => {
      const feature = event?.features?.[0];
      const tripId: string | undefined = feature?.properties?.tripId;
      if (!tripId || tripId === hoveredTripId) return;
      setHoveredTripId(tripId);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredTripId(null);
    };

    const handleClick = (event: any) => {
      const feature = event?.features?.[0];
      const tripId: string | undefined = feature?.properties?.tripId;
      if (!tripId) return;
      setSelectedTripId(tripId);
    };

    const handleMapClick = (event: any) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [TRIP_LAYER_CORE_ID]
      });
      if (features.length === 0) {
        setSelectedTripId(null);
      }
    };

    map.on("mouseenter", TRIP_LAYER_CORE_ID, handleMouseEnter);
    map.on("mousemove", TRIP_LAYER_CORE_ID, handleMouseMove);
    map.on("mouseleave", TRIP_LAYER_CORE_ID, handleMouseLeave);
    map.on("click", TRIP_LAYER_CORE_ID, handleClick);
    map.on("click", handleMapClick);

    return () => {
      map.off("mouseenter", TRIP_LAYER_CORE_ID, handleMouseEnter);
      map.off("mousemove", TRIP_LAYER_CORE_ID, handleMouseMove);
      map.off("mouseleave", TRIP_LAYER_CORE_ID, handleMouseLeave);
      map.off("click", TRIP_LAYER_CORE_ID, handleClick);
      map.off("click", handleMapClick);
    };
  }, [hoveredTripId, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const previous = previousHoveredRef.current;
    if (previous && featureIdsRef.current.has(previous)) {
      map.setFeatureState(
        { source: TRIP_SOURCE_ID, id: previous },
        { hovered: false }
      );
    }

    if (hoveredTripId && featureIdsRef.current.has(hoveredTripId)) {
      map.setFeatureState(
        { source: TRIP_SOURCE_ID, id: hoveredTripId },
        { hovered: true }
      );
    }

    previousHoveredRef.current = hoveredTripId ?? null;
  }, [hoveredTripId, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    const previous = previousSelectedRef.current;
    if (previous && featureIdsRef.current.has(previous)) {
      map.setFeatureState(
        { source: TRIP_SOURCE_ID, id: previous },
        { selected: false }
      );
    }

    if (selectedTripId && featureIdsRef.current.has(selectedTripId)) {
      map.setFeatureState(
        { source: TRIP_SOURCE_ID, id: selectedTripId },
        { selected: true }
      );

      const trip = visibleTripsRef.current.find((item) => item.id === selectedTripId);
      if (trip) {
        openPopupForTrip(trip);
        focusTrip(trip);
      }
    } else {
      closePopup();
    }

    previousSelectedRef.current = selectedTripId ?? null;
  }, [selectedTripId, mapReady, closePopup, focusTrip, openPopupForTrip]);

  useEffect(() => {
    onTripFocus?.(selectedTripId);
  }, [selectedTripId, onTripFocus]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      logger.warn("Mapbox token missing; skipping trip geocoding.");
      return;
    }

    const missingTrips = processedTrips.filter((trip) => {
      if (trip.coordinates) return false;
      if (coordinatesCacheRef.current[trip.id]) return false;
      return Boolean(trip.primaryDestination || trip.destination);
    });

    if (missingTrips.length === 0) {
      return;
    }

    const geocodeSequentially = async () => {
      for (const trip of missingTrips) {
        if (cancelled) break;

        const label = trip.primaryDestination ?? trip.destination ?? "";
        if (!label) continue;

        const cacheKey = label.toLowerCase();
        if (destinationCoordinateCache.has(cacheKey)) {
          const cached = destinationCoordinateCache.get(cacheKey)!;
          setCoordinatesCache((prev) => ({ ...prev, [trip.id]: cached }));
          continue;
        }

        try {
          const coordinates = await geocodeDestination(label, token);
          if (!coordinates) continue;
          destinationCoordinateCache.set(cacheKey, coordinates);
          if (!cancelled) {
            setCoordinatesCache((prev) => ({ ...prev, [trip.id]: coordinates }));
          }
        } catch (error) {
          logger.error("Failed to geocode trip destination", {
            destination: label,
            error
          });
        }
      }
    };

    void geocodeSequentially();

    return () => {
      cancelled = true;
    };
  }, [processedTrips, token]);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map || visibleTrips.length === 0) return;

    if (visibleTrips.length === 1) {
      focusTrip(visibleTrips[0]);
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    visibleTrips.forEach((trip) => {
      if (!trip.coordinates) return;
      bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: isFullscreen
          ? { top: 96, bottom: 160, left: 96, right: 96 }
          : { top: 96, bottom: 200, left: 240, right: 240 },
        duration: 850,
        maxZoom: 9.5
      });
    }
  }, [visibleTrips, mapReady, focusTrip, isFullscreen]);

  const clearSelection = useCallback(() => {
    setSelectedTripId(null);
    setHoveredTripId(null);
    closePopup();
  }, [closePopup]);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map || visibleTrips.length === 0) return;

    clearSelection();

    const bounds = new mapboxgl.LngLatBounds();
    visibleTrips.forEach((trip) => {
      if (!trip.coordinates) return;
      bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: isFullscreen
          ? { top: 96, bottom: 160, left: 96, right: 96 }
          : { top: 96, bottom: 200, left: 240, right: 240 },
        duration: 750,
        maxZoom: 9.5
      });
    }
  }, [clearSelection, isFullscreen, visibleTrips]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return visibleTrips.find((trip) => trip.id === selectedTripId) ?? null;
  }, [selectedTripId, visibleTrips]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 shadow-xl transition duration-300",
        isFullscreen
          ? "fixed inset-4 z-[9999] flex flex-col"
          : "h-[560px]"
      )}
    >
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/90 p-2 backdrop-blur-md">
          {MAP_STYLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onStyleChange(`mapbox://styles/mapbox/${option.id}`)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition",
                mapStyle.endsWith(option.id)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={resetView}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcwIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {isFullscreen ? (
              <MinimizeIcon className="h-4 w-4" />
            ) : (
              <MaximizeIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/95 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-md">
          <MapPinIcon className="h-4 w-4 text-primary" />
          <span>{visibleTrips.length}</span>
          <span className="text-muted-foreground">
            {visibleTrips.length === 1 ? "trip" : "trips"}
          </span>
        </div>

        <div className="space-y-2 rounded-xl border border-border/60 bg-background/95 p-4 text-xs text-muted-foreground backdrop-blur-md">
          <div className="flex items-center gap-2 text-foreground">
            <LayersIcon className="h-4 w-4 text-primary" />
            <span className="font-medium">Status legend</span>
          </div>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <LegendItem
              key={status}
              color={config.indicator}
              label={config.label}
              className={config.legend}
            />
          ))}
          {unmappedTripCount > 0 && (
            <div className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {unmappedTripCount} trip
              {unmappedTripCount > 1 ? "s" : ""} missing precise destination data
            </div>
          )}
        </div>
      </div>

      {selectedTrip && (
        <div className="pointer-events-none absolute left-4 bottom-4 z-20 max-w-sm rounded-2xl border border-border/60 bg-background/95 px-4 py-3 text-sm shadow-xl backdrop-blur-lg">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected trip
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {selectedTrip.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedTrip.primaryDestination ?? selectedTrip.destination ?? "Destination coming soon"}
          </p>
        </div>
      )}

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
            <CompassIcon className="h-4 w-4 animate-spin" /> Calibrating map…
          </div>
        </div>
      )}

      {visibleTrips.length === 0 && mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-md rounded-2xl border border-border/70 bg-card/90 p-8 text-center shadow-xl">
            <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              No trips match the current filters
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Adjust your filters or add destinations to your trips to see them on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  className
}: {
  color: string;
  label: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span className={cn("font-medium", className)}>{label}</span>
    </div>
  );
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

function formatDateRange(
  start: string | null,
  end: string | null
): string {
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

function buildPopupContent(trip: ProcessedTrip): string {
  const statusConfig = STATUS_CONFIG[trip.status];
  const currency = trip.preferences?.currency ?? "USD";
  const budget =
    typeof trip.budget_total === "number"
      ? formatCurrency(trip.budget_total, currency)
      : null;
  const destination =
    trip.primaryDestination ?? trip.destination ?? "Destination TBD";

  return `
    <div class="min-w-[260px] max-w-[320px] rounded-2xl bg-background/95 p-4 text-left text-foreground">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold">${escapeHtml(trip.name)}</h3>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(destination)}</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusConfig.legend}">
          ${statusConfig.label}
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
