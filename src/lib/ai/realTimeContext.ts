import { DEFAULT_USER_TRAVEL_PREFERENCES, normalizeUserTravelPreferences } from '@/lib/preferences';
import { fetchUserTravelPreferences } from '@/lib/services/userPreferencesService';
import { createServiceSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

type TripContext = {
  trip?: any;
  itinerary?: any[];
  transportation?: any[];
  expenses?: any[];
};

export interface RealTimeContextSnapshot {
  currentSection?: string;
  nowIso: string;
  nextActivity?: {
    name: string;
    location?: string;
    startTimeIso?: string;
    dayDate?: string;
    notes?: string;
  };
  todaysActivities?: {
    dayDate: string;
    count: number;
  };
  nextTransport?: {
    type?: string;
    provider?: string;
    departureLocation?: string;
    arrivalLocation?: string;
    departureTimeIso?: string;
  };
  outstandingExpenseCount?: number;
  outstandingExpenseTotal?: number;
  preferredTravelStyle?: string;
  preferredClimate?: string;
  aiTone?: string;
  interestTags?: string[];
}

interface BuildContextArgs {
  tripContext: TripContext;
  userId?: string | null;
  currentSection?: string;
}

type ActivityItem = {
  name: string;
  location?: string;
  startTime?: Date | null;
  dayDate?: string;
  notes?: string;
};

function normaliseActivity(raw: any, fallbackDate?: string): ActivityItem | null {
  if (!raw) return null;

  const start =
    raw.start_time ||
    raw.startTime ||
    raw.start ||
    (raw.datetime && typeof raw.datetime === 'string' ? raw.datetime : undefined);

  let parsedStart: Date | null = null;
  if (start) {
    const dateValue = new Date(start);
    if (!Number.isNaN(dateValue.getTime())) {
      parsedStart = dateValue;
    }
  } else if (fallbackDate) {
    const dateValue = new Date(fallbackDate);
    if (!Number.isNaN(dateValue.getTime())) {
      parsedStart = dateValue;
    }
  }

  return {
    name: raw.name || raw.title || 'Attività',
    location: raw.location || raw.address || undefined,
    startTime: parsedStart,
    dayDate: fallbackDate,
    notes: raw.notes || undefined
  };
}

function deriveNextActivity(itinerary: any[] | undefined): {
  nextActivity?: RealTimeContextSnapshot['nextActivity'];
  todaysActivities?: RealTimeContextSnapshot['todaysActivities'];
} {
  if (!Array.isArray(itinerary) || itinerary.length === 0) {
    return {};
  }

  const today = new Date();
  const flattened: ActivityItem[] = [];

  for (const day of itinerary) {
    const dayDate = day?.day_date || day?.date || null;
    if (Array.isArray(day?.activities)) {
      for (const rawActivity of day.activities) {
        const normalised = normaliseActivity(rawActivity, dayDate || undefined);
        if (normalised) {
          flattened.push(normalised);
        }
      }
    }
  }

  if (flattened.length === 0) {
    return {};
  }

  const upcoming = flattened
    .filter((activity) => {
      if (!activity.startTime) return false;
      return activity.startTime.getTime() >= today.getTime();
    })
    .sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.getTime() - b.startTime.getTime();
    })[0];

  const todayDay = itinerary.find((day) => {
    const dayDate = day?.day_date || day?.date;
    if (!dayDate) return false;
    try {
      const dayDateObj = new Date(dayDate);
      return (
        dayDateObj.getFullYear() === today.getFullYear() &&
        dayDateObj.getMonth() === today.getMonth() &&
        dayDateObj.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  });

  let todaysActivities: RealTimeContextSnapshot['todaysActivities'];

  if (todayDay && Array.isArray(todayDay.activities)) {
    todaysActivities = {
      dayDate: todayDay.day_date || todayDay.date,
      count: todayDay.activities.length
    };
  }

  if (!upcoming) {
    return {
      todaysActivities
    };
  }

  return {
    nextActivity: {
      name: upcoming.name,
      location: upcoming.location,
      startTimeIso: upcoming.startTime?.toISOString(),
      dayDate: upcoming.dayDate,
      notes: upcoming.notes
    },
    todaysActivities
  };
}

function deriveNextTransport(transportation: any[] | undefined): RealTimeContextSnapshot['nextTransport'] {
  if (!Array.isArray(transportation) || transportation.length === 0) return undefined;

  const now = new Date();
  const sorted = transportation
    .map((t) => {
      const departure =
        t.departure_time ||
        t.departureTime ||
        t.departure_date ||
        t.departureDate ||
        t.start_time;
      const parsedDeparture = departure ? new Date(departure) : null;
      return {
        ...t,
        parsedDeparture: parsedDeparture && !Number.isNaN(parsedDeparture.getTime()) ? parsedDeparture : null
      };
    })
    .filter((t) => t.parsedDeparture && t.parsedDeparture.getTime() >= now.getTime())
    .sort((a, b) => {
      if (!a.parsedDeparture || !b.parsedDeparture) return 0;
      return a.parsedDeparture.getTime() - b.parsedDeparture.getTime();
    });

  const next = sorted[0];
  if (!next) return undefined;

  return {
    type: next.type,
    provider: next.provider,
    departureLocation: next.departure_location || next.departureLocation,
    arrivalLocation: next.arrival_location || next.arrivalLocation,
    departureTimeIso: next.parsedDeparture?.toISOString()
  };
}

function deriveOutstandingExpenses(expenses: any[] | undefined): {
  count: number;
  total: number;
} | undefined {
  if (!Array.isArray(expenses) || expenses.length === 0) return undefined;

  let count = 0;
  let total = 0;

  for (const expense of expenses) {
    const status = expense.status || '';
    const participants = Array.isArray(expense.participants) ? expense.participants : [];
    const hasUnpaidParticipants = participants.some((participant) => !participant.is_paid);

    if (status === 'pending' || hasUnpaidParticipants) {
      count += 1;
      const amount = Number(expense.amount);
      if (!Number.isNaN(amount)) {
        total += amount;
      }
    }
  }

  if (count === 0) return undefined;

  return {
    count,
    total
  };
}

async function loadUserPreferences(userId?: string | null) {
  if (!userId) return DEFAULT_USER_TRAVEL_PREFERENCES;

  try {
    const supabase = createServiceSupabase();
    const preferences = await fetchUserTravelPreferences(supabase, userId);
    return preferences;
  } catch (error) {
    logger.warn('Unable to load user travel preferences for AI context', {
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    return DEFAULT_USER_TRAVEL_PREFERENCES;
  }
}

export async function buildRealTimeContextSnapshot({
  tripContext,
  userId,
  currentSection
}: BuildContextArgs): Promise<RealTimeContextSnapshot> {
  const nowIso = new Date().toISOString();

  const { nextActivity, todaysActivities } = deriveNextActivity(tripContext.itinerary);
  const nextTransport = deriveNextTransport(tripContext.transportation);
  const outstandingExpenses = deriveOutstandingExpenses(tripContext.expenses);

  const userPreferences = await loadUserPreferences(userId);
  const normalisedPreferences = normalizeUserTravelPreferences(userPreferences);

  return {
    currentSection,
    nowIso,
    nextActivity,
    todaysActivities,
    nextTransport,
    outstandingExpenseCount: outstandingExpenses?.count,
    outstandingExpenseTotal: outstandingExpenses?.total,
    preferredTravelStyle: normalisedPreferences.travelStyle,
    preferredClimate: normalisedPreferences.preferredClimate,
    aiTone: normalisedPreferences.aiPersonality,
    interestTags: normalisedPreferences.interests
  };
}

