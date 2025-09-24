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
import { SmileIcon, MapPinIcon, CloudIcon, CalendarIcon, BookOpenIcon } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto  border-purple-500/20 journal-modal-mobile">
        {/* Modern Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 opacity-50 rounded-2xl"></div>
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl opacity-50"></div>

        <DialogHeader className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20">
              <BookOpenIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                <span className="bg-gradient-to-r from-foreground via-purple-500 to-foreground bg-clip-text text-transparent">
                  {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
                </span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {entry ? 'Update your travel memory' : 'Capture your travel memory'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4 relative z-10">
          {/* Basic Information Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-purple-500/20 mr-2">
                <BookOpenIcon className="h-4 w-4 text-purple-500" />
              </div>
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-foreground">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your memory a title..."
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="entryDate" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-500" />
                  Date
                </Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 mr-2">
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Your Story
            </h3>

            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts, experiences and memories..."
                className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1 min-h-[200px] resize-none"
                required
              />
            </div>
          </div>

          {/* Mood & Location Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center">
              <div className="p-1.5 rounded-lg bg-amber-500/20 mr-2">
                <SmileIcon className="h-4 w-4 text-amber-500" />
              </div>
              Mood & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <SmileIcon className="h-4 w-4 text-amber-500" />
                  Mood
                </Label>
                <select
                  value={mood || ''}
                  onChange={(e) => setMood(e.target.value || null)}
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1 w-full py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                <option value="">Select a mood</option>
                {moods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-green-500" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location || ''}
                  onChange={(e) => setLocation(e.target.value || null)}
                  placeholder="Where are you?"
                  className="glass-button border-white/20 bg-background/50 backdrop-blur-sm mt-1"
                />
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="glass-info-card p-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-white/30 text-purple-500 focus:ring-purple-500 bg-background/50 backdrop-blur-sm"
              />
              <Label htmlFor="isPrivate" className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private journal (visible only to you)
              </Label>
            </div>
          </div>

          <DialogFooter className="relative z-10 pt-6 border-t border-white/10">
            <div className="flex space-x-3 w-full sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="glass-button flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
