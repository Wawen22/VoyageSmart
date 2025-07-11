'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  StickyNoteIcon
} from 'lucide-react';
import { formatTimeLocal, formatDateLocal, formatCurrency } from '@/lib/utils';

interface Activity {
  id?: string;
  name: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  cost?: number;
  currency?: string;
  notes?: string;
  status?: string;
}

interface ItineraryDay {
  id?: string;
  day_date: string;
  date?: string;
  notes?: string;
  activities: Activity[];
}

interface AIItineraryViewProps {
  days: ItineraryDay[];
  compact?: boolean;
  maxDays?: number;
}

export default function AIItineraryView({ days, compact = false, maxDays }: AIItineraryViewProps) {
  const displayDays = maxDays ? days.slice(0, maxDays) : days;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Rome'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getActivityTypeColor = (type: string | undefined) => {
    if (!type) return 'var(--muted)';
    switch (type.toLowerCase()) {
      case 'food': return 'var(--orange-500)';
      case 'culture': return 'var(--purple-500)';
      case 'nature': return 'var(--green-500)';
      case 'entertainment': return 'var(--blue-500)';
      case 'transport': return 'var(--gray-500)';
      default: return 'var(--primary)';
    }
  };

  const getActivityTypeLabel = (type: string | undefined) => {
    if (!type) return '';
    switch (type.toLowerCase()) {
      case 'food': return 'Cibo';
      case 'culture': return 'Cultura';
      case 'nature': return 'Natura';
      case 'entertainment': return 'Intrattenimento';
      case 'transport': return 'Trasporto';
      default: return type;
    }
  };

  if (displayDays.length === 0) {
    return (
      <Card className="border-l-4 border-l-primary/60">
        <CardContent className="p-4 text-center">
          <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nessun itinerario disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {displayDays.map((day, dayIndex) => (
        <Card key={day.id || dayIndex} className="overflow-hidden border-l-4 border-l-primary/60">
          <CardContent className={compact ? "p-3" : "p-4"}>
            <div className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">
                    {formatDate(day.day_date || day.date || '')}
                  </h4>
                  {day.notes && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <StickyNoteIcon className="h-3 w-3" />
                      {day.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Activities */}
              {day.activities && day.activities.length > 0 ? (
                <div className="space-y-2">
                  {day.activities.map((activity, actIndex) => (
                    <div
                      key={activity.id || actIndex}
                      className="bg-muted/30 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">
                            {activity.name}
                          </h5>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {activity.type && (
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{
                                  backgroundColor: `${getActivityTypeColor(activity.type)}20`,
                                  borderColor: getActivityTypeColor(activity.type),
                                  color: getActivityTypeColor(activity.type)
                                }}
                              >
                                {getActivityTypeLabel(activity.type)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {activity.cost !== null && activity.cost !== undefined && (
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {formatCurrency(activity.cost, activity.currency || 'EUR')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        {(activity.start_time || activity.end_time) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ClockIcon className="h-3 w-3 flex-shrink-0" />
                            <span>
                              {activity.start_time && formatTimeLocal(activity.start_time)}
                              {activity.start_time && activity.end_time && ' - '}
                              {activity.end_time && formatTimeLocal(activity.end_time)}
                            </span>
                          </div>
                        )}

                        {activity.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{activity.location}</span>
                          </div>
                        )}

                        {activity.notes && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <StickyNoteIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{activity.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    Nessuna attività pianificata per questo giorno
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {maxDays && days.length > maxDays && (
        <Card className="border-dashed">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">
              ... e altri {days.length - maxDays} giorni
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
