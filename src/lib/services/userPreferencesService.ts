import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_USER_TRAVEL_PREFERENCES,
  normalizeUserTravelPreferences,
  userTravelPreferencesSchema,
  type UserTravelPreferences,
  type UserTravelPreferencesInput
} from '@/lib/preferences';

type UserTravelPreferencesRow = {
  user_id: string;
  travel_style: string;
  interests: string[] | null;
  dietary_restrictions: string[] | null;
  preferred_climate: string | null;
  accommodation_style: string | null;
  transportation_modes: string[] | null;
  budget_level: string | null;
  mobility_level: string | null;
  ai_personality: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type InsertUserTravelPreferencesRow = Omit<UserTravelPreferencesRow, 'created_at' | 'updated_at'>;

const TABLE_NAME = 'user_travel_preferences';

function rowToPreferences(row: UserTravelPreferencesRow | null): UserTravelPreferences {
  if (!row) {
    return { ...DEFAULT_USER_TRAVEL_PREFERENCES };
  }

  return normalizeUserTravelPreferences({
    travelStyle: row.travel_style as UserTravelPreferences['travelStyle'],
    interests: row.interests ?? undefined,
    dietaryRestrictions: row.dietary_restrictions ?? undefined,
    preferredClimate: row.preferred_climate as UserTravelPreferences['preferredClimate'] | undefined,
    accommodationStyle: row.accommodation_style as UserTravelPreferences['accommodationStyle'] | undefined,
    transportationModes: row.transportation_modes ?? undefined,
    budgetLevel: row.budget_level as UserTravelPreferences['budgetLevel'] | undefined,
    mobilityLevel: row.mobility_level as UserTravelPreferences['mobilityLevel'] | undefined,
    aiPersonality: row.ai_personality as UserTravelPreferences['aiPersonality'] | undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function inputToRow(userId: string, input: UserTravelPreferencesInput): InsertUserTravelPreferencesRow {
  const trimmedNotes = input.notes?.trim() ?? null;

  return {
    user_id: userId,
    travel_style: input.travelStyle,
    interests: input.interests,
    dietary_restrictions: input.dietaryRestrictions,
    preferred_climate: input.preferredClimate,
    accommodation_style: input.accommodationStyle,
    transportation_modes: input.transportationModes,
    budget_level: input.budgetLevel,
    mobility_level: input.mobilityLevel,
    ai_personality: input.aiPersonality,
    notes: trimmedNotes && trimmedNotes.length > 0 ? trimmedNotes : null
  };
}

export async function fetchUserTravelPreferences(
  client: SupabaseClient,
  userId: string
): Promise<UserTravelPreferences> {
  const { data, error } = await client
    .from<UserTravelPreferencesRow>(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return rowToPreferences(data);
}

export async function upsertUserTravelPreferences(
  client: SupabaseClient,
  userId: string,
  payload: UserTravelPreferencesInput
): Promise<UserTravelPreferences> {
  const parsed = userTravelPreferencesSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
  }

  const row = inputToRow(userId, parsed.data);

  const { data, error } = await client
    .from<UserTravelPreferencesRow>(TABLE_NAME)
    .upsert(row, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return rowToPreferences(data);
}
