import React from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import ActivityItem from './ActivityItem';

type Activity = {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
};

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

type DayScheduleProps = {
  day: ItineraryDay;
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
  onViewActivityDetails?: (activity: Activity) => void;
};

export default function DaySchedule({
  day,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveActivity,
  onViewActivityDetails
}: DayScheduleProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-card shadow rounded-lg overflow-hidden">
      <div className="px-3 py-3 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-muted/30">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
          {formatDate(day.day_date)}
        </h2>
        <div className="flex space-x-2">
          <button
            className="text-primary hover:text-primary/90 text-xs sm:text-sm font-medium flex items-center"
            onClick={() => onEditDay(day)}
            aria-label="Edit day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span>Edit Day</span>
          </button>
          <button
            className="text-primary hover:text-primary/90 text-xs sm:text-sm font-medium flex items-center"
            onClick={() => onAddActivity(day.id)}
            aria-label="Add activity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      <div className="px-3 py-3 sm:px-6 sm:py-5">
        {day.notes && (
          <div className="mb-4 bg-muted/20 p-3 rounded-md">
            <h3 className="text-sm font-medium text-foreground mb-1">Notes:</h3>
            <p className="text-sm text-muted-foreground">{day.notes}</p>
          </div>
        )}

        {day.activities && day.activities.length > 0 ? (
          <div className="space-y-4">
            {day.activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onMove={onMoveActivity}
                onViewDetails={onViewActivityDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No activities planned for this day yet.</p>
            <button
              className="mt-2 text-primary hover:text-primary/90 text-sm font-medium"
              onClick={() => onAddActivity(day.id)}
            >
              Add an activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}