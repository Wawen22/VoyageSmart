'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  CalendarIcon,
  UtensilsIcon,
  LandmarkIcon,
  CarIcon,
  PlaneIcon,
  BedIcon,
  MoreVerticalIcon,
  PlusIcon,
  FilterIcon,
  GripVerticalIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

type Day = {
  id: string;
  trip_id: string;
  date?: string; // Optional for flexibility
  day_date?: string; // Alternative field name
  activities?: Activity[];
  notes?: string | null;
  weather_forecast?: any;
  created_at?: string;
  updated_at?: string;
};

type ItineraryListViewProps = {
  days: Day[];
  onAddActivity?: (dayId: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
  onActivityClick?: (activity: Activity, index: number) => void;
  selectedActivityIndex?: number | null;
  enableDragDrop?: boolean;
  onMoveActivity?: (activityId: string, fromDayId: string, toDayId: string) => void;
};

export default function ItineraryListView({
  days,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onActivityClick,
  selectedActivityIndex,
  enableDragDrop = false,
  onMoveActivity
}: ItineraryListViewProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Safety check for days
  if (!days || !Array.isArray(days)) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <p className="text-muted-foreground">No itinerary data available</p>
      </div>
    );
  }

  const getCategoryIcon = (type: string | null) => {
    const typeStr = type?.toLowerCase();
    switch (typeStr) {
      case 'food':
      case 'restaurant':
        return UtensilsIcon;
      case 'culture':
      case 'activity':
      case 'sightseeing':
        return LandmarkIcon;
      case 'transport':
      case 'car':
      case 'train':
      case 'bus':
        return CarIcon;
      case 'flight':
      case 'plane':
        return PlaneIcon;
      case 'accommodation':
      case 'hotel':
      case 'lodging':
        return BedIcon;
      default:
        return MapPinIcon;
    }
  };

  const getCategoryColor = (type: string | null) => {
    const typeStr = type?.toLowerCase();
    switch (typeStr) {
      case 'food':
      case 'restaurant':
        return 'text-orange-500 bg-orange-500/10';
      case 'culture':
      case 'activity':
      case 'sightseeing':
        return 'text-purple-500 bg-purple-500/10';
      case 'transport':
      case 'car':
      case 'train':
      case 'bus':
        return 'text-blue-500 bg-blue-500/10';
      case 'flight':
      case 'plane':
        return 'text-cyan-500 bg-cyan-500/10';
      case 'accommodation':
      case 'hotel':
      case 'lodging':
        return 'text-teal-500 bg-teal-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  let activityCounter = 0;

  // Drag & Drop setup
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onMoveActivity) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination days
    let fromDayId = '';
    let toDayId = '';

    for (const day of days) {
      if (day.activities?.some(a => a.id === activeId)) {
        fromDayId = day.id;
      }
      if (day.activities?.some(a => a.id === overId)) {
        toDayId = day.id;
      }
      // Check if dropped on day container
      if (overId === `day-${day.id}`) {
        toDayId = day.id;
      }
    }

    if (fromDayId && toDayId && fromDayId !== toDayId) {
      onMoveActivity(activeId, fromDayId, toDayId);
    }
  };

  // Component for sortable activity
  const SortableActivity = ({ activity, index, dayId }: { activity: Activity; index: number; dayId: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: activity.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const Icon = getCategoryIcon(activity.type);
    const time = formatTime(activity.start_time);
    const cost = formatCurrency(activity.cost, activity.currency);
    const isSelected = selectedActivityIndex === index;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group flex items-center gap-3 px-4 py-2.5 
          hover:bg-white/5 cursor-pointer transition-colors
          ${isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''}
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        onClick={() => onActivityClick?.(activity, index)}
      >
        {/* Drag Handle */}
        {enableDragDrop && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVerticalIcon className="h-4 w-4" />
          </div>
        )}

        {/* Number Badge */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
          {index + 1}
        </div>

        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${getCategoryColor(activity.type)} flex items-center justify-center`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activity.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {time && (
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {time}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1 truncate max-w-[100px]">
                <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{activity.location}</span>
              </span>
            )}
            {cost && (
              <span className="flex items-center gap-1">
                <DollarSignIcon className="h-3 w-3" />
                {cost}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVerticalIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log('View', activity)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditActivity?.(activity)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteActivity?.(activity.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold">Itinerary</h2>
          <p className="text-sm text-muted-foreground">
            {days.length} {days.length === 1 ? 'giorno' : 'giorni'}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            p-2 rounded-lg transition-colors
            ${showFilters ? 'bg-white/20' : 'hover:bg-white/10'}
          `}
          aria-label="Toggle filters"
        >
          <FilterIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1">
        {days.map((day) => {
          const dayDate = parseISO(day.date || day.day_date || new Date().toISOString());
          const dayActivities = day.activities || [];

          return (
            <div key={day.id} className="border-b border-white/5 last:border-b-0" id={`day-${day.id}`}>
              {/* Day Header - Minimal */}
              <div className="sticky top-0 z-10 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-md border-b border-white/10 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {format(dayDate, 'EEEE', { locale: it })}
                      </span>
                      <span className="text-lg font-semibold">
                        {format(dayDate, 'd MMMM yyyy', { locale: it })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{dayActivities.length} attività</span>
                    {onAddActivity && (
                      <button
                        onClick={() => onAddActivity(day.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Add activity"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Activities List - With Drag & Drop */}
              <div className="py-2">
                {dayActivities.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="text-sm">Nessuna attività programmata</p>
                    {onAddActivity && (
                      <button
                        onClick={() => onAddActivity(day.id)}
                        className="mt-2 text-sm text-primary hover:underline"
                      >
                        Aggiungi la prima attività
                      </button>
                    )}
                  </div>
                ) : (
                  <SortableContext items={dayActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {dayActivities.map((activity) => {
                      activityCounter++;
                      const currentIndex = activityCounter - 1;
                      return (
                        <SortableActivity
                          key={activity.id}
                          activity={activity}
                          index={currentIndex}
                          dayId={day.id}
                        />
                      );
                    })}
                  </SortableContext>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return enableDragDrop ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {content}
      <DragOverlay>
        {activeId ? (
          <div className="glass-card p-3 rounded-xl border border-white/20 shadow-2xl">
            Dragging...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    content
  );
}
