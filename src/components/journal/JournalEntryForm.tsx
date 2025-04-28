'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { addJournalEntry, updateJournalEntry, JournalEntry } from '@/lib/features/journalSlice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth';
import { SmileIcon, MapPinIcon, CloudIcon, CalendarIcon } from 'lucide-react';

interface JournalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  dayId?: string | null;
  entry?: JournalEntry | null;
}

const moods = [
  { value: 'happy', label: '😊 Happy' },
  { value: 'excited', label: '🤩 Excited' },
  { value: 'relaxed', label: '😌 Relaxed' },
  { value: 'tired', label: '😴 Tired' },
  { value: 'sad', label: '😔 Sad' },
  { value: 'angry', label: '😠 Angry' },
  { value: 'surprised', label: '😲 Surprised' },
  { value: 'neutral', label: '😐 Neutral' },
];

export default function JournalEntryForm({
  isOpen,
  onClose,
  tripId,
  dayId = null,
  entry = null,
}: JournalEntryFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || null);
      setLocation(entry.location || null);
      setIsPrivate(entry.is_private || false);
      // Set the date from the entry's created_at
      if (entry.created_at) {
        setEntryDate(new Date(entry.created_at).toISOString().split('T')[0]);
      }
    } else {
      // Reset form for new entry
      setTitle('');
      setContent('');
      setMood(null);
      setLocation(null);
      setIsPrivate(false);
      setEntryDate(new Date().toISOString().split('T')[0]);
    }
  }, [entry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a journal entry',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Title and content are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create a date object from the selected date
      // Set the time to the current time if it's a new entry
      // or keep the original time if it's an edit
      let createdAt;
      if (entry && entry.created_at) {
        const originalDate = new Date(entry.created_at);
        const selectedDate = new Date(entryDate);
        // Keep the original time but change the date
        selectedDate.setHours(originalDate.getHours());
        selectedDate.setMinutes(originalDate.getMinutes());
        selectedDate.setSeconds(originalDate.getSeconds());
        createdAt = selectedDate.toISOString();
      } else {
        // For new entries, use the selected date with current time
        const now = new Date();
        const selectedDate = new Date(entryDate);
        selectedDate.setHours(now.getHours());
        selectedDate.setMinutes(now.getMinutes());
        selectedDate.setSeconds(now.getSeconds());
        createdAt = selectedDate.toISOString();
      }

      const entryData = {
        trip_id: tripId,
        day_id: dayId,
        user_id: user.id,
        title,
        content,
        mood,
        location,
        coordinates: null, // We'll add location picker in a future update
        weather: null, // We'll add weather integration in a future update
        is_private: isPrivate,
        created_at: createdAt,
      };

      if (entry) {
        // Update existing entry
        await dispatch(updateJournalEntry({ id: entry.id, ...entryData }));
        toast({
          title: 'Journal updated',
          description: 'Your journal entry has been updated successfully',
        });
      } else {
        // Create new entry
        await dispatch(addJournalEntry(entryData));
        toast({
          title: 'Journal created',
          description: 'Your journal entry has been created successfully',
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the journal entry',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Journal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryDate" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="entryDate"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, experiences and memories..."
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <SmileIcon className="h-4 w-4" />
                Mood
              </Label>
              <select
                value={mood || ''}
                onChange={(e) => setMood(e.target.value || null)}
                className="w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a mood</option>
                {moods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                value={location || ''}
                onChange={(e) => setLocation(e.target.value || null)}
                placeholder="Where are you?"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isPrivate" className="cursor-pointer">
              Private journal (visible only to you)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : entry ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
