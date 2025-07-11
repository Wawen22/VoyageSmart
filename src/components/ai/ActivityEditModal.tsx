'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { LazyLocationAutocomplete, LazyMapView } from '@/components/LazyComponents';

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
  coordinates?: { x: number; y: number } | null;
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
  const [mapAddress, setMapAddress] = useState<string>('');

  // Inizializza il form quando l'attività cambia
  useEffect(() => {
    if (activity) {
      setFormData({ ...activity });
      setMapAddress(activity.location);
    }
  }, [activity]);

  // Aggiorna l'indirizzo della mappa quando cambia la location
  useEffect(() => {
    if (formData?.location) {
      setMapAddress(formData.location);
    }
  }, [formData?.location]);

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

  // Gestisce la selezione della location con le coordinate
  const handleLocationSelect = (location: string, coordinates?: { x: number; y: number }) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        location: location,
        coordinates: coordinates || null
      };
    });

    // Rimuovi l'errore quando l'utente modifica il campo
    if (errors.location) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Modifica Attività</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Nome e Tipo in una riga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
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
              {errors.type && <p className="text-destructive text-xs">{errors.type}</p>}
            </div>
          </div>

          {/* Luogo */}
          <div className="space-y-2">
            <Label htmlFor="location">Luogo</Label>
            <LazyLocationAutocomplete
              value={formData.location}
              onChange={handleLocationSelect}
              placeholder="Cerca un luogo..."
              error={errors.location}
            />
            {errors.location && <p className="text-destructive text-xs mt-1">{errors.location}</p>}
          </div>

          {/* Mappa */}
          <div className="space-y-2">
            <Label>Mappa</Label>
            <LazyMapView
              address={mapAddress}
              coordinates={formData.coordinates}
              height="180px"
              interactive={true}
              onLocationSelect={(coords) => {
                setFormData(prev => prev ? { ...prev, coordinates: coords } : null);
              }}
            />
          </div>

          {/* Orari in una riga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Orario inizio</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formatTimeForInput(formData.start_time)}
                onChange={(e) => {
                  const isoTime = convertTimeToISOString(e.target.value, formData.day_date);
                  setFormData(prev => prev ? { ...prev, start_time: isoTime } : null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Orario fine</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formatTimeForInput(formData.end_time)}
                onChange={(e) => {
                  const isoTime = convertTimeToISOString(e.target.value, formData.day_date);
                  setFormData(prev => prev ? { ...prev, end_time: isoTime } : null);
                }}
              />
            </div>
          </div>

          {/* Priorità e Costo in una riga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priorità</Label>
              <Select
                value={String(formData.priority)}
                onValueChange={(value) => handleSelectChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Alta</SelectItem>
                  <SelectItem value="2">Media</SelectItem>
                  <SelectItem value="3">Bassa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Costo</Label>
              <div className="flex gap-2">
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  value={formData.cost || ''}
                  onChange={handleChange}
                  className="w-[60%]"
                />
                <Select
                  value={formData.currency || 'EUR'}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                  className="w-[40%]"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valuta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Riferimento */}
          <div className="space-y-2">
            <Label htmlFor="booking_reference">Riferimento</Label>
            <Input
              id="booking_reference"
              name="booking_reference"
              value={formData.booking_reference || ''}
              onChange={handleChange}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose} size="lg" className="min-w-[120px]">
            Annulla
          </Button>
          <Button onClick={handleSave} size="lg" className="min-w-[120px]">
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
