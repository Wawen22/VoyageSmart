import { useState, useEffect } from 'react';

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

type ActivityFormData = {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  location: string;
  booking_reference: string;
  priority: number;
  cost: string;
  currency: string;
  notes: string;
  status: string;
};

type ActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ActivityFormData) => void;
  activity?: Activity | null;
  tripId: string;
  dayId: string;
};

export default function ActivityModal({ 
  isOpen, 
  onClose, 
  onSave, 
  activity, 
  tripId, 
  dayId 
}: ActivityModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    type: 'sightseeing',
    start_time: '',
    end_time: '',
    location: '',
    booking_reference: '',
    priority: 3,
    cost: '',
    currency: 'EUR',
    notes: '',
    status: 'planned',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || '',
        type: activity.type || 'sightseeing',
        start_time: activity.start_time ? new Date(activity.start_time).toISOString().slice(0, 16) : '',
        end_time: activity.end_time ? new Date(activity.end_time).toISOString().slice(0, 16) : '',
        location: activity.location || '',
        booking_reference: activity.booking_reference || '',
        priority: activity.priority || 3,
        cost: activity.cost ? String(activity.cost) : '',
        currency: activity.currency || 'EUR',
        notes: activity.notes || '',
        status: activity.status || 'planned',
      });
    } else {
      // Set default time to current time rounded to nearest hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const defaultStartTime = now.toISOString().slice(0, 16);
      
      now.setHours(now.getHours() + 1);
      const defaultEndTime = now.toISOString().slice(0, 16);
      
      setFormData({
        name: '',
        type: 'sightseeing',
        start_time: defaultStartTime,
        end_time: defaultEndTime,
        location: '',
        booking_reference: '',
        priority: 3,
        cost: '',
        currency: 'EUR',
        notes: '',
        status: 'planned',
      });
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Activity name is required');
      return;
    }
    
    if (formData.start_time && formData.end_time && new Date(formData.start_time) > new Date(formData.end_time)) {
      setError('End time cannot be before start time');
      return;
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {activity ? 'Edit Activity' : 'Add New Activity'}
        </h2>
        
        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-3 text-destructive mb-4 text-sm">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Activity Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              placeholder="e.g., Visit Colosseum"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              >
                <option value="sightseeing">Sightseeing</option>
                <option value="food">Food & Dining</option>
                <option value="entertainment">Entertainment</option>
                <option value="shopping">Shopping</option>
                <option value="relaxation">Relaxation</option>
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              >
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-foreground mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-foreground mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              placeholder="e.g., Piazza del Colosseo, Roma"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-foreground mb-1">
                Cost
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="flex-1 block w-full border border-input bg-background text-foreground rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  placeholder="0.00"
                />
                <select
                  name="currency"
                  id="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="inline-flex items-center px-3 border border-l-0 border-input bg-secondary text-foreground rounded-r-md shadow-sm text-sm"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="booking_reference" className="block text-sm font-medium text-foreground mb-1">
                Booking Reference
              </label>
              <input
                type="text"
                id="booking_reference"
                name="booking_reference"
                value={formData.booking_reference}
                onChange={handleChange}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                placeholder="e.g., ABC123"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
            >
              <option value="planned">Planned</option>
              <option value="booked">Booked</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
              placeholder="Any additional notes..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                setError(null);
              }}
              className="bg-secondary py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              {activity ? 'Update Activity' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
