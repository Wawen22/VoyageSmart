import type { SupabaseClient } from '@supabase/supabase-js';
import { differenceInCalendarDays, endOfDay, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns';
import { createServiceSupabase } from '../supabase-client';
import { logger } from '../logger';

export type ProactiveSuggestionType = 'upcoming_trip' | 'in_trip_activity';
export type ProactiveSuggestionStatus = 'pending' | 'delivered' | 'read' | 'dismissed';

export interface ProactiveSuggestion {
  id: string;
  userId: string;
  tripId: string | null;
  type: ProactiveSuggestionType;
  trigger: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  status: ProactiveSuggestionStatus;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface TriggerProactiveSuggestionsInput {
  userId: string;
  trigger: 'app_open' | 'location_ping';
  context?: {
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
    };
  };
}

export interface TriggerProactiveSuggestionsResult {
  suggestions: ProactiveSuggestion[];
  newlyCreated: ProactiveSuggestion[];
}

interface ProactiveSuggestionRow {
  id: string;
  user_id: string;
  trip_id: string | null;
  suggestion_type: ProactiveSuggestionType;
  trigger_event: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  status: ProactiveSuggestionStatus;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

interface TripSummary {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  preferences: Record<string, any> | null;
}

interface ActivitySummary {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
}

interface PoiSuggestion {
  title: string;
  description: string;
  tags: string[];
}

const PACKING_LIST_ESSENTIALS = [
  'Documento di identità e carte di viaggio',
  'Biglietti e prenotazioni salvati sul dispositivo',
  'Adattatore universale e cavo di ricarica',
  'Kit igienico essenziale e farmaci personali',
  'Power bank e cuffie',
  'Valuta locale o carta di credito abilitata all\'estero'
];

const CITY_POI_PRESETS: Record<string, PoiSuggestion[]> = {
  paris: [
    {
      title: 'Mostra al Musée d\'Orsay',
      description: 'Perfetta per un pomeriggio culturale con vista sulla Senna.',
      tags: ['arte', 'museo', 'cultura']
    },
    {
      title: 'Passeggiata serale a Montmartre',
      description: 'Scopri i bistrot nascosti e goditi la vista dal Sacré-Cœur.',
      tags: ['romantico', 'panorama', 'cucina']
    }
  ],
  rome: [
    {
      title: 'Trastevere autentica',
      description: 'Piccoli bar e trattorie lontano dalla folla – perfetto per una serata rilassata.',
      tags: ['cibo', 'relax', 'quartieri']
    },
    {
      title: 'Passeggiata archeologica serale',
      description: 'Apprezza il Foro e il Colosseo illuminati, con una guida audio gratuita.',
      tags: ['storia', 'notte']
    }
  ],
  london: [
    {
      title: 'Mercato di Borough',
      description: 'Street food internazionale e specialità locali in un mercato coperto storico.',
      tags: ['foodies', 'mercato']
    },
    {
      title: 'Passeggiata lungo il South Bank',
      description: 'Arte pubblica, librerie e vista sul Big Ben al tramonto.',
      tags: ['panorama', 'arte']
    }
  ]
};

const DEFAULT_POI_SUGGESTIONS: PoiSuggestion[] = [
  {
    title: 'Tour guidato locale',
    description: 'Prenota una breve esperienza guidata per scoprire gemme nascoste vicine a te.',
    tags: ['esperienza', 'locale']
  },
  {
    title: 'Caffè consigliato dagli abitanti',
    description: 'Fermati in un caffè apprezzato dai residenti per una pausa autentica.',
    tags: ['cibo', 'relax']
  }
];

function mapSuggestion(row: ProactiveSuggestionRow): ProactiveSuggestion {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    type: row.suggestion_type,
    trigger: row.trigger_event,
    title: row.title,
    message: row.message,
    metadata: row.metadata ?? {},
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at
  };
}

function normalizeCityName(destination: string | null): string | null {
  if (!destination) return null;
  return destination.trim().toLowerCase();
}

function pickPointOfInterest(destination: string | null, locationName?: string | null): PoiSuggestion {
  const normalizedLocation = normalizeCityName(locationName ?? null);
  if (normalizedLocation && CITY_POI_PRESETS[normalizedLocation]?.length) {
    const items = CITY_POI_PRESETS[normalizedLocation];
    return items[Math.floor(Math.random() * items.length)];
  }

  const normalized = normalizeCityName(destination);
  if (normalized && CITY_POI_PRESETS[normalized]?.length) {
    const items = CITY_POI_PRESETS[normalized];
    // rotate suggestions to keep variety
    return items[Math.floor(Math.random() * items.length)];
  }

  return DEFAULT_POI_SUGGESTIONS[Math.floor(Math.random() * DEFAULT_POI_SUGGESTIONS.length)];
}

function createUpcomingTripSuggestion(trip: TripSummary, diffDays: number, trigger: string) {
  const destinationLabel = trip.destination || trip.name;
  const headline = diffDays === 0
    ? `È il giorno della partenza per ${destinationLabel}!`
    : `Mancano ${diffDays} giorni al tuo viaggio per ${destinationLabel}`;

  return {
    suggestion_type: 'upcoming_trip' as const,
    trigger_event: trigger,
    title: headline,
    message: [
      'Prepara tutto il necessario con la nostra checklist intelligente:',
      ...PACKING_LIST_ESSENTIALS.map((item) => `• ${item}`)
    ].join('\n'),
    metadata: {
      checklist: PACKING_LIST_ESSENTIALS,
      tripId: trip.id,
      countdownDays: diffDays
    },
    status: 'delivered' as const
  };
}

function createInTripSuggestion(
  trip: TripSummary,
  poi: PoiSuggestion,
  trigger: string,
  currentLocation?: { latitude?: number; longitude?: number; name?: string }
) {
  const destinationLabel = trip.destination || trip.name;
  const locationLabel = currentLocation?.name ? ` vicino a ${currentLocation.name}` : '';

  return {
    suggestion_type: 'in_trip_activity' as const,
    trigger_event: trigger,
    title: `Tempo libero a ${destinationLabel}${locationLabel}? Ecco un'idea`,
    message: `${poi.title}\n${poi.description}`,
    metadata: {
      tripId: trip.id,
      destination: destinationLabel,
      tags: poi.tags,
      location: currentLocation
    },
    status: 'delivered' as const
  };
}

function mergeTrips(owned: TripSummary[], participating: TripSummary[]): TripSummary[] {
  const all = [...owned];
  for (const trip of participating) {
    if (!all.some((existing) => existing.id === trip.id)) {
      all.push(trip);
    }
  }
  return all;
}

function groupActivitiesByTrip(activities: ActivitySummary[]): Record<string, ActivitySummary[]> {
  return activities.reduce<Record<string, ActivitySummary[]>>((acc, activity) => {
    const key = activity.trip_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(activity);
    return acc;
  }, {});
}

export async function triggerProactiveSuggestions(
  input: TriggerProactiveSuggestionsInput,
  client?: SupabaseClient
): Promise<TriggerProactiveSuggestionsResult> {
  const supabase = client ?? createServiceSupabase();
  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);

  logger.info('AI Suggestions: trigger invoked', {
    userId: input.userId,
    trigger: input.trigger
  });

  const [
    ownedTripsResult,
    participantTripsResult,
    existingSuggestionsResult
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('id, name, destination, start_date, end_date, preferences')
      .eq('owner_id', input.userId),
    supabase
      .from('trip_participants')
      .select('trip_id, trips!inner(id, name, destination, start_date, end_date, preferences)')
      .eq('user_id', input.userId)
      .eq('invitation_status', 'accepted'),
    supabase
      .from('ai_proactive_suggestions')
      .select('id, trip_id, suggestion_type, created_at, status, read_at, delivered_at, title, message, metadata')
      .eq('user_id', input.userId)
      .gte('created_at', subDays(startToday, 30).toISOString())
  ]);

  if (ownedTripsResult.error) {
    logger.error('AI Suggestions: failed to fetch owned trips', { error: ownedTripsResult.error });
    throw ownedTripsResult.error;
  }

  if (participantTripsResult.error) {
    logger.error('AI Suggestions: failed to fetch participant trips', { error: participantTripsResult.error });
    throw participantTripsResult.error;
  }

  if (existingSuggestionsResult.error) {
    logger.error('AI Suggestions: failed to fetch existing suggestions', { error: existingSuggestionsResult.error });
    throw existingSuggestionsResult.error;
  }

  const ownedTrips = (ownedTripsResult.data ?? []) as TripSummary[];
  const participatingTrips = (participantTripsResult.data ?? []).map((entry: any) => entry.trips) as TripSummary[];
  const allTrips = mergeTrips(ownedTrips, participatingTrips);
  const existing = (existingSuggestionsResult.data ?? []) as ProactiveSuggestionRow[];
  const keyFor = (tripId: string | null, type: ProactiveSuggestionType) => `${tripId ?? 'null'}|${type}`;
  const existingMap = new Map<string, ProactiveSuggestionRow>();

  for (const suggestion of existing) {
    const key = keyFor(suggestion.trip_id, suggestion.suggestion_type);
    const current = existingMap.get(key);
    if (!current || new Date(suggestion.created_at) > new Date(current.created_at)) {
      existingMap.set(key, suggestion);
    }
  }

  const tripIds = allTrips.map((trip) => trip.id);
  let todaysActivitiesMap: Record<string, ActivitySummary[]> = {};

  if (tripIds.length > 0) {
    const { data: todaysActivities, error: activityError } = await supabase
      .from('activities')
      .select('id, trip_id, start_time, end_time')
      .in('trip_id', tripIds)
      .gte('start_time', startToday.toISOString())
      .lte('start_time', endToday.toISOString());

    if (activityError) {
      logger.warn('AI Suggestions: failed to fetch todays activities', { error: activityError });
    } else {
      todaysActivitiesMap = groupActivitiesByTrip((todaysActivities ?? []) as ActivitySummary[]);
    }
  }

  const inserts: Array<{ tripId: string | null; payload: Record<string, any> }> = [];
  const updates: Record<string, any>[] = [];

  const prepareUpdate = (
    existingSuggestion: ProactiveSuggestionRow,
    payload: ReturnType<typeof createUpcomingTripSuggestion> | ReturnType<typeof createInTripSuggestion>,
    withinDays: number,
    nowRef: Date
  ) => {
    const nowIso = nowRef.toISOString();
    const baseUpdate: Record<string, any> = {
      id: existingSuggestion.id,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
      trigger_event: payload.trigger_event
    };

    const nextRow: ProactiveSuggestionRow = {
      ...existingSuggestion,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
      trigger_event: payload.trigger_event
    };

    if (existingSuggestion.status === 'dismissed') {
      return { update: baseUpdate, nextRow };
    }

    const createdDiff = differenceInCalendarDays(nowRef, parseISO(existingSuggestion.created_at));
    const readDiff = existingSuggestion.read_at
      ? differenceInCalendarDays(nowRef, parseISO(existingSuggestion.read_at))
      : createdDiff;

    if (existingSuggestion.status === 'read' && readDiff < withinDays) {
      return { update: baseUpdate, nextRow };
    }

    nextRow.status = 'delivered';
    nextRow.delivered_at = nowIso;
    nextRow.read_at = null;

    return {
      update: {
        ...baseUpdate,
        status: 'delivered',
        delivered_at: nowIso,
        read_at: null
      },
      nextRow
    };
  };

  for (const trip of allTrips) {
    if (!trip.start_date) continue;

    const tripStart = parseISO(trip.start_date);
    const diffDays = differenceInCalendarDays(tripStart, now);
    const upcomingKey = keyFor(trip.id, 'upcoming_trip');

    if (diffDays >= 0) {
      const cooldownDays = diffDays > 30 ? 14 : 7;
      const payload = createUpcomingTripSuggestion(trip, diffDays, input.trigger);
      const existingSuggestion = existingMap.get(upcomingKey);

      if (existingSuggestion) {
        const result = prepareUpdate(existingSuggestion, payload, cooldownDays, now);
        updates.push(result.update);
        existingMap.set(upcomingKey, result.nextRow);
      } else {
        inserts.push({ tripId: trip.id, payload });
      }
    }

    if (trip.end_date) {
      const tripEnd = parseISO(trip.end_date);
      if (isWithinInterval(now, { start: tripStart, end: tripEnd })) {
        const todaysActivities = todaysActivitiesMap[trip.id] || [];
        if (todaysActivities.length === 0 || todaysActivities.every((activity) => !activity.start_time)) {
          const inTripKey = keyFor(trip.id, 'in_trip_activity');
          const payload = createInTripSuggestion(
            trip,
            pickPointOfInterest(trip.destination, input.context?.location?.name),
            input.trigger,
            input.context?.location
          );
          const existingSuggestion = existingMap.get(inTripKey);

          if (existingSuggestion) {
            const result = prepareUpdate(existingSuggestion, payload, 1, now);
            updates.push(result.update);
            existingMap.set(inTripKey, result.nextRow);
          } else {
            inserts.push({ tripId: trip.id, payload });
          }
        }
      }
    }
  }

  if (updates.length > 0) {
    const mergedUpdatesMap = new Map<string, Record<string, any>>();
    for (const update of updates) {
      const current = mergedUpdatesMap.get(update.id);
      mergedUpdatesMap.set(update.id, current ? { ...current, ...update } : update);
    }

    const mergedUpdates = Array.from(mergedUpdatesMap.values());
    for (const update of mergedUpdates) {
      const { error: updateError } = await supabase
        .from('ai_proactive_suggestions')
        .update(update)
        .eq('id', update.id)
        .select('*');

      if (updateError) {
        logger.error('AI Suggestions: failed to update existing suggestions', { error: updateError });
        throw updateError;
      }
    }
  }

  const newRecords: ProactiveSuggestion[] = [];
  if (inserts.length > 0) {
    const toInsert = inserts.map(({ tripId, payload }) => ({
      user_id: input.userId,
      trip_id: tripId,
      ...payload,
      delivered_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('ai_proactive_suggestions')
      .insert(toInsert)
      .select('*');

    if (error) {
      logger.error('AI Suggestions: failed to insert new suggestions', { error });
      throw error;
    }

    newRecords.push(...(data as ProactiveSuggestionRow[]).map(mapSuggestion));
  }

  // Always return the latest pending/delivered suggestions for the user
  const { data: currentSuggestions, error: fetchError } = await supabase
    .from('ai_proactive_suggestions')
    .select('*')
    .eq('user_id', input.userId)
    .in('status', ['pending', 'delivered'])
    .order('created_at', { ascending: false });

  if (fetchError) {
    logger.error('AI Suggestions: failed to list suggestions after trigger', { error: fetchError });
    throw fetchError;
  }

  // Ensure pending suggestions triggered earlier are considered delivered after fetch
  if (currentSuggestions?.length) {
    const pendingIds = (currentSuggestions as ProactiveSuggestionRow[])
      .filter((row) => row.status === 'pending')
      .map((row) => row.id);

    if (pendingIds.length > 0) {
      await supabase
        .from('ai_proactive_suggestions')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .in('id', pendingIds);
    }
  }

  const rows = (currentSuggestions ?? []) as ProactiveSuggestionRow[];
  return {
    suggestions: rows.map(mapSuggestion),
    newlyCreated: newRecords
  };
}

export async function listProactiveSuggestions(
  userId: string,
  options?: { status?: ProactiveSuggestionStatus[] },
  client?: SupabaseClient
): Promise<ProactiveSuggestion[]> {
  const supabase = client ?? createServiceSupabase();
  const query = supabase
    .from('ai_proactive_suggestions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.status?.length) {
    query.in('status', options.status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('AI Suggestions: failed to list suggestions', { error, userId });
    throw error;
  }

  return (data ?? []).map((row) => mapSuggestion(row as ProactiveSuggestionRow));
}

export async function updateProactiveSuggestionStatus(
  userId: string,
  suggestionId: string,
  status: ProactiveSuggestionStatus,
  client?: SupabaseClient
): Promise<ProactiveSuggestion> {
  const supabase = client ?? createServiceSupabase();
  const payload: Partial<ProactiveSuggestionRow> = {
    status,
    read_at: status === 'read' ? new Date().toISOString() : undefined
  };

  if (status === 'dismissed') {
    payload.read_at = new Date().toISOString();
  }

  if (status === 'delivered') {
    payload.read_at = null;
  }

  const { data, error } = await supabase
    .from('ai_proactive_suggestions')
    .update(payload)
    .eq('user_id', userId)
    .eq('id', suggestionId)
    .select('*')
    .single();

  if (error) {
    logger.error('AI Suggestions: failed to update suggestion status', { error, userId, suggestionId });
    throw error;
  }

  return mapSuggestion(data as ProactiveSuggestionRow);
}
