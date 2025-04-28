'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { JournalMedia, deleteJournalMedia } from '@/lib/features/journalSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  ImageIcon,
  VideoIcon,
  TrashIcon,
  ExpandIcon,
  TagIcon,
  MapPinIcon,
  XIcon,
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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MediaGalleryProps {
  media: JournalMedia[];
  tripId: string;
  dayId?: string;
}

export default function MediaGallery({ media, tripId, dayId }: MediaGalleryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<JournalMedia | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<JournalMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Filter media based on current filters
  const filteredMedia = media.filter((item) => {
    // Filter by type
    if (filter === 'photos' && item.type !== 'photo') return false;
    if (filter === 'videos' && item.type !== 'video') return false;

    // Filter by day if dayId is provided
    if (dayId && item.day_id !== dayId) return false;

    // Filter by tag if tagFilter is set
    if (tagFilter && (!item.tags || !item.tags.includes(tagFilter))) return false;

    return true;
  });

  // Get all unique tags from media
  const allTags = Array.from(
    new Set(
      media
        .filter(item => item.tags && item.tags.length > 0)
        .flatMap(item => item.tags || [])
    )
  );

  const handleDeleteMedia = async () => {
    if (!mediaToDelete) return;

    setLoading(true);
    try {
      await dispatch(deleteJournalMedia({
        id: mediaToDelete.id,
        url: mediaToDelete.url,
      }));

      toast({
        title: 'Media eliminato',
        description: 'Il file è stato eliminato con successo',
      });

      // Close dialogs
      setMediaToDelete(null);
      if (selectedMedia?.id === mediaToDelete.id) {
        setSelectedMedia(null);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'eliminazione del file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No photos or videos available</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-8"
            >
              All
            </Button>
            <Button
              variant={filter === 'photos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('photos')}
              className="h-8"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos
            </Button>
            <Button
              variant={filter === 'videos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('videos')}
              className="h-8"
            >
              <VideoIcon className="h-4 w-4 mr-1" />
              Videos
            </Button>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                Tags:
              </span>
              {tagFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTagFilter(null)}
                  className="h-7 px-2 text-xs"
                >
                  <XIcon className="h-3 w-3 mr-1" />
                  Remove filter
                </Button>
              )}
              {allTags.slice(0, 5).map(tag => (
                <Button
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className="h-7 px-2 text-xs"
                >
                  #{tag}
                </Button>
              ))}
              {allTags.length > 5 && (
                <span className="text-xs text-muted-foreground">+{allTags.length - 5} more</span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden group relative cursor-pointer hover:shadow-md transition-all duration-300"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square relative">
                {item.type === 'photo' ? (
                  <img
                    src={item.url}
                    alt={item.caption || 'Photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <VideoIcon className="h-12 w-12 text-white opacity-70" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-black/20"
                  >
                    <ExpandIcon className="h-5 w-5" />
                  </Button>
                </div>

                {item.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 text-white opacity-0 group-hover:opacity-100 hover:bg-black/20 h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaToDelete(item);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {(item.caption || item.location) && (
                <div className="p-2 text-xs truncate">
                  {item.caption ? (
                    <p className="font-medium truncate">{item.caption}</p>
                  ) : item.location ? (
                    <p className="text-muted-foreground flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1 inline" />
                      {item.location}
                    </p>
                  ) : null}
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredMedia.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No results for the selected filters</p>
          </div>
        )}
      </div>

      {/* Media viewer dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sr-only">
            {/* Visually hidden title for accessibility */}
            <DialogTitle>
              {selectedMedia?.caption || 'Visualizzazione media'}
            </DialogTitle>
          </div>

          {selectedMedia && (
            <div className="flex flex-col">
              <div className="relative bg-black flex items-center justify-center">
                {selectedMedia.type === 'photo' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.caption || 'Photo'}
                    className="max-h-[70vh] w-auto object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-h-[70vh] w-auto"
                  />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-white hover:bg-black/20 h-8 w-8 p-0 rounded-full"
                  onClick={() => setSelectedMedia(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 space-y-3">
                {selectedMedia.caption && (
                  <p className="font-medium">{selectedMedia.caption}</p>
                )}

                <div className="flex flex-wrap gap-2 text-sm">
                  {selectedMedia.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {selectedMedia.location}
                    </div>
                  )}

                  <div className="flex items-center text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {formatDate(selectedMedia.created_at)}
                  </div>

                  {selectedMedia.user && (
                    <div className="flex items-center text-muted-foreground">
                      Caricato da: {selectedMedia.user.full_name}
                    </div>
                  )}
                </div>

                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedMedia.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-xs bg-muted px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {selectedMedia.user_id === user?.id && (
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setMediaToDelete(selectedMedia);
                        setSelectedMedia(null);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Elimina
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!mediaToDelete} onOpenChange={(open) => !open && setMediaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMedia}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
