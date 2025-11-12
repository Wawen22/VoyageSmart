import React, { useMemo, useRef, useEffect } from 'react';
import DayCard from './DayCard';
import DroppableDayCard from './DroppableDayCard';

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

type TimelineViewProps = {
  days: ItineraryDay[];
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
  onViewActivityDetails?: (activity: Activity) => void;
  expandedDayIds?: string[];
  onToggleDayExpand?: (dayId: string) => void;
  selectionMode?: boolean;
  selectedActivities?: string[];
  onSelectActivity?: (activityId: string, isSelected: boolean) => void;
  enableDragDrop?: boolean; // New prop
  filters?: {
    category?: string[];
    priority?: number[];
    status?: string[];
    searchQuery?: string;
    dateRange?: { start: Date; end: Date };
  };
};

export default function TimelineView({
  days,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveActivity,
  onViewActivityDetails,
  expandedDayIds = [],
  onToggleDayExpand,
  selectionMode = false,
  selectedActivities = [],
  onSelectActivity,
  enableDragDrop = false, // Default to false
  filters
}: TimelineViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Filter days based on filters prop
  const filteredDays = useMemo(() => {
    if (!filters) return days;

    return days
      .map(day => {
        // Filter activities within each day
        let filteredActivities = day.activities || [];

        // Filter by category
        if (filters.category && filters.category.length > 0) {
          filteredActivities = filteredActivities.filter(activity =>
            filters.category!.includes(activity.type || '')
          );
        }

        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
          filteredActivities = filteredActivities.filter(activity =>
            filters.priority!.includes(activity.priority)
          );
        }

        // Filter by status
        if (filters.status && filters.status.length > 0) {
          filteredActivities = filteredActivities.filter(activity =>
            filters.status!.includes(activity.status)
          );
        }

        // Filter by search query
        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          filteredActivities = filteredActivities.filter(activity =>
            activity.name.toLowerCase().includes(query) ||
            (activity.location && activity.location.toLowerCase().includes(query)) ||
            (activity.notes && activity.notes.toLowerCase().includes(query))
          );
        }

        // Filter by date range
        if (filters.dateRange) {
          const dayDate = new Date(day.day_date);
          const { start, end } = filters.dateRange;
          if (dayDate < start || dayDate > end) {
            filteredActivities = [];
          }
        }

        return {
          ...day,
          activities: filteredActivities
        };
      })
      .filter(day => {
        // Only show days with activities (after filtering) or no filters applied
        if (!filters.category && !filters.priority && !filters.status && !filters.searchQuery) {
          return true;
        }
        return (day.activities && day.activities.length > 0);
      });
  }, [days, filters]);

  // Scroll to today's date on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = filteredDays.findIndex(day => 
      day.day_date.split('T')[0] === today
    );
    
    if (todayIndex !== -1 && timelineRef.current) {
      const dayCards = timelineRef.current.querySelectorAll('[data-day-card]');
      if (dayCards[todayIndex]) {
        dayCards[todayIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  if (filteredDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="glass-card p-12 rounded-3xl text-center max-w-md">
          <div className="
            w-20 h-20 mx-auto mb-6 rounded-full 
            bg-gradient-to-br from-blue-500/20 to-purple-500/20 
            flex items-center justify-center
          ">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">No Days Found</h3>
          <p className="text-muted-foreground">
            {filters ? 
              'No days match your current filters. Try adjusting your search.' : 
              'Start planning your trip by adding your first day.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={timelineRef}
      className="relative max-w-5xl mx-auto px-4 py-6 space-y-8"
    >
      {/* Timeline Backbone (Visual Connector) */}
      <div className="
        absolute left-8 top-0 bottom-0 w-1
        bg-gradient-to-b from-blue-500/30 via-purple-500/30 to-blue-500/30
        hidden md:block
      " />

      {/* Day Cards */}
      {filteredDays.map((day, index) => (
        <div 
          key={day.id}
          data-day-card
          className="relative animate-slide-in-up"
          style={{ 
            animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
            animationFillMode: 'both'
          }}
        >
          {/* Timeline Node */}
          <div className="
            absolute left-8 top-8 -translate-x-1/2
            w-6 h-6 rounded-full
            bg-gradient-to-br from-blue-500 to-purple-500
            border-4 border-background
            shadow-xl shadow-blue-500/50
            z-20
            hidden md:block
          " />

          {/* Day Card */}
          <div className="md:ml-20">
            {enableDragDrop ? (
              <DroppableDayCard
                day={day}
                onEditDay={onEditDay}
                onAddActivity={onAddActivity}
                onEditActivity={onEditActivity}
                onDeleteActivity={onDeleteActivity}
                onMoveActivity={onMoveActivity}
                onViewActivityDetails={onViewActivityDetails}
                isExpanded={expandedDayIds.includes(day.id)}
                onToggleExpand={() => onToggleDayExpand?.(day.id)}
                selectionMode={selectionMode}
                selectedActivities={selectedActivities}
                onSelectActivity={onSelectActivity}
              />
            ) : (
              <DayCard
                day={day}
                onEditDay={onEditDay}
                onAddActivity={onAddActivity}
                onEditActivity={onEditActivity}
                onDeleteActivity={onDeleteActivity}
                onMoveActivity={onMoveActivity}
                onViewActivityDetails={onViewActivityDetails}
                isExpanded={expandedDayIds.includes(day.id)}
                onToggleExpand={() => onToggleDayExpand?.(day.id)}
                selectionMode={selectionMode}
                selectedActivities={selectedActivities}
                onSelectActivity={onSelectActivity}
                enableDragDrop={false}
              />
            )}
          </div>

          {/* Connecting Line to Next Day */}
          {index < filteredDays.length - 1 && (
            <div className="
              absolute left-8 top-full -translate-x-1/2
              w-0.5 h-8
              bg-gradient-to-b from-purple-500/50 to-transparent
              z-10
              hidden md:block
            " />
          )}
        </div>
      ))}

      {/* End of Timeline Indicator */}
      <div className="
        relative md:ml-20 pt-4 pb-2
        flex items-center justify-center
        animate-slide-in-up
      " style={{ animationDelay: `${Math.min(filteredDays.length * 0.05, 0.5)}s` }}>
        <div className="
          glass-card px-6 py-3 rounded-full
          border border-white/20
          text-sm text-muted-foreground
        ">
          End of itinerary • {filteredDays.length} {filteredDays.length === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
}
