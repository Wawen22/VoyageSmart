'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';

// Tipo per le attività generate
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

interface ActivityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: GeneratedActivity | null;
  onSave: (updatedActivity: GeneratedActivity) => void;
}

export default function ActivityEditModal({
  isOpen,
  onClose,
  activity,
  onSave
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState<GeneratedActivity | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inizializza il form quando l'attività cambia
  useEffect(() => {
    if (activity) {
      setFormData({ ...activity });
    }
  }, [activity]);

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
    
    // Rimuovi l'errore quando l'utente modifica il campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Gestisce i cambiamenti nei campi select
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
    
    // Rimuovi l'errore quando l'utente modifica il campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Formatta l'orario per l'input time
  const formatTimeForInput = (timeString: string | undefined) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return format(date, 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  // Converte l'orario dall'input time a ISO string
  const convertTimeToISOString = (timeString: string, dateString: string) => {
    if (!timeString || !dateString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date(dateString);
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return date.toISOString();
    } catch (e) {
      return '';
    }
  };

  // Valida il form prima del salvataggio
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData?.name?.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }
    
    if (!formData?.location?.trim()) {
      newErrors.location = 'La località è obbligatoria';
    }
    
    if (!formData?.type) {
      newErrors.type = 'Il tipo è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestisce il salvataggio dell'attività
  const handleSave = () => {
    if (!formData || !validateForm()) return;
    
    // Converti gli orari in ISO string
    const updatedActivity = {
      ...formData,
      start_time: formData.start_time ? convertTimeToISOString(formatTimeForInput(formData.start_time), formData.day_date) : '',
      end_time: formData.end_time ? convertTimeToISOString(formatTimeForInput(formData.end_time), formData.day_date) : '',
      cost: formData.cost ? parseFloat(String(formData.cost)) : undefined
    };
    
    onSave(updatedActivity);
    onClose();
  };

  if (!formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifica Attività</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              error={errors.name}
            />
            {errors.name && <p className="text-destructive text-xs col-span-3 col-start-2">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sightseeing">Sightseeing</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="culture">Culture</SelectItem>
                <SelectItem value="relax">Relax</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="sport">Sport</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-destructive text-xs col-span-3 col-start-2">{errors.type}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Luogo
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="col-span-3"
              error={errors.location}
            />
            {errors.location && <p className="text-destructive text-xs col-span-3 col-start-2">{errors.location}</p>}
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start_time" className="text-right">
              Orario inizio
            </Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              value={formatTimeForInput(formData.start_time)}
              onChange={(e) => {
                const isoTime = convertTimeToISOString(e.target.value, formData.day_date);
                setFormData(prev => prev ? { ...prev, start_time: isoTime } : null);
              }}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end_time" className="text-right">
              Orario fine
            </Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              value={formatTimeForInput(formData.end_time)}
              onChange={(e) => {
                const isoTime = convertTimeToISOString(e.target.value, formData.day_date);
                setFormData(prev => prev ? { ...prev, end_time: isoTime } : null);
              }}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priorità
            </Label>
            <Select
              value={String(formData.priority)}
              onValueChange={(value) => handleSelectChange('priority', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona una priorità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Alta</SelectItem>
                <SelectItem value="2">Media</SelectItem>
                <SelectItem value="3">Bassa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Costo
            </Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              value={formData.cost || ''}
              onChange={handleChange}
              className="col-span-1"
            />
            <Select
              value={formData.currency || 'EUR'}
              onValueChange={(value) => handleSelectChange('currency', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Valuta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="booking_reference" className="text-right">
              Riferimento
            </Label>
            <Input
              id="booking_reference"
              name="booking_reference"
              value={formData.booking_reference || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="notes" className="text-right">
              Note
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              className="col-span-3"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSave}>
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
