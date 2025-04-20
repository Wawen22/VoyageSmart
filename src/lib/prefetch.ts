import { useRouter } from 'next/navigation';

/**
 * Creates a function to prefetch common routes to improve navigation performance
 * Must be used within a component that has access to the router
 */
export function createPrefetchFunction(router: ReturnType<typeof useRouter>) {
  return function prefetchRoutes() {
    try {
      // Prefetch dashboard and common routes
      router.prefetch('/dashboard');
      router.prefetch('/trips/new');

      // Add more routes as needed

      // Note: We don't prefetch dynamic routes like /trips/[id]
      // as we don't know the IDs in advance
    } catch (error) {
      // Silent fail - prefetching is an optimization, not critical functionality
      console.error('Error prefetching routes:', error);
    }
  };
}
