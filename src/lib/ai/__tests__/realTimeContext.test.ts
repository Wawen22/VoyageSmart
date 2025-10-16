import { buildRealTimeContextSnapshot } from '@/lib/ai/realTimeContext';
import { DEFAULT_USER_TRAVEL_PREFERENCES } from '@/lib/preferences';

jest.mock('@/lib/services/userPreferencesService', () => ({
  fetchUserTravelPreferences: jest.fn()
}));

jest.mock('@/lib/supabase-client', () => ({
  createServiceSupabase: jest.fn()
}));

const fetchUserTravelPreferences = require('@/lib/services/userPreferencesService')
  .fetchUserTravelPreferences as jest.Mock;

describe('buildRealTimeContextSnapshot', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-02-16T09:00:00Z'));
    fetchUserTravelPreferences.mockResolvedValue(DEFAULT_USER_TRAVEL_PREFERENCES);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('derives next activity and transport information from trip context', async () => {
    const tripContext = {
      itinerary: [
        {
          day_date: '2025-02-16',
          activities: [
            {
              name: 'Colazione panoramica',
              start_time: '2025-02-16T09:30:00Z',
              location: 'Hotel Skyview'
            },
            {
              name: 'Tour Louvre',
              start_time: '2025-02-16T13:00:00Z'
            }
          ]
        },
        {
          day_date: '2025-02-17',
          activities: [
            {
              name: 'Passeggiata sulla Senna',
              start_time: '2025-02-17T10:00:00Z'
            }
          ]
        }
      ],
      transportation: [
        {
          type: 'Treno',
          provider: 'TGV',
          departure_time: '2025-02-17T08:00:00Z',
          departure_location: 'Paris Gare de Lyon',
          arrival_location: 'Lyon Part-Dieu'
        }
      ],
      expenses: [
        { amount: 120, status: 'pending' },
        { amount: 85, status: 'settled' },
        {
          amount: 40,
          status: 'settled',
          participants: [
            { is_paid: true },
            { is_paid: false }
          ]
        }
      ]
    };

    const snapshot = await buildRealTimeContextSnapshot({
      tripContext,
      currentSection: 'itinerary'
    });

    expect(snapshot.currentSection).toBe('itinerary');
    expect(snapshot.nextActivity?.name).toBe('Colazione panoramica');
    expect(snapshot.nextTransport?.type).toBe('Treno');
    expect(snapshot.outstandingExpenseCount).toBe(2);
    expect(snapshot.outstandingExpenseTotal).toBe(160);
  });

  it('includes user travel preferences when available', async () => {
    fetchUserTravelPreferences.mockResolvedValue({
      travelStyle: 'adventure',
      interests: ['outdoor', 'food'],
      dietaryRestrictions: [],
      preferredClimate: 'warm',
      accommodationStyle: 'boutique',
      transportationModes: ['walking'],
      budgetLevel: 'premium',
      mobilityLevel: 'high',
      aiPersonality: 'concierge',
      notes: 'Ama panorami'
    });

    const snapshot = await buildRealTimeContextSnapshot({
      tripContext: {},
      userId: 'user-123',
      currentSection: 'overview'
    });

    expect(snapshot.preferredTravelStyle).toBe('adventure');
    expect(snapshot.aiTone).toBe('concierge');
    expect(snapshot.interestTags).toEqual(expect.arrayContaining(['outdoor', 'food']));
  });
});

