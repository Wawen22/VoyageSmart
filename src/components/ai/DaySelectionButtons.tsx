'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

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

  // Formatta la data in un formato leggibile
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  // Gestisce il click su un giorno
  const handleDayClick = (dayId: string) => {
    setSelectedDays(prev => {
      // Se il giorno è già selezionato, rimuovilo
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      }
      // Altrimenti, aggiungilo
      return [...prev, dayId];
    });
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-primary" />
          Seleziona i giorni
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSelectAll}
          className="text-xs h-8"
        >
          {selectedDays.length === days.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
        {days.map(day => (
          <Button
            key={day.id}
            variant={selectedDays.includes(day.id) ? "default" : "outline"}
            className="justify-start h-auto py-2 text-left"
            onClick={() => handleDayClick(day.id)}
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
      
      <Button 
        className="w-full mt-4" 
        onClick={handleConfirm}
        disabled={selectedDays.length === 0}
      >
        Conferma selezione
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
