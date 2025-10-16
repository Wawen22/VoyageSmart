import { z } from 'zod';

export const TRAVEL_STYLE_OPTIONS = ['balanced', 'relaxed', 'adventure', 'culture', 'luxury', 'budget'] as const;
export const INTEREST_OPTIONS = [
  'food',
  'history',
  'art',
  'culture',
  'nightlife',
  'outdoor',
  'shopping',
  'relaxation',
  'family',
  'romance',
  'wellness',
  'adventure',
  'technology',
  'architecture',
  'music'
] as const;
export const DIETARY_RESTRICTION_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'halal',
  'kosher',
  'lactose-free',
  'pescatarian',
  'nut-free'
] as const;
export const TRANSPORTATION_MODE_OPTIONS = [
  'walking',
  'public-transit',
  'ride-share',
  'car-rental',
  'bike',
  'private-driver'
] as const;
export const ACCOMMODATION_STYLE_OPTIONS = ['hotel', 'boutique', 'apartment', 'hostel', 'resort', 'camping'] as const;
export const BUDGET_LEVEL_OPTIONS = ['economy', 'moderate', 'premium', 'luxury'] as const;
export const MOBILITY_LEVEL_OPTIONS = ['low', 'average', 'high'] as const;
export const PREFERRED_CLIMATE_OPTIONS = ['temperate', 'warm', 'cold', 'any'] as const;
export const AI_PERSONALITY_OPTIONS = ['balanced', 'minimal', 'proactive', 'concierge'] as const;

export type TravelStyle = (typeof TRAVEL_STYLE_OPTIONS)[number];
export type InterestTag = (typeof INTEREST_OPTIONS)[number];
export type DietaryRestriction = (typeof DIETARY_RESTRICTION_OPTIONS)[number];
export type TransportationMode = (typeof TRANSPORTATION_MODE_OPTIONS)[number];
export type AccommodationStyle = (typeof ACCOMMODATION_STYLE_OPTIONS)[number];
export type BudgetLevel = (typeof BUDGET_LEVEL_OPTIONS)[number];
export type MobilityLevel = (typeof MOBILITY_LEVEL_OPTIONS)[number];
export type PreferredClimate = (typeof PREFERRED_CLIMATE_OPTIONS)[number];
export type AiPersonality = (typeof AI_PERSONALITY_OPTIONS)[number];

export const userTravelPreferencesSchema = z.object({
  travelStyle: z.enum(TRAVEL_STYLE_OPTIONS),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(12),
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTION_OPTIONS)).max(10),
  preferredClimate: z.enum(PREFERRED_CLIMATE_OPTIONS),
  accommodationStyle: z.enum(ACCOMMODATION_STYLE_OPTIONS),
  transportationModes: z.array(z.enum(TRANSPORTATION_MODE_OPTIONS)).max(10),
  budgetLevel: z.enum(BUDGET_LEVEL_OPTIONS),
  mobilityLevel: z.enum(MOBILITY_LEVEL_OPTIONS),
  aiPersonality: z.enum(AI_PERSONALITY_OPTIONS),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or fewer')
    .optional()
    .nullable()
});

export type UserTravelPreferencesInput = z.infer<typeof userTravelPreferencesSchema>;

export interface UserTravelPreferences extends UserTravelPreferencesInput {
  createdAt: string | null;
  updatedAt: string | null;
}

export const DEFAULT_USER_TRAVEL_PREFERENCES: UserTravelPreferences = {
  travelStyle: 'balanced',
  interests: [],
  dietaryRestrictions: [],
  preferredClimate: 'temperate',
  accommodationStyle: 'hotel',
  transportationModes: ['walking', 'public-transit'],
  budgetLevel: 'moderate',
  mobilityLevel: 'average',
  aiPersonality: 'balanced',
  notes: null,
  createdAt: null,
  updatedAt: null
};

export function normalizeUserTravelPreferences(input: Partial<UserTravelPreferences> | null | undefined): UserTravelPreferences {
  if (!input) {
    return { ...DEFAULT_USER_TRAVEL_PREFERENCES };
  }

  const validTravelStyle = TRAVEL_STYLE_OPTIONS.includes(input.travelStyle as TravelStyle)
    ? (input.travelStyle as TravelStyle)
    : DEFAULT_USER_TRAVEL_PREFERENCES.travelStyle;

  const validInterests = Array.isArray(input.interests)
    ? (input.interests.filter((tag): tag is InterestTag =>
        INTEREST_OPTIONS.includes(tag as InterestTag)
      ) as InterestTag[])
    : [];

  const validDietary = Array.isArray(input.dietaryRestrictions)
    ? (input.dietaryRestrictions.filter((tag): tag is DietaryRestriction =>
        DIETARY_RESTRICTION_OPTIONS.includes(tag as DietaryRestriction)
      ) as DietaryRestriction[])
    : [];

  const validClimate = PREFERRED_CLIMATE_OPTIONS.includes(input.preferredClimate as PreferredClimate)
    ? (input.preferredClimate as PreferredClimate)
    : DEFAULT_USER_TRAVEL_PREFERENCES.preferredClimate;

  const validAccommodation = ACCOMMODATION_STYLE_OPTIONS.includes(input.accommodationStyle as AccommodationStyle)
    ? (input.accommodationStyle as AccommodationStyle)
    : DEFAULT_USER_TRAVEL_PREFERENCES.accommodationStyle;

  const validTransportation = Array.isArray(input.transportationModes)
    ? (input.transportationModes.filter((mode): mode is TransportationMode =>
        TRANSPORTATION_MODE_OPTIONS.includes(mode as TransportationMode)
      ) as TransportationMode[])
    : DEFAULT_USER_TRAVEL_PREFERENCES.transportationModes;

  const validBudget = BUDGET_LEVEL_OPTIONS.includes(input.budgetLevel as BudgetLevel)
    ? (input.budgetLevel as BudgetLevel)
    : DEFAULT_USER_TRAVEL_PREFERENCES.budgetLevel;

  const validMobility = MOBILITY_LEVEL_OPTIONS.includes(input.mobilityLevel as MobilityLevel)
    ? (input.mobilityLevel as MobilityLevel)
    : DEFAULT_USER_TRAVEL_PREFERENCES.mobilityLevel;

  const validAiPersonality = AI_PERSONALITY_OPTIONS.includes(input.aiPersonality as AiPersonality)
    ? (input.aiPersonality as AiPersonality)
    : DEFAULT_USER_TRAVEL_PREFERENCES.aiPersonality;

  return {
    travelStyle: validTravelStyle,
    interests: validInterests,
    dietaryRestrictions: validDietary,
    preferredClimate: validClimate,
    accommodationStyle: validAccommodation,
    transportationModes: validTransportation.length > 0 ? validTransportation : DEFAULT_USER_TRAVEL_PREFERENCES.transportationModes,
    budgetLevel: validBudget,
    mobilityLevel: validMobility,
    aiPersonality: validAiPersonality,
    notes: typeof input.notes === 'string' && input.notes.trim().length > 0 ? input.notes : null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null
  };
}
