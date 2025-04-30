'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import ChatBot from '@/components/ai/ChatBot';

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;

        // Fetch accommodations
        const { data: accommodationsData, error: accommodationsError } = await supabase
          .from('accommodations')
          .select('*')
          .eq('trip_id', id);

        if (accommodationsError) throw accommodationsError;

        // Fetch transportation
        const { data: transportationData, error: transportationError } = await supabase
          .from('transportation')
          .select('*')
          .eq('trip_id', id);

        if (transportationError) throw transportationError;

        // Add accommodations and transportation to trip data
        const tripWithDetails = {
          ...tripData,
          accommodations: accommodationsData || [],
          transportation: transportationData || []
        };

        setTrip(tripWithDetails);

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            role,
            users (
              full_name,
              email
            )
          `)
          .eq('trip_id', id);

        if (participantsError) throw participantsError;

        // Format participants data
        const formattedParticipants = participantsData?.map((p: any) => ({
          id: p.id as string,
          user_id: p.user_id as string,
          role: p.role as string,
          full_name: (p.users?.full_name as string) || 'Unknown',
          email: (p.users?.email as string) || 'Unknown',
        }));

        setParticipants(formattedParticipants);
      } catch (error) {
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  return (
    <>
      {children}

      {/* AI Assistant - Visible on all trip pages */}
      {!loading && trip && (
        <ChatBot
          tripId={id as string}
          tripName={trip?.name || 'Viaggio'}
          tripData={trip ? {
            id: trip.id,
            name: trip.name,
            description: trip.description,
            destination: trip.destination,
            destinations: trip.destinations || [trip.destination],
            startDate: trip.start_date,
            endDate: trip.end_date,
            budget: trip.budget_total,
            currency: trip.currency || 'EUR',
            participants: participants || [],
            isPrivate: trip.is_private,
            createdAt: trip.created_at,
            owner: trip.owner_id,
            accommodations: trip.accommodations || [],
            transportation: trip.transportation || [],
            activities: trip.activities || []
          } : undefined}
        />
      )}
    </>
  );
}
