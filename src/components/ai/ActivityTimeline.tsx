'use client';

import { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import ActivityPreviewCard from './ActivityPreviewCard';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Group activities by day
  const activitiesByDay: Record<string, GeneratedActivity[]> = {};

  activities.forEach(activity => {
    if (!activitiesByDay[activity.day_date]) {
      activitiesByDay[activity.day_date] = [];
    }
    activitiesByDay[activity.day_date].push(activity);
  });

  // Sort days chronologically
  const sortedDays = Object.keys(activitiesByDay).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  // Sort activities by start_time
  sortedDays.forEach(day => {
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
        year: 'numeric',
        timeZone: 'Europe/Rome' // Ensure Italian timezone
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format short date
  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE d MMM', {
        locale: it
      });
    } catch (e) {
      return dateString;
    }
  };

  // Calculate time gap between activities
  const calculateTimeGap = (current: GeneratedActivity, next: GeneratedActivity) => {
    if (!current.end_time || !next.start_time) return null;

    try {
      const endTime = new Date(current.end_time);
      const startTime = new Date(next.start_time);
      const gapMinutes = differenceInMinutes(startTime, endTime);

      if (gapMinutes <= 0) return null;

      if (gapMinutes < 60) {
        return `${gapMinutes} min`;
      } else {
        const hours = Math.floor(gapMinutes / 60);
        const minutes = gapMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    } catch (e) {
      return null;
    }
  };

  // Navigation functions
  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const goToNextDay = () => {
    if (currentDayIndex < sortedDays.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  // Scroll to top when changing day
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = 0;
    }
  }, [currentDayIndex]);

  // If no activities, show a message
  if (activities.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
        <p>Nessuna attività generata</p>
      </div>
    );
  }

  // If no days, return empty
  if (sortedDays.length === 0) return null;

  // Current day
  const currentDay = sortedDays[currentDayIndex];
  const currentActivities = activitiesByDay[currentDay];

  return (
    <div className="space-y-4">
      {/* Day navigation */}
      <div className="flex items-center justify-between bg-muted/30 rounded-md p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousDay}
          disabled={currentDayIndex === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          <h3 className="text-xs font-medium">
            {formatShortDate(currentDay)}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {currentDayIndex + 1} di {sortedDays.length} giorni
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextDay}
          disabled={currentDayIndex === sortedDays.length - 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day pills for quick navigation */}
      <div className="flex overflow-x-auto pb-2 gap-1 no-scrollbar">
        {sortedDays.map((day, index) => (
          <Button
            key={day}
            variant={index === currentDayIndex ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentDayIndex(index)}
            className="text-[10px] h-7 whitespace-nowrap"
          >
            {formatShortDate(day)}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDay}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5 py-2 px-4">
              <div className="text-xs font-medium flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                {formatDate(currentDay)}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="relative" ref={timelineRef}>
                {/* Timeline line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border"></div>

                <div className="space-y-3">
                  {currentActivities.map((activity, index) => (
                    <div key={`${activity.day_id}-${index}`} className="relative">
                      <div className="relative pl-10 timeline-item">
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

                      {/* Time gap indicator */}
                      {index < currentActivities.length - 1 && (
                        (() => {
                          const nextActivity = currentActivities[index + 1];
                          const timeGap = calculateTimeGap(activity, nextActivity);

                          if (timeGap) {
                            return (
                              <div className="ml-10 my-2 flex items-center text-[10px] text-muted-foreground">
                                <div className="flex-1 border-b border-dashed border-muted"></div>
                                <span className="mx-2 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {timeGap} di pausa
                                </span>
                                <div className="flex-1 border-b border-dashed border-muted"></div>
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
