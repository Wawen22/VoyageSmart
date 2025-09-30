'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

type MobileCalendarViewProps = {
  days: ItineraryDay[];
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onDeleteMultipleActivities?: (activityIds: string[]) => void;
  onDeleteAllActivities?: (dayId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
  onViewActivityDetails?: (activity: Activity) => void;
};

export default function MobileCalendarView({
  days,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onDeleteMultipleActivities,
  onDeleteAllActivities,
  onMoveActivity,
  onViewActivityDetails
}: MobileCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Genera i giorni del mese corrente
  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysArray = eachDayOfInterval({ start, end });
    setCalendarDays(daysArray);
  }, [currentDate]);

  // Scorrimento automatico al giorno selezionato
  useEffect(() => {
    if (scrollRef.current) {
      const selectedDayElement = document.getElementById(`day-${format(selectedDate, 'yyyy-MM-dd')}`);
      if (selectedDayElement) {
        const containerWidth = scrollRef.current.offsetWidth;
        const scrollPosition = selectedDayElement.offsetLeft - containerWidth / 2 + selectedDayElement.offsetWidth / 2;
        scrollRef.current.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedDate, calendarDays]);

  // Gestione dello swipe per cambiare giorno
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe orizzontale di almeno 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe verso sinistra -> giorno successivo
        setSelectedDate(addDays(selectedDate, 1));
      } else {
        // Swipe verso destra -> giorno precedente
        setSelectedDate(subDays(selectedDate, 1));
      }
    }

    touchStartX.current = null;
  };

  // Trova il giorno dell'itinerario corrispondente alla data selezionata
  const selectedItineraryDay = days.find(day =>
    isSameDay(parseISO(day.day_date), selectedDate)
  );

  // Formatta la data in formato leggibile
  const formatDateHeader = (date: Date) => {
    return format(date, 'EEEE d MMMM yyyy', { locale: it });
  };

  // Formatta l'ora in formato leggibile
  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  // Ottieni il colore in base alla priorità
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 3:
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  // Cambia mese
  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      {/* Header con mese e anno */}
      <div className="bg-muted/50 p-3 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeMonth(-1)}
          aria-label="Mese precedente"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => changeMonth(1)}
          aria-label="Mese successivo"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Barra dei giorni scorrevole */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto py-2 px-1 bg-muted/30 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasEvents = days.some(d => d.day_date === dateStr);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateStr}
              id={`day-${dateStr}`}
              className={`flex-shrink-0 flex flex-col items-center mx-1 p-1 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-xs font-medium">
                {format(day, 'EEE', { locale: it })}
              </div>
              <div className={`text-lg font-bold ${isSelected ? 'text-primary-foreground' : ''}`}>
                {format(day, 'd')}
              </div>
              {hasEvents && (
                <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                  isSelected ? 'bg-primary-foreground' : 'bg-primary'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenuto del giorno selezionato */}
      <div
        className="p-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-center mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            aria-label="Giorno precedente"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            <span className="hidden xs:inline">Precedente</span>
          </Button>

          <h3 className="text-base font-medium">
            {formatDateHeader(selectedDate)}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            aria-label="Giorno successivo"
          >
            <span className="hidden xs:inline">Successivo</span>
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {selectedItineraryDay ? (
          <div>
            {/* Note del giorno */}
            {selectedItineraryDay.notes && (
              <div className="mb-3 bg-muted/20 p-2 rounded-md">
                <p className="text-sm text-muted-foreground">{selectedItineraryDay.notes}</p>
              </div>
            )}

            {/* Pulsanti azioni */}
            <div className="flex justify-between mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditDay(selectedItineraryDay)}
                className="text-xs"
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                Modifica Giorno
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => onAddActivity(selectedItineraryDay.id)}
                className="text-xs"
              >
                <PlusIcon className="h-3.5 w-3.5 mr-1" />
                Aggiungi Attività
              </Button>
            </div>

            {/* Lista attività */}
            {selectedItineraryDay.activities && selectedItineraryDay.activities.length > 0 ? (
              <div className="space-y-2">
                {selectedItineraryDay.activities
                  .sort((a, b) => {
                    if (!a.start_time && !b.start_time) return 0;
                    if (!a.start_time) return 1;
                    if (!b.start_time) return -1;
                    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                  })
                  .map((activity) => (
                    <Card
                      key={activity.id}
                      className="border-l-4 hover:shadow-md transition-shadow"
                      style={{
                        borderLeftColor: activity.priority === 1
                          ? '#ef4444'
                          : activity.priority === 2
                            ? '#f97316'
                            : '#3b82f6'
                      }}
                      onClick={() => onEditActivity(activity)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{activity.name}</h4>
                            {activity.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{activity.location}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            {activity.start_time && (
                              <span className="text-xs font-medium">
                                {formatTime(activity.start_time)}
                                {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs mt-1 ${getPriorityColor(activity.priority)}`}
                            >
                              {activity.priority === 1
                                ? 'Alta'
                                : activity.priority === 2
                                  ? 'Media'
                                  : 'Bassa'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/10 rounded-md">
                <p className="text-muted-foreground text-sm">Nessuna attività pianificata per questo giorno.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => onAddActivity(selectedItineraryDay.id)}
                  className="mt-2"
                >
                  Aggiungi un'attività
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/10 rounded-md">
            <p className="text-muted-foreground">Nessun giorno pianificato per questa data.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aggiungi un nuovo giorno all'itinerario per questa data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
