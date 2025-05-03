'use client';

import { useState, useEffect } from 'react';
import ActivityMapView from '@/components/ai/ActivityMapView';
import { Activity } from '@/lib/features/itinerarySlice';
import { format, parseISO } from 'date-fns';

type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
  created_at: string;
  updated_at: string;
  activities?: Activity[];
};

// Adattatore per convertire Activity in GeneratedActivity
const adaptActivityForMap = (activity: Activity, dayDate: string) => {
  return {
    name: activity.name,
    type: activity.type || 'default',
    start_time: activity.start_time,
    end_time: activity.end_time,
    location: activity.location,
    booking_reference: activity.booking_reference,
    priority: activity.priority || 2,
    cost: activity.cost,
    currency: activity.currency || 'EUR',
    notes: activity.notes,
    status: activity.status || 'planned',
    day_id: activity.day_id,
    day_date: dayDate,
    coordinates: activity.coordinates ? {
      x: typeof activity.coordinates === 'string' 
        ? parseFloat(activity.coordinates.replace(/[()]/g, '').split(',')[0]) 
        : activity.coordinates.x,
      y: typeof activity.coordinates === 'string' 
        ? parseFloat(activity.coordinates.replace(/[()]/g, '').split(',')[1]) 
        : activity.coordinates.y
    } : null
  };
};

interface ItineraryMapViewProps {
  days: ItineraryDay[];
  onViewActivityDetails: (activity: Activity) => void;
  onUpdateCoordinates?: (activity: Activity, coordinates: { x: number; y: number }) => void;
}

export default function ItineraryMapView({ 
  days, 
  onViewActivityDetails,
  onUpdateCoordinates
}: ItineraryMapViewProps) {
  const [allActivities, setAllActivities] = useState<any[]>([]);

  // Prepara tutte le attività per la mappa
  useEffect(() => {
    const activities: any[] = [];
    
    days.forEach(day => {
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach(activity => {
          activities.push(adaptActivityForMap(activity, day.day_date));
        });
      }
    });
    
    setAllActivities(activities);
  }, [days]);

  // Gestisce il click su un marker
  const handleMarkerClick = (adaptedActivity: any) => {
    // Trova l'attività originale
    for (const day of days) {
      if (day.activities) {
        const originalActivity = day.activities.find(a => a.id === adaptedActivity.id);
        if (originalActivity) {
          onViewActivityDetails(originalActivity);
          break;
        }
      }
    }
  };

  // Gestisce l'aggiornamento delle coordinate
  const handleCoordinatesUpdate = (adaptedActivity: any, coordinates: { x: number; y: number }) => {
    if (!onUpdateCoordinates) return;

    // Trova l'attività originale
    for (const day of days) {
      if (day.activities) {
        const originalActivity = day.activities.find(a => a.id === adaptedActivity.id);
        if (originalActivity) {
          onUpdateCoordinates(originalActivity, coordinates);
          break;
        }
      }
    }
  };

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium">Mappa delle Attività</h3>
        <p className="text-xs text-muted-foreground">
          Visualizza tutte le attività del tuo itinerario sulla mappa
        </p>
      </div>
      
      <div className="p-0">
        {allActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h4 className="font-medium mb-2">Nessuna attività da visualizzare</h4>
            <p className="text-sm text-muted-foreground">
              Aggiungi attività con location al tuo itinerario per visualizzarle sulla mappa
            </p>
          </div>
        ) : (
          <ActivityMapView 
            activities={allActivities}
            height="500px"
            onMarkerClick={handleMarkerClick}
            onCoordinatesUpdate={handleCoordinatesUpdate}
          />
        )}
      </div>
    </div>
  );
}
