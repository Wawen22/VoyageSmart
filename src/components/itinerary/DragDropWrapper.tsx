import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import ActivityCard from './ActivityCard';

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

type DragDropWrapperProps = {
  children: React.ReactNode;
  onActivityMove: (activityId: string, fromDayId: string, toDayId: string) => void;
};

export default function DragDropWrapper({
  children,
  onActivityMove
}: DragDropWrapperProps) {
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'activity') {
      setActiveActivity(active.data.current.activity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveActivity(null);
      return;
    }

    // Handle activity drop on day
    if (
      active.data.current?.type === 'activity' &&
      over.data.current?.type === 'day'
    ) {
      const activity = active.data.current.activity as Activity;
      const targetDay = over.data.current.day;

      // Only move if dropping on different day
      if (activity.day_id !== targetDay.id) {
        onActivityMove(activity.id, activity.day_id, targetDay.id);
      }
    }

    setActiveActivity(null);
  };

  const handleDragCancel = () => {
    setActiveActivity(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      {/* Drag Overlay (Ghost Element) */}
      <DragOverlay>
        {activeActivity ? (
          <div className="
            opacity-80 rotate-3 scale-105
            shadow-2xl shadow-blue-500/50
          ">
            <ActivityCard
              activity={activeActivity}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
