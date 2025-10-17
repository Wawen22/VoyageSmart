'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { BookOpenIcon, ImageIcon, ClockIcon, PlusIcon, LockIcon, InfoIcon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchJournalEntries, fetchJournalMedia, JournalEntry } from '@/lib/features/journalSlice';

// Lazy load heavy components
const JournalEntryForm = lazy(() => import('@/components/journal/JournalEntryForm'));
const JournalEntryCard = lazy(() => import('@/components/journal/JournalEntryCard'));
const SimpleMediaUploader = lazy(() => import('@/components/journal/SimpleMediaUploader'));
const MediaGallery = lazy(() => import('@/components/journal/MediaGallery'));
const MemoriesTimeline = lazy(() => import('@/components/journal/MemoriesTimeline'));
const JournalInfoModal = lazy(() => import('@/components/subscription/JournalInfoModal'));

type Trip = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
};

export default function TripJournal() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, media, loading: journalLoading } = useSelector((state: RootState) => state.journal);

  const hasJournalAccess = canAccessFeature('journal');

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  const [journalTab, setJournalTab] = useState('timeline');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [showJournalInfoModal, setShowJournalInfoModal] = useState(false);

  useEffect(() => {
    dispatch(fetchJournalEntries(id as string));
    dispatch(fetchJournalMedia(id as string));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        if (!user) return;

        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, name, start_date, end_date, destination, owner_id')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

        const { data: participantData, error: participantError } = await supabase
          .from('trip_participants')
          .select('id')
          .eq('trip_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (participantError) throw participantError;

        const isUserParticipant = !!participantData || tripData.owner_id === user.id;
        setIsParticipant(isUserParticipant);

        if (!isUserParticipant) {
          setError('You do not have permission to view this trip\'s journal');
        }
      } catch (err) {
        console.error('Error fetching trip data:', err);
        setError('Failed to load trip data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id, user]);

  const handleAddEntry = () => {
    setCurrentEntry(null);
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setShowEntryForm(true);
  };

  const handleCloseForm = () => {
    setShowEntryForm(false);
    setCurrentEntry(null);
  };

  const handleToggleMediaUploader = () => {
    setShowMediaUploader(!showMediaUploader);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center mb-6">
          <BackButton href={`/trips/${id}`} />
          <h1 className="text-2xl font-bold ml-2">Journal</h1>
        </div>
        <div>Loading Journal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Link href={`/trips/${id}`} className="text-primary hover:text-primary/90 transition-colors">
          ← Back to Trip
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>Trip not found</p>
        </div>
        <Link href="/dashboard" className="text-primary hover:text-primary/90 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-visible mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-background/95 to-blue-500/10 backdrop-blur-xl"></div>
        <div className="relative z-20 backdrop-blur-sm bg-background/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton href={`/trips/${id}`} label="Back to Trip" theme="purple" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8 md:py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="animate-glass-fade-in">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20">
                  <BookOpenIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  <span className="bg-gradient-to-r from-foreground via-purple-500 to-foreground bg-clip-text text-transparent">
                    Travel Journal
                  </span>
                </h1>
                {trip && (
                  <p className="text-base text-muted-foreground mt-1">
                    {trip.name} {trip.destination && `• ${trip.destination}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!hasJournalAccess ? (
          <div className="flex justify-center">
            <div className="glass-card rounded-2xl p-8 text-center animate-glass-fade-in">
                <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-sm border border-white/20 inline-block">
                    <LockIcon className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mt-4">Premium Feature</h2>
                <p className="text-muted-foreground mt-2">The Journal is a premium feature. Upgrade your plan to start capturing your travel memories.</p>
                <Button onClick={() => router.push('/pricing')} className="mt-6">Upgrade to Premium</Button>
            </div>
          </div>
        ) : (
          <div className="mt-0 w-full">
            <div className="glass-card rounded-xl p-4 animate-glass-fade-in journal-controls-mobile mb-4" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 backdrop-blur-sm">
                    <BookOpenIcon className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Travel Journal</h3>
                    <p className="text-sm text-muted-foreground">Capture memories and moments</p>
                  </div>
                </div>
                <div className="flex justify-center sm:justify-end">
                  <div className="glass-nav rounded-xl p-1 border border-white/20 bg-background/50 backdrop-blur-sm flex">
                    <button onClick={() => setJournalTab('entries')} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${journalTab === 'entries' ? 'bg-purple-500/20 text-purple-600 shadow-sm' : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'}`}>
                      <BookOpenIcon className="h-4 w-4 mr-2" />
                      Entries
                    </button>
                    <button onClick={() => setJournalTab('gallery')} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${journalTab === 'gallery' ? 'bg-purple-500/20 text-purple-600 shadow-sm' : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'}`}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Gallery
                    </button>
                    <button onClick={() => setJournalTab('timeline')} className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${journalTab === 'timeline' ? 'bg-purple-500/20 text-purple-600 shadow-sm' : 'text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10'}`}>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Timeline
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {journalTab === 'entries' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <BookOpenIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Journal Entries</h3>
                  </div>
                  <button onClick={handleAddEntry} className="relative overflow-hidden px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 group shadow-lg shadow-purple-500/25">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-indigo-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <div className="relative z-10 flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-500 transition-colors" />
                      <span className="text-purple-600 group-hover:text-purple-500 transition-colors text-sm font-medium">New Entry</span>
                    </div>
                  </button>
                </div>
                <div className="space-y-4">
                  {journalLoading && entries.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">Loading your journal entries...</p>
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                      <h2 className="text-xl font-bold text-foreground">No journal entries yet</h2>
                      <p className="text-muted-foreground max-w-md mx-auto mt-2">Start documenting your travel memories and experiences.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {entries.map((entry, index) => (
                        <div key={entry.id} className="glass-card rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 md:hover:scale-[1.02] hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
                          <JournalEntryCard entry={entry} onEdit={handleEditEntry} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {journalTab === 'gallery' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                      <ImageIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Media Gallery</h3>
                  </div>
                  <button onClick={handleToggleMediaUploader} className="relative overflow-hidden px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 group shadow-lg shadow-purple-500/25">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-indigo-500/20 backdrop-blur-sm border border-purple-500/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                    <div className="relative z-10 flex items-center gap-2">
                      <PlusIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-500 transition-colors" />
                      <span className="text-purple-600 group-hover:text-purple-500 transition-colors text-sm font-medium">Upload Media</span>
                    </div>
                  </button>
                </div>
                {showMediaUploader && (
                  <div className="mb-4 p-4 rounded-xl bg-background/30 border border-white/10">
                    <SimpleMediaUploader tripId={id as string} onUploadComplete={() => { setShowMediaUploader(false); dispatch(fetchJournalMedia(id as string)); }} />
                  </div>
                )}
                <MediaGallery media={media} tripId={id as string} />
              </div>
            )}

            {journalTab === 'timeline' && (
              <div className="glass-card rounded-2xl p-4 animate-glass-fade-in">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                    <ClockIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Timeline</h3>
                </div>
                <MemoriesTimeline tripId={id as string} onAddEntry={handleAddEntry} onUploadMedia={handleToggleMediaUploader} />
              </div>
            )}
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        {showEntryForm && (
          <JournalEntryForm isOpen={showEntryForm} onClose={handleCloseForm} tripId={id as string} entry={currentEntry} />
        )}
        {showJournalInfoModal && (
          <JournalInfoModal isOpen={showJournalInfoModal} onClose={() => setShowJournalInfoModal(false)} />
        )}
      </Suspense>
    </div>
  );
}