'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import ChatBot from '@/components/ai/ChatBot';

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
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

        // Fetch itinerary days
        const { data: itineraryDaysData, error: itineraryDaysError } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id)
          .order('day_date', { ascending: true });

        if (itineraryDaysError) throw itineraryDaysError;

        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('trip_id', id)
          .order('start_time', { ascending: true });

        if (activitiesError) throw activitiesError;

        // Fetch expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            id, category, amount, currency, date, description, paid_by, split_type, status, created_at,
            users!inner(full_name)
          `)
          .eq('trip_id', id)
          .order('date', { ascending: false });

        if (expensesError) throw expensesError;

        // Group activities by day_id
        const activitiesByDay = (activitiesData || []).reduce((acc: any, activity: any) => {
          if (!acc[activity.day_id]) {
            acc[activity.day_id] = [];
          }
          acc[activity.day_id].push(activity);
          return acc;
        }, {});

        // Combine days with their activities
        const daysWithActivities = (itineraryDaysData || []).map((day: any) => ({
          ...day,
          activities: activitiesByDay[day.id] || []
        }));

        // Process expenses with participants
        let processedExpenses: any[] = [];
        if (expensesData && expensesData.length > 0) {
          // Fetch expense participants for all expenses
          const expenseIds = expensesData.map(e => e.id);
          const { data: expenseParticipants } = await supabase
            .from('expense_participants')
            .select(`
              expense_id, user_id, amount, is_paid,
              users!inner(full_name)
            `)
            .in('expense_id', expenseIds);

          // Group participants by expense
          const participantsByExpense: Record<string, any[]> = {};
          (expenseParticipants || []).forEach(participant => {
            if (!participantsByExpense[participant.expense_id]) {
              participantsByExpense[participant.expense_id] = [];
            }
            participantsByExpense[participant.expense_id].push(participant);
          });

          // Process expenses with their participants
          processedExpenses = expensesData.map(expense => ({
            id: expense.id,
            category: expense.category,
            amount: expense.amount,
            currency: expense.currency,
            date: expense.date,
            description: expense.description,
            paid_by: expense.paid_by,
            paid_by_name: expense.users?.full_name || 'Sconosciuto',
            split_type: expense.split_type,
            status: expense.status,
            created_at: expense.created_at,
            participants: (participantsByExpense[expense.id] || []).map(p => ({
              user_id: p.user_id,
              amount: p.amount,
              is_paid: p.is_paid,
              full_name: p.users?.full_name || 'Sconosciuto'
            }))
          }));
        }

        // Add accommodations, transportation, itinerary and expenses to trip data
        const tripWithDetails = {
          ...tripData,
          accommodations: accommodationsData || [],
          transportation: transportationData || [],
          itinerary: daysWithActivities || [],
          expenses: processedExpenses
        };

        // Log itinerary data for debugging
        console.log('Itinerary data:', {
          daysCount: daysWithActivities.length,
          activitiesCount: activitiesData ? activitiesData.length : 0,
          sampleDay: daysWithActivities.length > 0 ? daysWithActivities[0] : null
        });

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

  // Verifica se l'utente ha accesso alle funzionalità AI
  const hasAIAccess = canAccessFeature('ai_assistant');

  return (
    <>
      {children}

      {/* AI Assistant - Visible on all trip pages only for AI subscribers */}
      {!loading && trip && hasAIAccess && (
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
            itinerary: trip.itinerary || [],
            expenses: trip.expenses || [],
            currentUserId: user?.id
          } : undefined}
        />
      )}
    </>
  );
}
