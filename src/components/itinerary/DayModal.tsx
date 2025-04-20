import { useState, useEffect } from 'react';

type ItineraryDay = {
  id: string;
  trip_id: string;
  day_date: string;
  notes: string | null;
  weather_forecast: any | null;
};

type DayFormData = {
  day_date: string;
  notes: string;
};

type DayModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DayFormData) => void;
  onDelete?: () => void;
  day?: ItineraryDay | null;
  tripId: string;
};

export default function DayModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  day,
  tripId
}: DayModalProps) {
  const [formData, setFormData] = useState<DayFormData>({
    day_date: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (day) {
      setFormData({
        day_date: day.day_date || '',
        notes: day.notes || '',
      });
    } else {
      // Set default date to today if no date is provided
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      setFormData({
        day_date: formattedDate,
        notes: '',
      });
    }
  }, [day]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.day_date) {
      setError('Date is required');
      return;
    }

    onSave(formData);
  };

  const handleDeleteClick = () => {
    if (confirmDelete && onDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {day ? 'Edit Day' : 'Add New Day'}
        </h2>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 text-sm">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="day_date" className="block text-sm font-medium text-foreground mb-1">
              Date *
            </label>
            <input
              type="date"
              id="day_date"
              name="day_date"
              value={formData.day_date}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              placeholder="Any notes for this day..."
            ></textarea>
          </div>

          <div className="flex justify-between pt-4">
            {day && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className={`${confirmDelete ? 'bg-destructive text-destructive-foreground' : 'bg-destructive/10 text-destructive'} py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors`}
              >
                {confirmDelete ? 'Confirm Delete' : 'Delete Day'}
              </button>
            )}

            <div className={`flex space-x-3 ${day && onDelete ? '' : 'ml-auto'}`}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setError(null);
                  setConfirmDelete(false);
                }}
                className="bg-secondary py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {day ? 'Update Day' : 'Add Day'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
