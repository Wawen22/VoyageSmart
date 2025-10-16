import { fetchUserTravelPreferences, upsertUserTravelPreferences } from '@/lib/services/userPreferencesService';
import {
  DEFAULT_USER_TRAVEL_PREFERENCES,
  INTEREST_OPTIONS,
  userTravelPreferencesSchema
} from '@/lib/preferences';

describe('userPreferencesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns default preferences when no record exists', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockClient = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle
      })
    } as any;

    const result = await fetchUserTravelPreferences(mockClient, 'user-123');

    expect(mockClient.from).toHaveBeenCalledWith('user_travel_preferences');
    expect(maybeSingle).toHaveBeenCalled();
    expect(result).toEqual(DEFAULT_USER_TRAVEL_PREFERENCES);
  });

  it('upserts preferences with sanitised payloads', async () => {
    const upsert = jest.fn().mockReturnThis();
    const select = jest.fn().mockReturnThis();
    const single = jest.fn().mockResolvedValue({
      data: {
        user_id: 'user-123',
        travel_style: 'adventure',
        interests: ['food', 'history'],
        dietary_restrictions: ['vegan'],
        preferred_climate: 'warm',
        accommodation_style: 'boutique',
        transportation_modes: ['walking'],
        budget_level: 'premium',
        mobility_level: 'high',
        ai_personality: 'proactive',
        notes: 'Needs sunrise hikes',
        created_at: '2025-02-16T00:00:00Z',
        updated_at: '2025-02-16T00:00:00Z'
      },
      error: null
    });

    const mockClient = {
      from: jest
        .fn()
        .mockReturnValueOnce({
          upsert,
          select,
          single
        })
    } as any;

    const payload = {
      ...DEFAULT_USER_TRAVEL_PREFERENCES,
      travelStyle: 'adventure',
      interests: INTEREST_OPTIONS.slice(0, 2),
      dietaryRestrictions: ['vegan'],
      preferredClimate: 'warm',
      accommodationStyle: 'boutique',
      transportationModes: ['walking'],
      budgetLevel: 'premium',
      mobilityLevel: 'high',
      aiPersonality: 'proactive',
      notes: ' Needs sunrise hikes   '
    };

    const result = await upsertUserTravelPreferences(mockClient, 'user-123', payload);

    expect(mockClient.from).toHaveBeenCalledWith('user_travel_preferences');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        travel_style: 'adventure',
        interests: ['food', 'history'],
        dietary_restrictions: ['vegan'],
        preferred_climate: 'warm',
        accommodation_style: 'boutique',
        transportation_modes: ['walking'],
        budget_level: 'premium',
        mobility_level: 'high',
        ai_personality: 'proactive',
        notes: 'Needs sunrise hikes'
      }),
      { onConflict: 'user_id' }
    );
    expect(select).toHaveBeenCalled();
    expect(single).toHaveBeenCalled();
    expect(result.travelStyle).toBe('adventure');
    expect(result.notes).toBe('Needs sunrise hikes');
  });

  it('validates payloads before upserting', async () => {
    const mockClient = {
      from: jest.fn()
    } as any;

    await expect(
      upsertUserTravelPreferences(mockClient, 'user-123', {
        ...DEFAULT_USER_TRAVEL_PREFERENCES,
        travelStyle: 'unknown-style' as any
      })
    ).rejects.toThrow();

    expect(mockClient.from).not.toHaveBeenCalled();
    expect(() =>
      userTravelPreferencesSchema.parse({
        ...DEFAULT_USER_TRAVEL_PREFERENCES,
        travelStyle: 'unknown-style'
      } as any)
    ).toThrow();
  });
});

