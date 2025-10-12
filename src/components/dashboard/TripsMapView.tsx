"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  CompassIcon,
  LayersIcon,
  MapPinIcon,
  MaximizeIcon,
  MinimizeIcon,
  RotateCcwIcon,
  XIcon
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import MapboxWrapper from "@/components/map/MapboxWrapper";
import { TripDestinations } from "@/lib/types/destination";
import { logger } from "@/lib/logger";

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

const DEFAULT_CENTER: [number, number] = [12.4964, 41.9028];

const STATUS_CONFIG: Record<
  ProcessedTrip["status"],
  { marker: string; halo: string; badge: string; label: string }
> = {
  upcoming: {
    marker: "bg-emerald-500 text-white",
    halo: "bg-emerald-400/40",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    label: "Upcoming"
  },
  ongoing: {
    marker: "bg-orange-500 text-white",
    halo: "bg-orange-400/40",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    label: "Ongoing"
  },
  completed: {
    marker: "bg-purple-500 text-white",
    halo: "bg-purple-400/40",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    label: "Completed"
  },
  planning: {
    marker: "bg-blue-500 text-white",
    halo: "bg-blue-400/40",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    label: "Planning"
  }
};

const MAP_STYLE_OPTIONS = [
  { id: "streets-v12", emoji: "🗺️", label: "Streets" },
  { id: "satellite-v9", emoji: "🛰️", label: "Satellite" },
  { id: "outdoors-v12", emoji: "🏔️", label: "Outdoors" },
  { id: "dark-v11", emoji: "🌙", label: "Dark" }
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
    if (!isFullscreen) {
      return;
    }
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
            <h3 className="text-lg font-semibold text-foreground">Preparing your map</h3>
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
  const markersRef = useRef<any[]>([]);
  const styleRef = useRef(mapStyle);
  const [mapReady, setMapReady] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);
  const [coordinatesCache, setCoordinatesCache] = useState<Record<string, Coordinates>>({});
  const coordinatesCacheRef = useRef<Record<string, Coordinates>>({});

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
        const primary = destinationGroup.primary
          ? candidates.find((dest) => dest.id === destinationGroup.primary)
          : candidates[0];
        if (primary) {
          coordinates = primary.coordinates;
          primaryDestination = primary.name ?? primaryDestination;
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

  const unmappedTripCount = useMemo(() => {
    return resolvedTrips.filter((trip) => !trip.coordinates).length;
  }, [resolvedTrips]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return (
      visibleTrips.find((trip) => trip.id === selectedTripId) ??
      resolvedTrips.find((trip) => trip.id === selectedTripId) ??
      null
    );
  }, [visibleTrips, resolvedTrips, selectedTripId]);

  const focusTrip = useCallback(
    (trip: ProcessedTrip) => {
      if (!trip.coordinates || !mapRef.current) return;
      mapRef.current.flyTo({
        center: [trip.coordinates.lng, trip.coordinates.lat],
        zoom: 9,
        speed: 1.2,
        curve: 1.4,
        essential: true
      });
    },
    []
  );

  const handleTripSelection = useCallback(
    (trip: ProcessedTrip) => {
      setSelectedTripId(trip.id);
      focusTrip(trip);
      onTripFocus?.(trip.id);
    },
    [focusTrip, onTripFocus]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: 2.2,
      attributionControl: false
    });

    const navigationControl = new mapboxgl.NavigationControl({
      showCompass: true,
      showZoom: true
    });
    mapRef.current.addControl(navigationControl, "bottom-right");
    mapRef.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    const handleLoad = () => setMapReady(true);
    mapRef.current.on("load", handleLoad);

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.off("load", handleLoad);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapboxgl, mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (styleRef.current === mapStyle) return;

    styleRef.current = mapStyle;
    setMapReady(false);
    mapRef.current.setStyle(mapStyle);
    mapRef.current.once("style.load", () => setMapReady(true));
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    const resize = () => mapRef.current?.resize();
    const timeout = window.setTimeout(resize, 300);
    return () => window.clearTimeout(timeout);
  }, [isFullscreen]);

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
    if (!mapRef.current || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    visibleTrips.forEach((trip) => {
      if (!trip.coordinates) return;

      const markerElement = createMarkerElement({
        trip,
        isSelected: selectedTripId === trip.id,
        isHovered: hoveredTripId === trip.id
      });

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "trip-popup"
      }).setHTML(buildPopupContent(trip));

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: "bottom"
      })
        .setLngLat([trip.coordinates.lng, trip.coordinates.lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      markerElement.addEventListener("mouseenter", () => {
        setHoveredTripId(trip.id);
      });

      markerElement.addEventListener("mouseleave", () => {
        setHoveredTripId((current) => (current === trip.id ? null : current));
      });

      markerElement.addEventListener("click", () => {
        handleTripSelection(trip);
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });
  }, [
    visibleTrips,
    mapReady,
    handleTripSelection,
    hoveredTripId,
    selectedTripId,
    mapboxgl
  ]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (visibleTrips.length === 0) return;

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
      mapRef.current.fitBounds(bounds, {
        padding: isFullscreen
          ? { top: 96, bottom: 192, left: 96, right: 96 }
          : { top: 96, bottom: 220, left: 280, right: 280 },
        duration: 850,
        maxZoom: 9.5
      });
    }
  }, [visibleTrips, mapReady, focusTrip, isFullscreen]);

  useEffect(() => {
    if (!selectedTripId) return;
    if (!visibleTrips.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(null);
    }
  }, [visibleTrips, selectedTripId]);

  const resetView = useCallback(() => {
    if (!mapRef.current || visibleTrips.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    visibleTrips.forEach((trip) => {
      if (!trip.coordinates) return;
      bounds.extend([trip.coordinates.lng, trip.coordinates.lat]);
    });
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, {
        padding: isFullscreen
          ? { top: 96, bottom: 192, left: 96, right: 96 }
          : { top: 96, bottom: 220, left: 280, right: 280 },
        duration: 750,
        maxZoom: 9.5
      });
    }
  }, [visibleTrips, isFullscreen]);

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
              onClick={() =>
                onStyleChange(`mapbox://styles/mapbox/${option.id}`)
              }
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200",
                mapStyle.includes(option.id)
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted/70"
              )}
            >
              <span aria-hidden>{option.emoji}</span>
              <span className="hidden sm:inline">{option.label}</span>
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
          <LegendItem color="bg-emerald-500" label="Upcoming" />
          <LegendItem color="bg-orange-500" label="Ongoing" />
          <LegendItem color="bg-purple-500" label="Completed" />
          <LegendItem color="bg-blue-500" label="Planning" />
          {unmappedTripCount > 0 && (
            <div className="mt-2 rounded-lg bg-amber-500/10 p-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {unmappedTripCount} trip
              {unmappedTripCount > 1 ? "s" : ""} missing precise
              destination data
            </div>
          )}
        </div>
      </div>

      <TripCarousel
        trips={visibleTrips}
        selectedTripId={selectedTripId}
        onSelect={handleTripSelection}
      />

      {selectedTrip && (
        <TripDetailsOverlay
          trip={selectedTrip}
          onClose={() => {
            setSelectedTripId(null);
            onTripFocus?.(null);
          }}
        />
      )}

      {!mapReady && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg">
            <CompassIcon className="h-4 w-4 animate-spin" /> Calibrating map…
          </div>
        </div>
      )}

      {visibleTrips.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-md rounded-2xl border border-border/70 bg-card/90 p-8 text-center shadow-xl">
            <MapPinIcon className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              No trips match the current filters
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Adjust your filters or add destinations to your trips to see
              them on the map. Live geocoding runs automatically when new
              locations are detected.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}

