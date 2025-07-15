import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Crea una nuova istanza di Supabase per assicurarci che funzioni correttamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache per il contesto dei viaggi
const tripContextCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

/**
 * Get cached trip context if available and not expired
 */
function getCachedTripContext(tripId: string): any | null {
  const cached = tripContextCache.get(tripId);
  if (cached && cached.expiry > Date.now()) {
    logger.debug('Returning cached trip context', { tripId });
    return cached.data;
  }

  // Remove expired cache entry
  if (cached) {
    tripContextCache.delete(tripId);
  }

  return null;
}

/**
 * Cache trip context
 */
function setCachedTripContext(tripId: string, data: any): void {
  tripContextCache.set(tripId, {
    data,
    expiry: Date.now() + CACHE_TTL
  });

  // Cleanup old entries periodically
  if (Math.random() < 0.05) { // 5% chance
    const now = Date.now();
    for (const [key, value] of tripContextCache.entries()) {
      if (value.expiry <= now) {
        tripContextCache.delete(key);
      }
    }
  }
}

/**
 * Raccoglie tutti i dati relativi a un viaggio per fornire contesto all'AI
 * Ottimizzato con caching e query parallele
 */
export async function getTripContext(tripId: string) {
  const startTime = performance.now();
  logger.debug('Getting trip context', { tripId });

  if (!tripId) {
    logger.error('Invalid trip ID provided', { tripId });
    return {
      trip: {
        id: 'unknown',
        name: 'Viaggio sconosciuto',
        destination: 'Destinazione sconosciuta'
      },
      error: 'ID viaggio non valido'
    };
  }

  // Check cache first
  const cached = getCachedTripContext(tripId);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Fetching trip context from database', { tripId });

    // Esegui tutte le query in parallelo per migliorare le performance
    const [
      tripResult,
      participantsResult,
      accommodationsResult,
      transportationResult,
      itineraryDaysResult,
      activitiesResult,
      expensesResult,
      expenseParticipantsResult
    ] = await Promise.allSettled([
      // Query principale del viaggio
      supabase
        .from('trips')
        .select('id, name, description, destination, start_date, end_date, owner_id, is_private, budget_total, currency, created_at')
        .eq('id', tripId)
        .single(),

      // Query partecipanti
      supabase
        .from('trip_participants')
        .select('invited_email, role, invitation_status')
        .eq('trip_id', tripId),

      // Query alloggi
      supabase
        .from('accommodations')
        .select('name, type, check_in_date, check_out_date, address')
        .eq('trip_id', tripId),

      // Query trasporti
      supabase
        .from('transportation')
        .select('type, provider, departure_time, departure_location, arrival_time, arrival_location')
        .eq('trip_id', tripId),

      // Query giorni itinerario
      supabase
        .from('itinerary_days')
        .select('id, day_date, notes')
        .eq('trip_id', tripId)
        .order('day_date', { ascending: true }),

      // Query attività
      supabase
        .from('activities')
        .select('id, name, type, start_time, end_time, location, notes, day_id')
        .eq('trip_id', tripId)
        .order('start_time', { ascending: true }),

      // Query spese
      supabase
        .from('expenses')
        .select(`
          id, category, amount, currency, date, description, paid_by, split_type, status, created_at,
          users!inner(full_name)
        `)
        .eq('trip_id', tripId)
        .order('date', { ascending: false }),

      // Query partecipanti spese
      supabase
        .from('expense_participants')
        .select(`
          expense_id, user_id, amount, is_paid,
          users!inner(full_name)
        `)
        .in('expense_id', [])  // Will be updated after expenses are fetched
    ]);

    // Verifica che la query principale del viaggio sia riuscita
    if (tripResult.status === 'rejected' || tripResult.value.error) {
      const error = tripResult.status === 'rejected' ? tripResult.reason : tripResult.value.error;
      logger.error('Failed to fetch trip data', { tripId, error });
      throw error;
    }

    const tripData = tripResult.value.data;
    logger.debug('Trip data fetched successfully', { tripId, tripName: tripData.name });

    // Costruisci il contesto del viaggio
    const tripContext = {
      trip: {
        id: tripData.id,
        name: tripData.name,
        description: tripData.description,
        destination: tripData.destination,
        startDate: tripData.start_date,
        endDate: tripData.end_date,
        owner: tripData.owner_id,
        isPrivate: tripData.is_private,
        budgetTotal: tripData.budget_total,
        currency: tripData.currency || 'EUR',
        createdAt: tripData.created_at
      },
      participants: [],
      accommodations: [],
      transportation: [],
      itinerary: [],
      expenses: []
    };

    // Processa i risultati delle query parallele
    // Partecipanti
    if (participantsResult.status === 'fulfilled' && !participantsResult.value.error) {
      tripContext.participants = participantsResult.value.data?.map(p => ({
        name: p.invited_email || 'Partecipante',
        email: p.invited_email || 'Email sconosciuta',
        role: p.role,
        status: p.invitation_status
      })) || [];
      logger.debug('Participants processed', { count: tripContext.participants.length });
    } else {
      logger.warn('Failed to fetch participants', { tripId });
    }

    // Alloggi
    if (accommodationsResult.status === 'fulfilled' && !accommodationsResult.value.error) {
      tripContext.accommodations = accommodationsResult.value.data?.map(a => ({
        name: a.name,
        type: a.type,
        checkIn: a.check_in_date,
        checkOut: a.check_out_date,
        address: a.address
      })) || [];
      logger.debug('Accommodations processed', { count: tripContext.accommodations.length });
    } else {
      logger.warn('Failed to fetch accommodations', { tripId });
    }

    // Trasporti
    if (transportationResult.status === 'fulfilled' && !transportationResult.value.error) {
      tripContext.transportation = transportationResult.value.data?.map(t => ({
        type: t.type,
        provider: t.provider,
        departureTime: t.departure_time,
        departureLocation: t.departure_location,
        arrivalTime: t.arrival_time,
        arrivalLocation: t.arrival_location
      })) || [];
      logger.debug('Transportation processed', { count: tripContext.transportation.length });
    } else {
      logger.warn('Failed to fetch transportation', { tripId });
    }

    // Itinerario (giorni e attività)
    if (itineraryDaysResult.status === 'fulfilled' && !itineraryDaysResult.value.error &&
        activitiesResult.status === 'fulfilled' && !activitiesResult.value.error) {

      const itineraryDays = itineraryDaysResult.value.data || [];
      const activities = activitiesResult.value.data || [];

      // Raggruppa le attività per giorno per efficienza
      const activitiesByDay: Record<string, any[]> = {};
      activities.forEach(activity => {
        if (!activitiesByDay[activity.day_id]) {
          activitiesByDay[activity.day_id] = [];
        }
        activitiesByDay[activity.day_id].push(activity);
      });

      // Combina i giorni con le loro attività
      tripContext.itinerary = itineraryDays.map(day => {
        const dayActivities = activitiesByDay[day.id] || [];
        return {
          id: day.id,
          day_date: day.day_date,
          date: day.day_date,
          notes: day.notes,
          activities: dayActivities.map(activity => ({
            id: activity.id,
            name: activity.name,
            type: activity.type,
            start_time: activity.start_time,
            startTime: activity.start_time,
            end_time: activity.end_time,
            endTime: activity.end_time,
            location: activity.location,
            notes: activity.notes,
            day_id: activity.day_id
          }))
        };
      });

      logger.debug('Itinerary processed', {
        daysCount: tripContext.itinerary.length,
        totalActivities: activities.length
      });
    } else {
      logger.warn('Failed to fetch itinerary data', { tripId });
      tripContext.itinerary = [];
    }

    // Spese
    if (expensesResult.status === 'fulfilled' && !expensesResult.value.error) {
      const expenses = expensesResult.value.data || [];

      // Fetch expense participants for each expense
      if (expenses.length > 0) {
        const expenseIds = expenses.map(e => e.id);

        // Update the expense participants query with actual expense IDs
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
        tripContext.expenses = expenses.map(expense => ({
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

        logger.debug('Expenses processed', {
          count: tripContext.expenses.length,
          totalAmount: tripContext.expenses.reduce((sum, e) => sum + e.amount, 0)
        });
      } else {
        tripContext.expenses = [];
      }
    } else {
      logger.warn('Failed to fetch expenses', { tripId });
      tripContext.expenses = [];
    }

    // Cache del risultato per future richieste
    setCachedTripContext(tripId, tripContext);

    // Log performance
    const duration = performance.now() - startTime;
    logger.performance('Trip context retrieval', duration, {
      tripId,
      participantsCount: tripContext.participants.length,
      accommodationsCount: tripContext.accommodations.length,
      transportationCount: tripContext.transportation.length,
      itineraryDaysCount: tripContext.itinerary.length,
      totalActivities: tripContext.itinerary.reduce((sum, day) => sum + day.activities.length, 0),
      expensesCount: tripContext.expenses.length,
      totalExpenseAmount: tripContext.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    });

    logger.debug('Trip context retrieved successfully', { tripId, duration });
    return tripContext;

  } catch (error: any) {
    const duration = performance.now() - startTime;
    logger.error('Failed to retrieve trip context', {
      tripId,
      error: error.message,
      duration
    });

    // In caso di errore, restituisci un contesto minimo
    return {
      trip: {
        id: tripId,
        name: 'Viaggio',
        destination: 'Destinazione sconosciuta'
      },
      participants: [],
      accommodations: [],
      transportation: [],
      itinerary: [],
      expenses: [],
      error: 'Non è stato possibile recuperare tutti i dettagli del viaggio'
    };
  }
}

/**
 * Clear trip context cache (useful for testing or when trip data changes)
 */
export function clearTripContextCache(tripId?: string): void {
  if (tripId) {
    tripContextCache.delete(tripId);
  } else {
    tripContextCache.clear();
  }
}
