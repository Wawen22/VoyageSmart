'use client';

import { useState, useRef } from 'react';
import ItineraryListView from '@/components/itinerary/ItineraryListView';
import ItineraryMapView from '@/components/itinerary/ItineraryMapView';

// Mock data for testing
const mockDays = [
  {
    id: '1',
    trip_id: 'test',
    day_date: '2024-06-15T00:00:00Z',
    notes: 'First day in Rome - exploring the city',
    weather_forecast: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    activities: [
      {
        id: 'acc1',
        trip_id: 'test',
        day_id: '1',
        name: 'Check-in Hotel Colosseo',
        type: 'accommodation',
        start_time: '2024-06-15T08:00:00Z',
        end_time: '2024-06-15T08:30:00Z',
        location: 'Via Capo d\'Africa 54, Rome',
        booking_reference: 'HOTEL-12345',
        priority: 1,
        cost: 150,
        currency: 'EUR',
        notes: 'Breakfast included, Pool on rooftop',
        status: 'confirmed'
      },
      {
        id: 'a1',
        trip_id: 'test',
        day_id: '1',
        name: 'Colosseum Tour',
        type: 'culture',
        start_time: '2024-06-15T09:00:00Z',
        end_time: '2024-06-15T11:30:00Z',
        location: 'Piazza del Colosseo, Rome',
        booking_reference: 'COL-12345',
        priority: 1,
        cost: 25,
        currency: 'EUR',
        notes: 'Book tickets online to skip the line',
        status: 'confirmed'
      },
      {
        id: 'a2',
        trip_id: 'test',
        day_id: '1',
        name: 'Lunch at Trattoria',
        type: 'food',
        start_time: '2024-06-15T13:00:00Z',
        end_time: '2024-06-15T14:30:00Z',
        location: 'Trastevere District',
        booking_reference: null,
        priority: 2,
        cost: 40,
        currency: 'EUR',
        notes: 'Try the carbonara',
        status: 'pending'
      },
      {
        id: 'a3',
        trip_id: 'test',
        day_id: '1',
        name: 'Vatican Museums',
        type: 'culture',
        start_time: '2024-06-15T15:30:00Z',
        end_time: '2024-06-15T18:00:00Z',
        location: 'Vatican City',
        booking_reference: 'VAT-67890',
        priority: 1,
        cost: 30,
        currency: 'EUR',
        notes: 'Audio guide included',
        status: 'confirmed'
      }
    ]
  },
  {
    id: '2',
    trip_id: 'test',
    day_date: '2024-06-16T00:00:00Z',
    notes: 'Day trip to Florence',
    weather_forecast: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    activities: [
      {
        id: 'acc2',
        trip_id: 'test',
        day_id: '2',
        name: 'Hotel Check-out',
        type: 'accommodation',
        start_time: '2024-06-16T06:00:00Z',
        end_time: '2024-06-16T06:30:00Z',
        location: 'Via Capo d\'Africa 54, Rome',
        booking_reference: 'HOTEL-12345',
        priority: 1,
        cost: 0,
        currency: 'EUR',
        notes: 'Check-out and head to train station',
        status: 'confirmed'
      },
      {
        id: 'a4',
        trip_id: 'test',
        day_id: '2',
        name: 'Train to Florence',
        type: 'transport',
        start_time: '2024-06-16T07:00:00Z',
        end_time: '2024-06-16T08:30:00Z',
        location: 'Roma Termini → Firenze SMN',
        booking_reference: 'TRAIN-99999',
        priority: 1,
        cost: 35,
        currency: 'EUR',
        notes: 'Platform 12',
        status: 'confirmed'
      },
      {
        id: 'a5',
        trip_id: 'test',
        day_id: '2',
        name: 'Uffizi Gallery',
        type: 'culture',
        start_time: '2024-06-16T10:00:00Z',
        end_time: '2024-06-16T13:00:00Z',
        location: 'Piazzale degli Uffizi, Florence',
        booking_reference: null,
        priority: 2,
        cost: 20,
        currency: 'EUR',
        notes: null,
        status: 'pending'
      }
    ]
  },
  {
    id: '3',
    trip_id: 'test',
    day_date: '2024-06-17T00:00:00Z',
    notes: null,
    weather_forecast: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    activities: [
      {
        id: 'a6',
        trip_id: 'test',
        day_id: '3',
        name: 'Hotel Check-out',
        type: 'accommodation',
        start_time: '2024-06-17T11:00:00Z',
        end_time: '2024-06-17T11:30:00Z',
        location: 'Hotel Roma Centro',
        booking_reference: 'HOTEL-11111',
        priority: 1,
        cost: 0,
        currency: 'EUR',
        notes: 'Late checkout arranged',
        status: 'confirmed'
      }
    ]
  }
];

