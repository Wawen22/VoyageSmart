import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import DayCard from './DayCard';

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

type DroppableDayCardProps = {
  day: ItineraryDay;
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
  onViewActivityDetails?: (activity: Activity) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  selectionMode?: boolean;
  selectedActivities?: string[];
  onSelectActivity?: (activityId: string, isSelected: boolean) => void;
};

export default function DroppableDayCard({
  day,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveActivity,
  onViewActivityDetails,
  isExpanded = false,
  onToggleExpand,
  selectionMode = false,
  selectedActivities = [],
  onSelectActivity
}: DroppableDayCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: day.id,
    data: {
      type: 'day',
      day
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        transition-all duration-300 rounded-2xl
        ${isOver ? 'ring-4 ring-blue-500/50 scale-[1.02]' : ''}
      `}
    >
      <DayCard
        day={day}
        onEditDay={onEditDay}
        onAddActivity={onAddActivity}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
        onMoveActivity={onMoveActivity}
        onViewActivityDetails={onViewActivityDetails}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        selectionMode={selectionMode}
        selectedActivities={selectedActivities}
        onSelectActivity={onSelectActivity}
        enableDragDrop={true}
      />
      
      {/* Drop Zone Indicator */}
      {isOver && (
        <div className="
          absolute inset-0 rounded-2xl
          bg-blue-500/10 backdrop-blur-sm
          border-2 border-dashed border-blue-500/50
          flex items-center justify-center
          pointer-events-none
          z-50
          animate-pulse
        ">
          <div className="
            px-6 py-3 rounded-xl
            bg-blue-500/20 backdrop-blur-sm
            border border-blue-500/50
            text-blue-600 font-semibold
          ">
            Drop activity here
          </div>
        </div>
      )}
    </div>
  );
}
