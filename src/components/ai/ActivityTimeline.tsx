'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import ActivityPreviewCard from './ActivityPreviewCard';

// Type for the activity
type GeneratedActivity = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference?: string;
  priority: number;
  cost?: number;
  currency?: string;
  notes?: string;
  status: string;
  day_id: string;
  day_date: string;
};

interface ActivityTimelineProps {
  activities: GeneratedActivity[];
  onEditActivity?: (activity: GeneratedActivity) => void;
  onRemoveActivity?: (activity: GeneratedActivity) => void;
  showActions?: boolean;
}

export default function ActivityTimeline({
  activities,
  onEditActivity,
  onRemoveActivity,
  showActions = true
}: ActivityTimelineProps) {
  // Group activities by day
  const activitiesByDay: Record<string, GeneratedActivity[]> = {};

  activities.forEach(activity => {
    if (!activitiesByDay[activity.day_date]) {
      activitiesByDay[activity.day_date] = [];
    }
    activitiesByDay[activity.day_date].push(activity);
  });

  // Sort activities by start_time
  Object.keys(activitiesByDay).forEach(day => {
    activitiesByDay[day].sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {Object.keys(activitiesByDay).map(day => (
        <Card key={day} className="overflow-hidden">
          <CardHeader className="bg-primary/5 py-2 px-4">
            <div className="text-xs font-medium flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {formatDate(day)}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border"></div>

              <div className="space-y-3">
                {activitiesByDay[day].map((activity, index) => (
                  <div key={`${activity.day_id}-${index}`} className="relative pl-10 timeline-item">
                    {/* Time marker */}
                    {activity.start_time && (
                      <div className="absolute left-0 top-3 bg-background border border-border rounded-full h-7 w-7 flex items-center justify-center z-10">
                        <span className="text-[10px] font-medium">
                          {format(new Date(activity.start_time), 'HH:mm')}
                        </span>
                      </div>
                    )}

                    <ActivityPreviewCard
                      activity={activity}
                      onEdit={onEditActivity}
                      onRemove={onRemoveActivity}
                      showActions={showActions}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
