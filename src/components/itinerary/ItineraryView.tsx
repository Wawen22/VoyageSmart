"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store";
import { fetchTripItinerary } from "@/lib/features/itinerarySlice";
import { format } from "date-fns";
import DaySchedule from "./DaySchedule";

interface Props {
  tripId: string;
}

export default function ItineraryView({ tripId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { days, activities, loading, error } = useSelector(
    (state: RootState) => state.itinerary
  );

  useEffect(() => {
    dispatch(fetchTripItinerary(tripId));
  }, [dispatch, tripId]);

  if (loading) {
    return <div>Loading itinerary...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-4">No itinerary days added yet</h3>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
          onClick={() => {
            // TODO: Implement add day functionality
          }}
        >
          Add First Day
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trip Itinerary</h2>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
          onClick={() => {
            // TODO: Implement add day functionality
          }}
        >
          Add Day
        </button>
      </div>

      <div className="space-y-8">
        {days.map((day) => {
          // Ensure day has activities property
          const dayWithActivities = {
            ...day,
            activities: activities.filter((a) => a.day_id === day.id)
          };

          return (
            <DaySchedule
              key={day.id}
              day={dayWithActivities}
              onEditDay={(day) => {
                // TODO: Implement edit day functionality
                console.log('Edit day:', day);
              }}
              onAddActivity={(dayId) => {
                // TODO: Implement add activity functionality
                console.log('Add activity to day:', dayId);
              }}
              onEditActivity={(activity) => {
                // TODO: Implement edit activity functionality
                console.log('Edit activity:', activity);
              }}
              onDeleteActivity={(activityId) => {
                // TODO: Implement delete activity functionality
                console.log('Delete activity:', activityId);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
