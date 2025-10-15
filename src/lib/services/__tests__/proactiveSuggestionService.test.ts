import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  triggerProactiveSuggestions,
  ProactiveSuggestionType
} from '../proactiveSuggestionService';

type OperationType =
  | 'select'
  | 'insert'
  | 'insert_select'
  | 'update'
  | 'update_select'
  | 'upsert'
  | 'upsert_select';

interface ResponseEntry {
  operation: OperationType;
  result:
    | { data: any; error: any }
    | ((context: { payload?: any; state?: Record<string, any>; client: MockSupabaseClient }) => {
        data: any;
        error: any;
      });
}

class MockQueryBuilder {
  private operation: OperationType = 'select';
  private payload: any;
  private state: Record<string, any> = {};

  constructor(private table: string, private client: MockSupabaseClient) {}

  select() {
    if (this.operation === 'insert') {
      this.operation = 'insert_select';
    } else if (this.operation === 'update') {
      this.operation = 'update_select';
    } else if (this.operation === 'upsert') {
      this.operation = 'upsert_select';
    } else {
      this.operation = 'select';
    }
    return this;
  }

  insert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: any) {
    this.operation = 'upsert';
    this.payload = payload;
    return this;
  }

  eq(column: string, value: any) {
    this.state[column] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.state[column] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.state[column] = value;
    return this;
  }

  in(column: string, value: any) {
    this.state[column] = value;
    return this;
  }

  order() {
    return this;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const result = this.client.resolve(this.table, this.operation, this.payload, this.state);
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  catch(onrejected?: (reason: any) => any) {
    return this.then(undefined, onrejected);
  }
}

class MockSupabaseClient {
  lastInserted: Record<string, any> = {};

  constructor(private responses: Record<string, ResponseEntry[]>) {}

  from(table: string) {
    return new MockQueryBuilder(table, this);
  }

  resolve(table: string, operation: OperationType, payload?: any, state?: Record<string, any>) {
    const queue = this.responses[table];
    if (!queue || queue.length === 0) {
      throw new Error(`No mocked response for table "${table}" and operation "${operation}"`);
    }

    const entry = queue.shift()!;
    if (entry.operation !== operation) {
      throw new Error(
        `Unexpected operation "${operation}" for table "${table}". Expected "${entry.operation}".`
      );
    }

    const context = {
      payload,
      state,
      client: this
    };

    const result =
      typeof entry.result === 'function' ? entry.result(context) : entry.result;

    if ((operation === 'insert_select' || operation === 'upsert_select') && result?.data) {
      this.lastInserted[table] = result.data;
    }

    return result;
  }
}

function buildTrip({
  id,
  destination,
  start,
  end
}: {
  id: string;
  destination: string;
  start: string;
  end: string;
}) {
  return {
    id,
    name: destination,
    destination,
    start_date: start,
    end_date: end,
    preferences: {}
  };
}

