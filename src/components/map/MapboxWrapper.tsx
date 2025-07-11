'use client';

import { useEffect, useRef, useState } from 'react';

// Type definitions for Mapbox GL JS
interface MapboxGL {
  accessToken: string;
  Map: any;
  Marker: any;
  Popup: any;
  NavigationControl: any;
  LngLatBounds: any;
}

interface MapboxWrapperProps {
  children: (mapboxgl: MapboxGL) => React.ReactNode;
  fallback?: React.ReactNode;
}

export default function MapboxWrapper({ children, fallback }: MapboxWrapperProps) {
  const [mapboxgl, setMapboxgl] = useState<MapboxGL | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load Mapbox on the client side
    if (typeof window !== 'undefined') {
      const loadMapbox = async () => {
        try {
          const mapboxModule = await import('mapbox-gl');
          await import('mapbox-gl/dist/mapbox-gl.css');

          // Set the access token
          mapboxModule.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

          setMapboxgl(mapboxModule.default);
          setIsLoading(false);
        } catch (err) {
          console.error('Failed to load Mapbox GL JS:', err);
          setError('Failed to load map library');
          setIsLoading(false);
        }
      };

      loadMapbox();
    }
  }, []);

  if (isLoading) {
    return (
      fallback || (
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
        </div>
      )
    );
  }

  if (error || !mapboxgl) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          {error || 'Map unavailable'}
        </div>
      </div>
    );
  }

  return <>{children(mapboxgl)}</>;
}
