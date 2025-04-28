'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { JournalEntry, deleteJournalEntry, setCurrentEntry } from '@/lib/features/journalSlice';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  CalendarIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  MapPinIcon,
  SmileIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
}

export default function JournalEntryCard({ entry, onEdit }: JournalEntryCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwner = user?.id === entry.user_id;
  const createdAt = new Date(entry.created_at);
  const formattedDate = formatDate(entry.created_at);
  const formattedTime = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return null;
    
    const moodMap: Record<string, string> = {
      happy: '😊',
      excited: '🤩',
      relaxed: '😌',
      tired: '😴',
      sad: '😔',
      angry: '😠',
      surprised: '😲',
      neutral: '😐',
    };
    
    return moodMap[mood] || null;
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await dispatch(deleteJournalEntry(entry.id));
      toast({
        title: 'Diario eliminato',
        description: 'Il diario è stato eliminato con successo',
      });
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'eliminazione del diario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <Card className="w-full transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {entry.user?.avatar_url ? (
                  <img src={entry.user.avatar_url} alt={entry.user?.full_name || 'User'} />
                ) : (
                  <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-sm font-medium">
                    {(entry.user?.full_name || 'U').charAt(0)}
                  </div>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-medium">{entry.user?.full_name || 'Utente'}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formattedDate}
                  <ClockIcon className="h-3 w-3 ml-2 mr-1" />
                  {formattedTime}
                </div>
              </div>
            </div>
            {entry.is_private && (
              <div className="flex items-center text-xs text-muted-foreground">
                <LockIcon className="h-3 w-3 mr-1" />
                Privato
              </div>
            )}
          </div>
          <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {entry.mood && (
              <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-full">
                <SmileIcon className="h-3 w-3 mr-1" />
                {getMoodEmoji(entry.mood)} {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
              </div>
            )}
            {entry.location && (
              <div className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-full">
                <MapPinIcon className="h-3 w-3 mr-1" />
                {entry.location}
              </div>
            )}
          </div>
          
          <div className={`prose prose-sm dark:prose-invert max-w-none ${expanded ? '' : 'line-clamp-3'}`}>
            {entry.content.split('\n').map((paragraph, index) => (
              <p key={index} className="my-1">
                {paragraph}
              </p>
            ))}
          </div>
          
          {entry.content.split('\n').length > 3 && (
            <button
              onClick={toggleExpand}
              className="text-xs text-primary hover:underline mt-2 focus:outline-none"
            >
              {expanded ? 'Mostra meno' : 'Mostra tutto'}
            </button>
          )}
        </CardContent>
        {isOwner && (
          <CardFooter className="pt-0 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(entry)}
              className="h-8 px-2"
            >
              <EditIcon className="h-4 w-4 mr-1" />
              Modifica
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 px-2 text-destructive hover:text-destructive-foreground hover:bg-destructive"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Elimina
            </Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro di voler eliminare questo diario?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Il diario verrà eliminato permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
