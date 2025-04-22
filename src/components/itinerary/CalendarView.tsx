import React, { useState, useMemo } from 'react';
import { Calendar, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileCalendarView from './MobileCalendarView';

// Configurazione del localizzatore per il calendario con date-fns
const locales = {
  'it': it,
};

const localizer = dateFnsLocalizer({
  format,
  parse: (str: string, format: string) => {
    try {
      return parse(str, format, new Date(), { locale: it });
    } catch (e) {
      console.error('Error parsing date:', e);
      return new Date();
    }
  },
  startOfWeek: () => startOfWeek(new Date(), { locale: it }),
  getDay,
  locales,
});

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

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Activity | ItineraryDay;
  type: 'activity' | 'day';
};

type CalendarViewProps = {
  days: ItineraryDay[];
  onEditDay: (day: ItineraryDay) => void;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveActivity?: (activity: Activity) => void;
};

export default function CalendarView({
  days,
  onEditDay,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveActivity
}: CalendarViewProps) {
  const [view, setView] = useState('month');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Converti i giorni e le attività in eventi del calendario
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    days.forEach(day => {
      // Aggiungi il giorno come evento di tutto il giorno
      const dayDate = parseISO(day.day_date);

      calendarEvents.push({
        id: `day-${day.id}`,
        title: day.notes || 'Giorno di viaggio',
        start: dayDate,
        end: dayDate,
        allDay: true,
        resource: day,
        type: 'day'
      });

      // Aggiungi le attività del giorno come eventi
      if (day.activities && day.activities.length > 0) {
        day.activities.forEach(activity => {
          let start: Date;
          let end: Date;
          let allDay = false;

          if (activity.start_time) {
            start = parseISO(activity.start_time);
            end = activity.end_time ? parseISO(activity.end_time) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
          } else {
            // Se non c'è un orario di inizio, imposta l'attività come evento di tutto il giorno
            start = dayDate;
            end = dayDate;
            allDay = true;
          }

          calendarEvents.push({
            id: `activity-${activity.id}`,
            title: activity.name,
            start,
            end,
            allDay,
            resource: activity,
            type: 'activity'
          });
        });
      }
    });

    return calendarEvents;
  }, [days]);

  // Gestione degli eventi del calendario
  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'activity') {
      onEditActivity(event.resource as Activity);
    } else if (event.type === 'day') {
      onEditDay(event.resource as ItineraryDay);
    }
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Trova il giorno corrispondente alla data selezionata
    const selectedDate = format(start, 'yyyy-MM-dd');
    const selectedDay = days.find(day => day.day_date === selectedDate);

    if (selectedDay) {
      onAddActivity(selectedDay.id);
    } else {
      // Se il giorno non esiste, mostra un messaggio
      alert('Non esiste un giorno per questa data nell\'itinerario. Aggiungi prima il giorno.');
    }
  };

  // Personalizzazione dell'aspetto degli eventi
  const eventStyleGetter = (event: CalendarEvent) => {
    let style: React.CSSProperties = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    if (event.type === 'day') {
      style.backgroundColor = '#64748b'; // Colore per i giorni
    } else {
      // Colore in base alla priorità per le attività
      const activity = event.resource as Activity;
      switch (activity.priority) {
        case 1:
          style.backgroundColor = '#ef4444'; // Alta priorità
          break;
        case 2:
          style.backgroundColor = '#f97316'; // Media priorità
          break;
        case 3:
        default:
          style.backgroundColor = '#3b82f6'; // Bassa priorità
          break;
      }
    }

    return {
      style
    };
  };

  // Se è mobile, mostra la vista mobile del calendario
  if (isMobile) {
    return (
      <MobileCalendarView
        days={days}
        onEditDay={onEditDay}
        onAddActivity={onAddActivity}
        onEditActivity={onEditActivity}
        onDeleteActivity={onDeleteActivity}
        onMoveActivity={onMoveActivity}
      />
    );
  }

  // Altrimenti mostra il calendario normale
  return (
    <div className="h-auto min-h-[400px] bg-card rounded-lg shadow overflow-visible">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        view={view as any}
        onView={(newView) => setView(newView)}
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        popup
        tooltipAccessor={(event: CalendarEvent) => {
          if (event.type === 'activity') {
            const activity = event.resource as Activity;
            let tooltip = `${activity.name}`;
            if (activity.location) tooltip += `\nLuogo: ${activity.location}`;
            if (activity.notes) tooltip += `\nNote: ${activity.notes}`;
            return tooltip;
          }
          return event.title;
        }}
        messages={{
          today: 'Oggi',
          previous: 'Precedente',
          next: 'Successivo',
          month: 'Mese',
          week: 'Settimana',
          day: 'Giorno',
          agenda: 'Agenda',
          date: 'Data',
          time: 'Ora',
          event: 'Evento',
          allDay: 'Tutto il giorno',
          noEventsInRange: 'Nessun evento in questo periodo'
        }}
        components={{
          toolbar: CustomToolbar,
        }}
      />
    </div>
  );
}

// Componente personalizzato per la toolbar del calendario
function CustomToolbar({ label, onNavigate, onView, views }: any) {
  return (
    <div className="rbc-toolbar">
      <div className="rbc-btn-group">
        <button type="button" onClick={() => onNavigate('TODAY')} aria-label="Oggi">
          Oggi
        </button>
        <button type="button" onClick={() => onNavigate('PREV')} aria-label="Precedente">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button type="button" onClick={() => onNavigate('NEXT')} aria-label="Successivo">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <span className="rbc-toolbar-label">{label}</span>
      <div className="rbc-btn-group hidden xs:flex">
        {views.map((view: string) => {
          let viewLabel = '';
          switch (view) {
            case 'month':
              viewLabel = 'Mese';
              break;
            case 'week':
              viewLabel = 'Settimana';
              break;
            case 'day':
              viewLabel = 'Giorno';
              break;
            default:
              viewLabel = view;
          }
          return (
            <button
              key={view}
              type="button"
              onClick={() => onView(view)}
              aria-label={viewLabel}
            >
              {viewLabel}
            </button>
          );
        })}
      </div>
      <div className="rbc-btn-group xs:hidden">
        <select
          onChange={(e) => onView(e.target.value)}
          className="rbc-view-dropdown"
          aria-label="Seleziona vista"
        >
          {views.map((view: string) => {
            let viewLabel = '';
            switch (view) {
              case 'month':
                viewLabel = 'Mese';
                break;
              case 'week':
                viewLabel = 'Settimana';
                break;
              case 'day':
                viewLabel = 'Giorno';
                break;
              default:
                viewLabel = view;
            }
            return (
              <option key={view} value={view}>
                {viewLabel}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