interface TripCarouselProps {
  trips: ProcessedTrip[];
  selectedTripId: string | null;
  onSelect: (trip: ProcessedTrip) => void;
}

function TripCarousel({ trips, selectedTripId, onSelect }: TripCarouselProps) {
  if (trips.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 w-[92%] max-w-4xl -translate-x-1/2">
      <div className="flex gap-3 overflow-x-auto rounded-2xl border border-border/60 bg-background/95 p-3 backdrop-blur-md shadow-lg scrollbar-thin scrollbar-thumb-muted-foreground/30">
        {trips.map((trip) => {
          const isActive = selectedTripId === trip.id;
          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => onSelect(trip)}
              className={cn(
                "min-w-[220px] max-w-[260px] rounded-2xl border border-border/60 px-4 py-3 text-left transition-all duration-200",
                "hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card/90 text-foreground"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold">
                  {trip.name}
                </p>
                <StatusBadge status={trip.status} />
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {trip.primaryDestination ?? trip.destination ?? "Destination TBD"}
              </p>
              <p className="mt-2 text-xs font-medium text-foreground">
                {formatDateRange(trip.start_date, trip.end_date)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TripDetailsOverlay({
  trip,
  onClose
}: {
  trip: ProcessedTrip;
  onClose: () => void;
}) {
  const currency = trip.preferences?.currency ?? "USD";

  return (
    <div className="pointer-events-auto absolute bottom-28 left-1/2 z-30 w-[min(420px,90%)] -translate-x-1/2 rounded-3xl border border-border/70 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected trip
          </p>
          <h3 className="mt-1 text-xl font-bold leading-6 text-foreground">
            {trip.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close trip details"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <MapPinIcon className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="font-medium">
              {trip.primaryDestination ?? trip.destination ?? "Destination coming soon"}
            </p>
            <p className="text-xs text-muted-foreground">
              Tap any marker to jump between adventures
            </p>
          </div>
        </div>

        {(trip.start_date || trip.end_date) && (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </span>
            <p className="font-medium">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>
        )}

        {typeof trip.budget_total === "number" && (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
              €
            </span>
            <p className="font-medium">
              {formatCurrency(trip.budget_total, currency)}
            </p>
          </div>
        )}

        {trip.description && (
          <p className="rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground line-clamp-3">
            {trip.description}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <StatusBadge status={trip.status} />
        <Link
          href={`/trips/${trip.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
        >
          View trip
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessedTrip["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        config.badge
      )}
    >
      {config.label}
    </span>
  );
}

function createMarkerElement({
  trip,
  isSelected,
  isHovered
}: {
  trip: ProcessedTrip;
  isSelected: boolean;
  isHovered: boolean;
}): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  const config = STATUS_CONFIG[trip.status];
  element.className = cn(
    "trip-marker relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-background shadow-lg transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    config.marker,
    isSelected ? "scale-110 ring-2 ring-primary/50" : "scale-100",
    isHovered ? "scale-105" : ""
  );
  element.setAttribute("data-trip-id", trip.id);
  element.setAttribute("aria-label", trip.name);
  element.setAttribute("title", trip.name);

  const halo = document.createElement("span");
  halo.className = cn(
    "pointer-events-none absolute inset-0 -z-10 rounded-full blur-md transition-opacity duration-300",
    config.halo,
    isSelected ? "opacity-100" : "opacity-80"
  );
  element.appendChild(halo);

  const inner = document.createElement("span");
  inner.className = "relative inline-flex h-3 w-3 rounded-full bg-white shadow-md";
  inner.setAttribute("aria-hidden", "true");
  element.appendChild(inner);

  return element;
}

function buildPopupContent(trip: ProcessedTrip): string {
  const config = STATUS_CONFIG[trip.status];
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
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}">
          ${config.label}
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
