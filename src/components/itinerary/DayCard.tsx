import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import ActivityCard from './ActivityCard';
import DraggableActivityCard from './DraggableActivityCard';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  CalendarIcon, 
  PlusIcon,
  ClockIcon,
  DollarSignIcon,
  MoreVerticalIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

type DayCardProps = {
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
  enableDragDrop?: boolean; // New prop
};

export default function DayCard({
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
  onSelectActivity,
  enableDragDrop = false // Default to false
}: DayCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isExpanded);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  const toggleCollapse = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
    setIsCollapsed(!isCollapsed);
  };

  // Calculate summary metrics
  const summary = useMemo(() => {
    const activities = day.activities || [];
    const completed = activities.filter(a => a.status === 'completed').length;
    const total = activities.length;
    const totalCost = activities.reduce((sum, a) => sum + (a.cost || 0), 0);
    const progress = total > 0 ? (completed / total) * 100 : 0;

    // Calculate total duration
    let totalMinutes = 0;
    activities.forEach(activity => {
      if (activity.start_time && activity.end_time) {
        try {
          const start = parseISO(activity.start_time);
          const end = parseISO(activity.end_time);
          const diff = (end.getTime() - start.getTime()) / (1000 * 60);
          totalMinutes += diff;
        } catch (e) {
          // Skip if invalid dates
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      total,
      completed,
      progress,
      totalCost,
      duration: hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}` : `${minutes}m`
    };
  }, [day.activities]);

  return (
    <div className="relative">
      {/* Day Card */}
      <div className="
        glass-card rounded-2xl overflow-hidden 
        border border-white/20 
        hover:shadow-2xl transition-all duration-500
        animate-glass-fade-in
      ">
        {/* Animated Background Orbs */}
        <div className="
          absolute -top-16 -right-16 w-40 h-40 
          bg-gradient-to-br from-blue-500/20 to-purple-500/20 
          rounded-full blur-3xl opacity-30 
          group-hover:opacity-50 transition-all duration-700
        " />
        <div className="
          absolute -bottom-16 -left-16 w-40 h-40 
          bg-gradient-to-br from-purple-500/20 to-pink-500/20 
          rounded-full blur-3xl opacity-20 
          group-hover:opacity-40 transition-all duration-700
        " />

        {/* Header */}
        <div
          className="
            relative z-10 px-4 py-4 sm:px-6 sm:py-5
            bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10
            border-b border-white/10
            cursor-pointer
            hover:bg-white/5 transition-colors duration-300
          "
          onClick={toggleCollapse}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Date */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="
                p-2 rounded-xl 
                bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                backdrop-blur-sm border border-white/20
                flex-shrink-0
              ">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold truncate">
                  {formatDate(day.day_date)}
                </h2>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDay(day);
                }}
                className="
                  p-2 rounded-lg 
                  hover:bg-white/10 
                  transition-colors duration-200
                "
                aria-label="Edit day"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </button>
              
              <button
                className="
                  p-2 rounded-lg 
                  hover:bg-white/10 
                  transition-colors duration-200
                "
                aria-label={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Summary Bar */}
          {!isCollapsed && (
            <div className="mt-4 space-y-3 animate-slide-in-up">
              {/* Metrics */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="
                  flex items-center gap-2 px-3 py-1.5 rounded-lg
                  bg-blue-500/10 border border-blue-500/20
                ">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{summary.total} activities</span>
                </div>

                {summary.totalCost > 0 && (
                  <div className="
                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                    bg-green-500/10 border border-green-500/20
                  ">
                    <DollarSignIcon className="h-4 w-4 text-green-500" />
                    <span className="font-medium">
                      {new Intl.NumberFormat('it-IT', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(summary.totalCost)}
                    </span>
                  </div>
                )}

                {summary.duration !== '0m' && (
                  <div className="
                    flex items-center gap-2 px-3 py-1.5 rounded-lg
                    bg-purple-500/10 border border-purple-500/20
                  ">
                    <ClockIcon className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{summary.duration}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {summary.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{summary.completed} / {summary.total} completed</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${summary.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {day.notes && (
                <div className="
                  p-3 rounded-xl 
                  bg-background/30 border border-white/10
                ">
                  <p className="text-sm text-muted-foreground">
                    {day.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activities */}
        {!isCollapsed && (
          <div className="relative z-10 p-4 sm:p-6 space-y-4 animate-slide-in-up">
            {/* Quick Add Button */}
            <button
              onClick={() => onAddActivity(day.id)}
              className="
                w-full p-4 rounded-xl
                border-2 border-dashed border-blue-500/30
                hover:border-blue-500/50 hover:bg-blue-500/5
                transition-all duration-300
                group
              "
            >
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <PlusIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Add Activity</span>
              </div>
            </button>

            {/* Activities List */}
            {day.activities && day.activities.length > 0 ? (
              <div className="space-y-4">
                {day.activities
                  .sort((a, b) => {
                    if (!a.start_time || !b.start_time) return 0;
                    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                  })
                  .map((activity, index) => {
                    const ActivityComponent = enableDragDrop ? DraggableActivityCard : ActivityCard;
                    
                    return (
                      <div key={activity.id} className="relative">
                        {/* Timeline Connector */}
                        {index < day.activities!.length - 1 && (
                          <div className="
                            absolute left-8 top-full h-4 w-0.5 
                            bg-gradient-to-b from-blue-500/50 to-transparent
                            z-0
                          " />
                        )}
                        
                        <ActivityComponent
                          activity={activity}
                          onEdit={onEditActivity}
                          onDelete={onDeleteActivity}
                          onMove={onMoveActivity}
                          onViewDetails={onViewActivityDetails}
                          isSelectable={selectionMode}
                          isSelected={selectedActivities.includes(activity.id)}
                          onSelectChange={onSelectActivity}
                          {...(enableDragDrop ? { isDragDisabled: selectionMode } : {})}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="
                py-12 text-center 
                border-2 border-dashed border-white/10 rounded-xl
              ">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">No activities yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Click "Add Activity" to start planning this day
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