export default function ItineraryTestPage() {
  const [days, setDays] = useState(mockDays);

  const handleMoveActivity = (activityId: string, fromDayId: string, toDayId: string) => {
    console.log('Move activity', activityId, 'from', fromDayId, 'to', toDayId);
    
    // Update state optimistically
    setDays(prevDays => {
      const newDays = [...prevDays];
      const fromDay = newDays.find(d => d.id === fromDayId);
      const toDay = newDays.find(d => d.id === toDayId);
      
      if (fromDay && toDay) {
        const activityIndex = fromDay.activities?.findIndex(a => a.id === activityId);
        if (activityIndex !== undefined && activityIndex >= 0 && fromDay.activities) {
          const activity = fromDay.activities[activityIndex];
          fromDay.activities = fromDay.activities.filter(a => a.id !== activityId);
          
          if (!toDay.activities) toDay.activities = [];
          toDay.activities.push({ ...activity, day_id: toDayId });
        }
      }
      
      return newDays;
    });
  };

  // Flatten activities for map view and sequential numbering
  const allActivities = days.flatMap(day => 
    day.activities?.map(activity => ({
      ...activity,
      dayDate: day.day_date
    })) || []
  );

  // State for list-map synchronization
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);

  const handleActivityClick = (activity: any, index: number) => {
    console.log('Activity clicked:', activity, 'index:', index);
    setSelectedActivityIndex(index);
  };

  const handleMarkerClick = (index: number) => {
    console.log('Marker clicked, index:', index);
    setSelectedActivityIndex(index);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="glass-grid-pattern" />
      
      {/* Header consistente con altre sezioni */}
      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-foreground via-blue-500 to-foreground bg-clip-text text-transparent">
              Itinerary Timeline Test
            </span>
          </h1>
          <p className="text-muted-foreground">
            Testing the new split-screen design with drag & drop functionality
          </p>
        </div>

        {/* Split-screen layout: list left, map right */}
        <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-240px)] min-h-[600px] rounded-xl overflow-hidden border border-border/30">
          
          {/* Left Panel: Activity List with shadow */}
          <div className="w-full lg:w-1/2 h-full overflow-hidden relative shadow-2xl lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] dark:lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.6)] z-10">
            <ItineraryListView
              days={days}
              onAddActivity={(dayId) => console.log('Add activity to day:', dayId)}
              onEditActivity={(activity) => console.log('Edit activity:', activity)}
              onDeleteActivity={(activityId) => console.log('Delete activity:', activityId)}
              onActivityClick={handleActivityClick}
              selectedActivityIndex={selectedActivityIndex}
              enableDragDrop={true}
              onMoveActivity={handleMoveActivity}
            />
        </div>

        {/* Right Panel: Map View (hidden on mobile) */}
        <div className="hidden lg:block lg:w-1/2 h-full">
          <ItineraryMapView
            activities={allActivities}
            selectedActivityIndex={selectedActivityIndex}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        </div>
      </div>
    </div>
  );
}
