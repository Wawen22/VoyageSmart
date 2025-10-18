'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import TripChat from '@/components/chat/TripChat';
import { MessageCircleIcon } from 'lucide-react';
import { TripChecklistTrigger } from '@/components/trips/TripChecklistTrigger';

export default function TripChatPage() {
  const { id } = useParams();
  const tripId = Array.isArray(id) ? id[0] : (id as string);
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);

  // Prevent body scroll on mobile
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Store original styles
      const originalStyle = {
        overflow: document.body.style.overflow,
        height: document.body.style.height,
        position: document.body.style.position,
        width: document.body.style.width,
      };

      // Apply mobile chat styles
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';

      // Cleanup on unmount
      return () => {
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.height = originalStyle.height;
        document.body.style.position = originalStyle.position;
        document.body.style.width = originalStyle.width;
      };
    }
  }, []);

  useEffect(() => {
    const fetchTripAndCheckAccess = async () => {
      try {
        setLoading(true);

        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('id, name, destination, owner_id')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;

        setTrip(tripData);

        // Check if user is a participant
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
          setError('You do not have permission to access this trip\'s chat');
        }
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripAndCheckAccess();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (error && !isParticipant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Link
          href={`/trips/${id}`}
          className="text-primary hover:text-primary/90 transition-colors"
        >
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
        <Link
          href="/dashboard"
          className="text-primary hover:text-primary/90 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden chat-page-mobile">
      <header className="relative overflow-hidden flex-shrink-0 mb-3 md:mb-6">
        {/* Modern Glassmorphism Background - Violet/Pink Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-background/95 to-pink-500/10 backdrop-blur-xl"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto py-2 md:py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start md:mb-4 gap-2">
            <BackButton href={`/trips/${id}`} label="Back to Trip" theme="violet" />
            <TripChecklistTrigger tripId={tripId} />
          </div>

          {/* Hide Group Chat title section on mobile, show only on desktop */}
          <div className="hidden md:flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20">
                <MessageCircleIcon className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  <span className="bg-gradient-to-r from-foreground via-violet-500 to-foreground bg-clip-text text-transparent">
                    Group Chat
                  </span>
                </h1>
                {trip && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {trip.name} {trip.destination && `• ${trip.destination}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0 md:pb-6 min-h-0 w-full">
        <div className="glass-card rounded-2xl overflow-hidden animate-glass-fade-in h-full">
          <TripChat tripId={id as string} tripName={trip.name} />
        </div>
      </main>
    </div>
  );
}
