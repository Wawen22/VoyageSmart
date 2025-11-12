import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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

type DraggableActivityCardProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMove?: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (activityId: string, isSelected: boolean) => void;
  isDragDisabled?: boolean;
};

export default function DraggableActivityCard({
  activity,
  onEdit,
  onDelete,
  onMove,
  onViewDetails,
  isSelectable = false,
  isSelected = false,
  onSelectChange,
  isDragDisabled = false
}: DraggableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: activity.id,
    data: {
      type: 'activity',
      activity
    },
    disabled: isDragDisabled || isSelectable
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 250ms ease',
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragDisabled || isSelectable ? 'default' : 'grab',
    zIndex: isDragging ? 999 : 'auto'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        transition-all duration-300
        ${isDragging ? 'scale-105 shadow-2xl' : ''}
      `}
    >
      <ActivityCard
        activity={activity}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        onViewDetails={onViewDetails}
        isSelectable={isSelectable}
        isSelected={isSelected}
        onSelectChange={onSelectChange}
      />
    </div>
  );
}
