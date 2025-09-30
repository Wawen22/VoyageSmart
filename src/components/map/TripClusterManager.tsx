'use client';

import { useEffect, useRef } from 'react';

interface Trip {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  status: 'upcoming' | 'ongoing' | 'completed' | 'planning';
}

interface TripClusterManagerProps {
  map: any;
  mapboxgl: any;
  trips: Trip[];
  onTripClick: (trip: Trip) => void;
  onClusterClick: (clusterId: string, coordinates: [number, number]) => void;
}

export default function TripClusterManager({
  map,
  mapboxgl,
  trips,
  onTripClick,
  onClusterClick
}: TripClusterManagerProps) {
  const clustersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !mapboxgl || trips.length === 0) return;

    // Clear existing clusters
    clustersRef.current.forEach(cluster => cluster.remove());
    clustersRef.current = [];

    // Group trips by proximity (simple clustering)
    const clusters = createClusters(trips, 0.01); // 0.01 degree threshold

    clusters.forEach(cluster => {
      if (cluster.trips.length === 1) {
        // Single trip marker
        const trip = cluster.trips[0];
        const marker = createSingleTripMarker(trip, map, mapboxgl, onTripClick);
        clustersRef.current.push(marker);
      } else {
        // Cluster marker
        const clusterMarker = createClusterMarker(cluster, map, mapboxgl, onClusterClick);
        clustersRef.current.push(clusterMarker);
      }
    });

    return () => {
      clustersRef.current.forEach(cluster => cluster.remove());
      clustersRef.current = [];
    };
  }, [map, mapboxgl, trips, onTripClick, onClusterClick]);

  return null; // This component doesn't render anything directly
}

interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  trips: Trip[];
}

function createClusters(trips: Trip[], threshold: number): Cluster[] {
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  trips.forEach(trip => {
    if (processed.has(trip.id)) return;

    const cluster: Cluster = {
      id: `cluster-${trip.id}`,
      center: trip.coordinates,
      trips: [trip]
    };

    // Find nearby trips
    trips.forEach(otherTrip => {
      if (otherTrip.id === trip.id || processed.has(otherTrip.id)) return;

      const distance = calculateDistance(
        trip.coordinates.lat,
        trip.coordinates.lng,
        otherTrip.coordinates.lat,
        otherTrip.coordinates.lng
      );

      if (distance < threshold) {
        cluster.trips.push(otherTrip);
        processed.add(otherTrip.id);
      }
    });

    processed.add(trip.id);
    clusters.push(cluster);
  });

  return clusters;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function createSingleTripMarker(trip: Trip, map: any, mapboxgl: any, onTripClick: (trip: Trip) => void) {
  const el = document.createElement('div');
  el.className = 'trip-marker';
  
  const statusConfig = getStatusConfig(trip.status);
  
  el.innerHTML = `
    <div class="relative group cursor-pointer">
      <div class="w-10 h-10 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border-3 shadow-lg transform transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
      </div>
      ${statusConfig.pulseClass ? `<div class="absolute inset-0 rounded-full ${statusConfig.pulseClass} animate-ping opacity-75"></div>` : ''}
    </div>
  `;

  el.addEventListener('click', () => onTripClick(trip));

  return new mapboxgl.Marker(el)
    .setLngLat([trip.coordinates.lng, trip.coordinates.lat])
    .addTo(map);
}

function createClusterMarker(cluster: Cluster, map: any, mapboxgl: any, onClusterClick: (clusterId: string, coordinates: [number, number]) => void) {
  const el = document.createElement('div');
  el.className = 'cluster-marker';
  
  const size = Math.min(50, Math.max(30, cluster.trips.length * 8));
  
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.lineHeight = `${size}px`;
  el.style.fontSize = `${Math.max(12, size / 4)}px`;
  
  el.innerHTML = cluster.trips.length.toString();

  el.addEventListener('click', () => {
    onClusterClick(cluster.id, [cluster.center.lng, cluster.center.lat]);
  });

  return new mapboxgl.Marker(el)
    .setLngLat([cluster.center.lng, cluster.center.lat])
    .addTo(map);
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'upcoming':
      return {
        bgColor: 'bg-emerald-500',
        borderColor: 'border-emerald-300',
        pulseClass: 'bg-emerald-400'
      };
    case 'ongoing':
      return {
        bgColor: 'bg-orange-500',
        borderColor: 'border-orange-300',
        pulseClass: 'bg-orange-400'
      };
    case 'completed':
      return {
        bgColor: 'bg-purple-500',
        borderColor: 'border-purple-300',
        pulseClass: null
      };
    default:
      return {
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-300',
        pulseClass: null
      };
  }
}