describe('proactiveSuggestionService', () => {
  const now = new Date('2025-02-15T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('creates an upcoming trip suggestion for trips starting within three days', async () => {
    const responses: Record<string, ResponseEntry[]> = {
      trips: [
        {
          operation: 'select',
          result: { data: [buildTrip({ id: 'trip-1', destination: 'Rome', start: '2025-02-17', end: '2025-02-21' })], error: null }
        }
      ],
      trip_participants: [
        { operation: 'select', result: { data: [], error: null } }
      ],
      ai_proactive_suggestions: [
        { operation: 'select', result: { data: [], error: null } },
        {
          operation: 'insert_select',
          result: ({ payload }) => ({
            data: payload.map((row: any, index: number) => ({
              id: `suggestion-${index + 1}`,
              created_at: row.created_at ?? new Date().toISOString(),
              read_at: row.read_at ?? null,
              ...row
            })),
            error: null
          })
        },
        {
          operation: 'select',
          result: ({ client }) => ({
            data: client.lastInserted.ai_proactive_suggestions,
            error: null
          })
        }
      ],
      activities: [
        { operation: 'select', result: { data: [], error: null } }
      ]
    };

    const mockClient = new MockSupabaseClient(responses);
    const result = await triggerProactiveSuggestions(
      {
        userId: 'user-1',
        trigger: 'app_open'
      },
      mockClient as unknown as SupabaseClient
    );

    expect(result.newlyCreated).toHaveLength(1);
    expect(result.suggestions).toHaveLength(1);

    const suggestion = result.newlyCreated[0];
    expect(suggestion.type).toBe('upcoming_trip');
    expect(suggestion.metadata.countdownDays).toBe(2);
    expect(suggestion.metadata.tripId).toBe('trip-1');
    expect(suggestion.message).toContain('Prepara tutto il necessario');
  });

  it('does not duplicate upcoming suggestions when one exists recently', async () => {
    const recentSuggestion = {
      id: 'suggestion-existing',
      user_id: 'user-1',
      trip_id: 'trip-1',
      suggestion_type: 'upcoming_trip' as ProactiveSuggestionType,
      trigger_event: 'app_open',
      title: 'Existing',
      message: 'Existing message',
      metadata: { tripId: 'trip-1', countdownDays: 1 },
      status: 'delivered' as const,
      created_at: new Date('2025-02-14T09:00:00.000Z').toISOString(),
      delivered_at: new Date('2025-02-14T09:00:00.000Z').toISOString(),
      read_at: null
    };

    const responses: Record<string, ResponseEntry[]> = {
      trips: [
        {
          operation: 'select',
          result: { data: [buildTrip({ id: 'trip-1', destination: 'Rome', start: '2025-02-17', end: '2025-02-21' })], error: null }
        }
      ],
      trip_participants: [
        { operation: 'select', result: { data: [], error: null } }
      ],
      ai_proactive_suggestions: [
        {
          operation: 'select',
          result: { data: [recentSuggestion], error: null }
        },
        {
          operation: 'update_select',
          result: { data: [recentSuggestion], error: null }
        },
        {
          operation: 'select',
          result: { data: [recentSuggestion], error: null }
        }
      ],
      activities: [
        { operation: 'select', result: { data: [], error: null } }
      ]
    };

    const mockClient = new MockSupabaseClient(responses);
    const result = await triggerProactiveSuggestions(
      {
        userId: 'user-1',
        trigger: 'app_open'
      },
      mockClient as unknown as SupabaseClient
    );

    expect(result.newlyCreated).toHaveLength(0);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].id).toBe('suggestion-existing');
  });

  it('creates an in-trip suggestion when there is free time and context location', async () => {
    const responses: Record<string, ResponseEntry[]> = {
      trips: [
        {
          operation: 'select',
          result: {
            data: [
              buildTrip({
                id: 'trip-2',
                destination: 'Paris',
                start: '2025-02-10',
                end: '2025-02-20'
              })
            ],
            error: null
          }
        }
      ],
      trip_participants: [
        { operation: 'select', result: { data: [], error: null } }
      ],
      ai_proactive_suggestions: [
        { operation: 'select', result: { data: [], error: null } },
        {
          operation: 'insert_select',
          result: ({ payload }) => ({
            data: payload.map((row: any, index: number) => ({
              id: `suggestion-${index + 1}`,
              created_at: row.created_at ?? new Date().toISOString(),
              read_at: row.read_at ?? null,
              ...row
            })),
            error: null
          })
        },
        {
          operation: 'select',
          result: ({ client }) => ({
            data: client.lastInserted.ai_proactive_suggestions,
            error: null
          })
        }
      ],
      activities: [
        { operation: 'select', result: { data: [], error: null } }
      ]
    };

    const mockClient = new MockSupabaseClient(responses);
    const result = await triggerProactiveSuggestions(
      {
        userId: 'user-2',
        trigger: 'location_ping',
        context: {
          location: {
            latitude: 48.8566,
            longitude: 2.3522,
            name: 'Quartiere Latino'
          }
        }
      },
      mockClient as unknown as SupabaseClient
    );

    expect(result.newlyCreated).toHaveLength(1);
    const suggestion = result.newlyCreated[0];
    expect(suggestion.type).toBe('in_trip_activity');
    expect(suggestion.metadata.location).toEqual({
      latitude: 48.8566,
      longitude: 2.3522,
      name: 'Quartiere Latino'
    });
    expect(suggestion.title).toContain('Quartiere Latino');
  });
});
