'use client';

import { useState, useEffect } from 'react';
import { TransportationStop } from '@/lib/features/transportationSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPinIcon } from 'lucide-react';
import MapView from '@/components/map/MapView';
import { v4 as uuidv4 } from 'uuid';

interface TransportationStopFormProps {
  stop: Partial<TransportationStop>;
  onSave: (stop: Partial<TransportationStop>) => void;
  onCancel: () => void;
}

export default function TransportationStopForm({
  stop,
  onSave,
  onCancel
}: TransportationStopFormProps) {
  const [formData, setFormData] = useState({
    location: '',
    arrival_time: '',
    departure_time: '',
    notes: '',
  });

  const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null);

  // Initialize form data when stop changes
  useEffect(() => {
    if (stop) {
      setFormData({
        location: stop.location || '',
        arrival_time: stop.arrival_time ? new Date(stop.arrival_time).toISOString().slice(0, 16) : '',
        departure_time: stop.departure_time ? new Date(stop.departure_time).toISOString().slice(0, 16) : '',
        notes: stop.notes || '',
      });
      setCoordinates(stop.coordinates);
    }
  }, [stop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (coords: { x: number; y: number }) => {
    setCoordinates(coords);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedStop: Partial<TransportationStop> = {
      ...stop,
      id: stop.id || uuidv4(),
      location: formData.location,
      coordinates,
      arrival_time: formData.arrival_time || null,
      departure_time: formData.departure_time || null,
      notes: formData.notes || null,
    };

    onSave(updatedStop);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">
          {stop.id ? 'Edit Stop' : 'Add Stop'}
        </h3>
        <div className="text-sm text-muted-foreground">
          Adding stop to your transportation
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="City, station, etc."
          required
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="arrival_time">Arrival Time</Label>
          <Input
            id="arrival_time"
            name="arrival_time"
            type="datetime-local"
            value={formData.arrival_time}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departure_time">Departure Time</Label>
          <Input
            id="departure_time"
            name="departure_time"
            type="datetime-local"
            value={formData.departure_time}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Map */}
      <div className="space-y-2">
        <Label className="flex items-center">
          <MapPinIcon className="h-4 w-4 mr-1" />
          Location on Map
          <span className="text-xs text-muted-foreground ml-2">
            (Click on the map to set location)
          </span>
        </Label>
        <MapView
          address={formData.location}
          coordinates={coordinates}
          interactive={true}
          onLocationSelect={handleLocationSelect}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional information about this stop"
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-primary">
          Save Stop & Continue
        </Button>
      </div>
      <div className="text-xs text-muted-foreground text-center mt-2">
        You can add multiple stops before saving the transportation
      </div>
    </form>
  );
}
