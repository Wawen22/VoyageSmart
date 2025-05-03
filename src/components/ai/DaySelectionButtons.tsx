'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isWithinInterval, parseISO, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Tipo per i giorni dell'itinerario
type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes?: string | null;
};

interface DaySelectionButtonsProps {
  days: ItineraryDay[];
  onSelectDays: (selectedDayIds: string[]) => void;
}

export default function DaySelectionButtons({ days, onSelectDays }: DaySelectionButtonsProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Inizializza con il mese del primo giorno dell'itinerario
    if (days.length > 0) {
      return new Date(days[0].day_date);
    }
    return new Date();
  });
  const [selectionMode, setSelectionMode] = useState<'list' | 'calendar'>('calendar');
  const [rangeSelectionStart, setRangeSelectionStart] = useState<string | null>(null);

  // Ordina i giorni per data
  const sortedDays = [...days].sort((a, b) =>
    new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
  );

  // Formatta la data in un formato leggibile
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  // Formatta la data in formato breve
  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE d MMM', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  // Gestisce il click su un giorno
  const handleDayClick = (dayId: string) => {
    // Se è in corso una selezione di intervallo
    if (rangeSelectionStart) {
      const startDay = days.find(d => d.id === rangeSelectionStart);
      const endDay = days.find(d => d.id === dayId);

      if (startDay && endDay) {
        const startDate = new Date(startDay.day_date);
        const endDate = new Date(endDay.day_date);

        // Determina l'ordine corretto (inizio e fine)
        const [earlierDate, laterDate] = startDate <= endDate
          ? [startDate, endDate]
          : [endDate, startDate];

        // Seleziona tutti i giorni nell'intervallo
        const daysInRange = days.filter(day => {
          const dayDate = new Date(day.day_date);
          return isWithinInterval(dayDate, { start: earlierDate, end: laterDate });
        });

        setSelectedDays(daysInRange.map(d => d.id));
        setRangeSelectionStart(null); // Resetta la selezione dell'intervallo
      }
    } else {
      // Comportamento normale (toggle)
      setSelectedDays(prev => {
        if (prev.includes(dayId)) {
          return prev.filter(id => id !== dayId);
        }
        return [...prev, dayId];
      });
    }
  };

  // Inizia la selezione di un intervallo
  const startRangeSelection = (dayId: string) => {
    setRangeSelectionStart(dayId);
  };

  // Seleziona tutti i giorni
  const handleSelectAll = () => {
    if (selectedDays.length === days.length) {
      // Se tutti i giorni sono già selezionati, deseleziona tutti
      setSelectedDays([]);
    } else {
      // Altrimenti, seleziona tutti
      setSelectedDays(days.map(day => day.id));
    }
  };

  // Conferma la selezione
  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onSelectDays(selectedDays);
    }
  };

  // Cambia mese nel calendario
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Genera i giorni del calendario per il mese corrente
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Primo giorno del mese
    const firstDayOfMonth = new Date(year, month, 1);
    // Ultimo giorno del mese
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Giorno della settimana del primo giorno (0 = domenica, 1 = lunedì, ...)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    // Adatta per iniziare da lunedì (0 = lunedì, 6 = domenica)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const calendarDays: Array<{ date: Date; isCurrentMonth: boolean; dayId?: string }> = [];

    // Giorni del mese precedente
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, -firstDayOfWeek + i + 1);
      calendarDays.push({ date, isCurrentMonth: false });
    }

    // Giorni del mese corrente
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      const matchingDay = days.find(day => {
        const dayDate = new Date(day.day_date);
        return isSameDay(dayDate, date);
      });

      calendarDays.push({
        date,
        isCurrentMonth: true,
        dayId: matchingDay?.id
      });
    }

    // Calcola quanti giorni aggiungere per completare l'ultima settimana
    const remainingDays = (7 - (calendarDays.length % 7)) % 7;

    // Giorni del mese successivo
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      calendarDays.push({ date, isCurrentMonth: false });
    }

    return calendarDays;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            Seleziona i giorni
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectionMode(selectionMode === 'list' ? 'calendar' : 'list')}
              className="text-xs h-8 px-2"
            >
              {selectionMode === 'list' ? 'Calendario' : 'Lista'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs h-8"
            >
              {selectedDays.length === days.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </Button>
          </div>
        </div>

        {selectionMode === 'calendar' ? (
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              {/* Intestazione del calendario */}
              <div className="flex justify-between items-center mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth('prev')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h4 className="text-sm font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: it })}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth('next')}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Giorni della settimana */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map(day => (
                  <div key={day} className="text-center text-[10px] font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Giorni del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isInItinerary = day.dayId !== undefined;
                  const isSelected = isInItinerary && selectedDays.includes(day.dayId);
                  const isRangeStart = isInItinerary && day.dayId === rangeSelectionStart;

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            relative aspect-square flex items-center justify-center rounded-full text-[11px]
                            ${!day.isCurrentMonth ? 'text-muted-foreground/40' : ''}
                            ${isInItinerary ? 'cursor-pointer hover:bg-muted' : 'cursor-default'}
                            ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                            ${isRangeStart ? 'ring-2 ring-primary' : ''}
                          `}
                          onClick={() => isInItinerary && handleDayClick(day.dayId!)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (isInItinerary) {
                              startRangeSelection(day.dayId!);
                            }
                          }}
                        >
                          {day.date.getDate()}
                          {isInItinerary && !isSelected && (
                            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
                          )}
                        </div>
                      </TooltipTrigger>
                      {isInItinerary && (
                        <TooltipContent side="bottom">
                          <p className="text-xs">
                            {formatShortDate(day.date.toISOString())}
                            {isRangeStart && " (Inizio intervallo)"}
                            <br />
                            <span className="text-[10px] text-muted-foreground">
                              {isSelected ? 'Selezionato' : 'Clicca per selezionare'}
                              <br />
                              {!isRangeStart && 'Tasto destro per iniziare selezione intervallo'}
                            </span>
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>

              {rangeSelectionStart && (
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  <Badge variant="outline" className="bg-primary/10">
                    Selezione intervallo attiva
                  </Badge>
                  <p className="mt-1">Clicca su un altro giorno per selezionare l'intervallo</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
            {sortedDays.map(day => (
              <Button
                key={day.id}
                variant={selectedDays.includes(day.id) ? "default" : "outline"}
                className="justify-start h-auto py-2 text-left"
                onClick={() => handleDayClick(day.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  startRangeSelection(day.id);
                }}
              >
                <div className="flex items-center w-full">
                  <div className={`mr-2 h-5 w-5 rounded-full flex items-center justify-center ${
                    selectedDays.includes(day.id) ? 'bg-primary-foreground' : 'bg-primary/10'
                  }`}>
                    {selectedDays.includes(day.id) && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  <span className="text-xs">{formatDate(day.day_date)}</span>
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedDays.length} {selectedDays.length === 1 ? 'giorno' : 'giorni'} selezionati
          </div>
          <Button
            className="mt-2"
            onClick={handleConfirm}
            disabled={selectedDays.length === 0}
          >
            Conferma selezione
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
