import React, { useState, useMemo } from 'react';
import TimelineView from './TimelineView';
import FiltersBar from './FiltersBar';
import FloatingActionButton from './FloatingActionButton';
import BulkActions from './BulkActions';
import DragDropWrapper from './DragDropWrapper';
import DroppableDayCard from './DroppableDayCard';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

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

type FilterState = {
  category: string[];
  priority: number[];
  status: string[];
  searchQuery: string;
  dateRange: { start: Date; end: Date } | null;
};

type ItineraryTimelineViewProps = {
  days: ItineraryDay[];
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onDeleteMultipleActivities: (activityIds: string[]) => void;
  onMoveActivity: (activityId: string, fromDayId: string, toDayId: string) => void;
  onViewActivityDetails?: (activity: Activity) => void;
  enableDragDrop?: boolean;
};

export default function ItineraryTimelineView({
  days,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onDeleteMultipleActivities,
  onMoveActivity,
  onViewActivityDetails,
  enableDragDrop = true
}: ItineraryTimelineViewProps) {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    priority: [],
    status: [],
    searchQuery: '',
    dateRange: null
  });

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Expanded days state
  const [expandedDayIds, setExpandedDayIds] = useState<string[]>([]);

  // Count total activities after filters
  const totalActivitiesCount = useMemo(() => {
    return days.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  }, [days]);

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      category: [],
      priority: [],
      status: [],
      searchQuery: '',
      dateRange: null
    });
  };

  // Toggle day expansion
  const handleToggleDayExpand = (dayId: string) => {
    setExpandedDayIds(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  // Selection handlers
  const handleSelectActivity = (activityId: string, isSelected: boolean) => {
    setSelectedActivities(prev =>
      isSelected
        ? [...prev, activityId]
        : prev.filter(id => id !== activityId)
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedActivities([]);
  };

  // Bulk actions handlers
  const handleBulkMarkComplete = async () => {
    // TODO: Implement bulk complete
    console.log('Mark complete:', selectedActivities);
    handleCancelSelection();
  };

  const handleBulkChangePriority = async (priority: number) => {
    // TODO: Implement bulk priority change
    console.log('Change priority to', priority, 'for:', selectedActivities);
    handleCancelSelection();
  };

  const handleBulkMoveToDay = async (dayId: string) => {
    // TODO: Implement bulk move
    console.log('Move to day', dayId, 'activities:', selectedActivities);
    handleCancelSelection();
  };

  const handleBulkDelete = async () => {
    await onDeleteMultipleActivities(selectedActivities);
    handleCancelSelection();
  };

  // Available days for bulk move
  const availableDays = useMemo(() => {
    return days.map(day => ({
      id: day.id,
      label: format(parseISO(day.day_date), 'EEEE d MMMM yyyy', { locale: it })
    }));
  }, [days]);

  // Wrap content with DragDropWrapper if enabled
  const content = (
    <>
      {/* Filters Bar */}
      <div className="mb-6">
        <FiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          totalResults={totalActivitiesCount}
        />
      </div>

      {/* Timeline View with DroppableDayCards */}
      <TimelineView
        days={days}
        onEditDay={onEditDay}
        onAddActivity={onAddActivity}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
        onMoveActivity={(activity) => {
          // This is for the move button in ActivityCard
          // Actual drag & drop is handled by DragDropWrapper
          console.log('Move activity (button):', activity);
        }}
        onViewActivityDetails={onViewActivityDetails}
        expandedDayIds={expandedDayIds}
        onToggleDayExpand={handleToggleDayExpand}
        selectionMode={selectionMode}
        selectedActivities={selectedActivities}
        onSelectActivity={handleSelectActivity}
        enableDragDrop={enableDragDrop}
        filters={filters}
      />

      {/* Floating Action Button (Mobile) */}
      {!selectionMode && (
        <FloatingActionButton
          onClick={() => {
            // Add to first day or show day picker
            if (days.length > 0) {
              onAddActivity(days[0].id);
            }
          }}
        />
      )}

      {/* Bulk Actions Toolbar */}
      {selectionMode && selectedActivities.length > 0 && (
        <BulkActions
          selectedCount={selectedActivities.length}
          onMarkComplete={handleBulkMarkComplete}
          onChangePriority={handleBulkChangePriority}
          onMoveToDay={handleBulkMoveToDay}
          onDelete={handleBulkDelete}
          onCancel={handleCancelSelection}
          availableDays={availableDays}
        />
      )}
    </>
  );

  // Wrap with DragDropWrapper if enabled
  if (enableDragDrop) {
    return (
      <DragDropWrapper onActivityMove={onMoveActivity}>
        {content}
      </DragDropWrapper>
    );
  }

  return content;
}
