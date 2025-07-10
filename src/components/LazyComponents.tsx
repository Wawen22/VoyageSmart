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
export const LazyTripMap = dynamic(() => import('./TripMap'), {
  loading: () => <MapSkeleton />,
  ssr: false,
});

export const LazyAIWizard = dynamic(() => import('./ai/AIWizard'), {
  loading: () => <WizardSkeleton />,
  ssr: false,
});

export const LazyAIAssistant = dynamic(() => import('./ai/AIAssistant'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Calendar component (react-big-calendar is heavy)
export const LazyCalendar = dynamic(() => import('react-big-calendar').then(mod => ({ default: mod.Calendar })), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
});

// Chart components (if using recharts or similar)
export const LazyChart = dynamic(() => import('./charts/Chart'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Heavy form components
export const LazyRichTextEditor = dynamic(() => import('./forms/RichTextEditor'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// File upload components
export const LazyFileUpload = dynamic(() => import('./upload/FileUpload'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Admin components (only loaded for admin users)
export const LazyAdminDashboard = dynamic(() => import('./admin/AdminDashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export const LazyUserManagement = dynamic(() => import('./admin/UserManagement'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Subscription components
export const LazySubscriptionModal = dynamic(() => import('./subscription/SubscriptionModal'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// Documentation components
export const LazyDocumentation = dynamic(() => import('./documentation/Documentation'), {
  loading: () => <LoadingSpinner />,
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
    loading: LoadingComponent,
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
  
  admin: (Component: () => Promise<{ default: ComponentType<any> }>) =>
    dynamic(Component, { loading: () => <LoadingSpinner />, ssr: false }),
};
