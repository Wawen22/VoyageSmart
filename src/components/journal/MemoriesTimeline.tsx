'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { JournalEntry, JournalMedia, fetchJournalEntries, fetchJournalMedia } from '@/lib/features/journalSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { CalendarIcon, ImageIcon, BookOpenIcon, FilterIcon, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MemoriesTimelineProps {
  tripId: string;
}

type TimelineItem = {
  id: string;
  type: 'entry' | 'media';
  date: Date;
  data: JournalEntry | JournalMedia;
};

export default function MemoriesTimeline({ tripId }: MemoriesTimelineProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { entries, media, loading } = useSelector((state: RootState) => state.journal);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'entries' | 'media'>('all');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<JournalMedia | null>(null);

  useEffect(() => {
    dispatch(fetchJournalEntries(tripId));
    dispatch(fetchJournalMedia(tripId));
  }, [dispatch, tripId]);

  useEffect(() => {
    // Combine entries and media into a single timeline
    const items: TimelineItem[] = [
      ...entries.map(entry => ({
        id: entry.id,
        type: 'entry' as const,
        date: new Date(entry.created_at),
        data: entry,
      })),
      ...media.map(item => ({
        id: item.id,
        type: 'media' as const,
        date: new Date(item.created_at),
        data: item,
      })),
    ];

    // Sort by date, newest first
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    setTimelineItems(items);
  }, [entries, media]);

  // Apply filters
  const filteredItems = timelineItems.filter(item => {
    // Filter by type
    if (filter === 'entries' && item.type !== 'entry') return false;
    if (filter === 'media' && item.type !== 'media') return false;

    // Filter by year
    if (yearFilter !== null && item.date.getFullYear() !== yearFilter) return false;

    // Filter by month
    if (monthFilter !== null && item.date.getMonth() !== monthFilter) return false;

    return true;
  });

  // Get unique years and months for filters
  const years = Array.from(new Set(timelineItems.map(item => item.date.getFullYear())))
    .sort((a, b) => b - a); // Sort descending

  const months = Array.from(new Set(
    timelineItems
      .filter(item => yearFilter === null || item.date.getFullYear() === yearFilter)
      .map(item => item.date.getMonth())
  )).sort((a, b) => a - b); // Sort ascending

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group items by date (YYYY-MM-DD)
  const groupedItems: Record<string, TimelineItem[]> = {};

  filteredItems.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    if (!groupedItems[dateKey]) {
      groupedItems[dateKey] = [];
    }
    groupedItems[dateKey].push(item);
  });

  // Sort dates (keys) in descending order
  const sortedDates = Object.keys(groupedItems).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading && timelineItems.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No memories available for this trip</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
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
              variant={filter === 'entries' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('entries')}
              className="h-8"
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              Entries
            </Button>
            <Button
              variant={filter === 'media' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('media')}
              className="h-8"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos/Videos
            </Button>
          </div>

        <div className="flex flex-wrap gap-2">
          {years.length > 1 && (
            <select
              value={yearFilter === null ? '' : yearFilter}
              onChange={(e) => setYearFilter(e.target.value ? Number(e.target.value) : null)}
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}

          {months.length > 1 && (
            <select
              value={monthFilter === null ? '' : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value ? Number(e.target.value) : null)}
              className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">All months</option>
              {months.map(month => (
                <option key={month} value={month}>{monthNames[month]}</option>
              ))}
            </select>
          )}

          {(yearFilter !== null || monthFilter !== null) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setYearFilter(null);
                setMonthFilter(null);
              }}
              className="h-8"
            >
              Remove filters
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No results for the selected filters</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-8">
            {sortedDates.map(dateKey => (
              <div key={dateKey} className="relative">
                {/* Date marker */}
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="ml-4 bg-muted px-3 py-1 rounded-md text-sm font-medium">
                    {formatDate(dateKey)}
                  </div>
                </div>

                {/* Items for this date */}
                <div className="ml-10 space-y-4">
                  {/* Group items by type */}
                  {(() => {
                    // Separate entries and media
                    const entries = groupedItems[dateKey].filter(item => item.type === 'entry');
                    const mediaItems = groupedItems[dateKey].filter(item => item.type === 'media');

                    return (
                      <>
                        {/* Render entries */}
                        {entries.map(item => (
                          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpenIcon className="h-4 w-4 text-primary" />
                                <h3 className="font-medium">{(item.data as JournalEntry).title}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {(item.data as JournalEntry).content}
                              </p>
                            </CardContent>
                          </Card>
                        ))}

                        {/* Render media items in a grid */}
                        {mediaItems.length > 0 && (
                          <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {mediaItems.map(item => (
                                  <div
                                    key={item.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedMedia(item.data as JournalMedia)}
                                  >
                                    {(item.data as JournalMedia).type === 'photo' ? (
                                      <div className="relative overflow-hidden rounded-md">
                                        <img
                                          src={(item.data as JournalMedia).url}
                                          alt={(item.data as JournalMedia).caption || 'Photo'}
                                          className="w-full h-auto object-contain max-h-[200px]"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                                        {(item.data as JournalMedia).caption && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                                            {(item.data as JournalMedia).caption}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="bg-black flex items-center justify-center h-[150px] rounded-md">
                                        <ImageIcon className="h-10 w-10 text-white opacity-70" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
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
                      <span className="mr-1">📍</span>
                      {selectedMedia.location}
                    </div>
                  )}

                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(selectedMedia.created_at)}
                  </div>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
