import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

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

type MoveActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMove: (activityId: string, newDayId: string) => void;
  activity: Activity;
  days: ItineraryDay[];
};

export default function MoveActivityModal({
  isOpen,
  onClose,
  onMove,
  activity,
  days
}: MoveActivityModalProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set the current day as default
    if (activity && activity.day_id) {
      setSelectedDayId(activity.day_id);
    }
  }, [activity]);

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDayId) {
      setError('Please select a day');
      return;
    }

    if (selectedDayId === activity.day_id) {
      setError('Please select a different day');
      return;
    }

    onMove(activity.id, selectedDayId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          Move Activity to Another Day
        </h2>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 text-sm">
            <p>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Moving: <span className="font-medium text-foreground">{activity.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="day_id" className="block text-sm font-medium text-foreground mb-1">
              Select Day
            </label>
            <select
              id="day_id"
              name="day_id"
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              required
            >
              <option value="">Select a day...</option>
              {days
                .sort((a, b) => new Date(a.day_date).getTime() - new Date(b.day_date).getTime())
                .map((day) => (
                  <option key={day.id} value={day.id}>
                    {formatDate(day.day_date)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 sm:space-x-3 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-secondary py-1.5 sm:py-2 px-3 sm:px-4 border border-input rounded-md shadow-sm text-xs sm:text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" clipRule="evenodd" />
              </svg>
              Move Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
