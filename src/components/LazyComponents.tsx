import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const MapSkeleton = () => (
  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
  </div>
);

const CalendarSkeleton = () => (
  <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
  </div>
);

const WizardSkeleton = () => (
  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-500 dark:text-gray-400">Loading AI Wizard...</div>
  </div>
);

// Lazy loaded components

// Mapbox components - must be loaded client-side only
export const LazyMapView = dynamic(
  () => import('./map/MapView').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export const LazyAccommodationsMapView = dynamic(
  () => import('./map/AccommodationsMapView').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export const LazyTransportationMap = dynamic(
  () => import('./transportation/TransportationMap').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export const LazyActivityMapView = dynamic(
  () => import('./ai/ActivityMapView').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export const LazyItineraryMapView = dynamic(
  () => import('./itinerary/ItineraryMapView').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

export const LazyLocationAutocomplete = dynamic(
  () => import('./map/LocationAutocomplete').catch(() => ({ default: () => <LoadingSpinner /> })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export const LazyDestinationSelector = dynamic(
  () => import('./destination/DestinationSelector').catch(() => ({ default: () => <MapSkeleton /> })),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);



// Calendar component (react-big-calendar is heavy)
export const LazyCalendar = dynamic(() => import('react-big-calendar').then(mod => ({ default: mod.Calendar })), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
});





// Export types for TypeScript
export type LazyComponentType<T = {}> = ComponentType<T>;

// Utility function to create lazy components with custom loading
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent: ComponentType = LoadingSpinner,
  ssr: boolean = false
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr,
  });
}

// Pre-configured lazy loading for common patterns
export const withLazyLoading = {
  map: (Component: () => Promise<{ default: ComponentType<any> }>) =>
    dynamic(Component, { loading: () => <MapSkeleton />, ssr: false }),

  calendar: (Component: () => Promise<{ default: ComponentType<any> }>) =>
    dynamic(Component, { loading: () => <CalendarSkeleton />, ssr: false }),

  wizard: (Component: () => Promise<{ default: ComponentType<any> }>) =>
    dynamic(Component, { loading: () => <WizardSkeleton />, ssr: false }),
};
