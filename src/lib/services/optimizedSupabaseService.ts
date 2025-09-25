'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { tripCache, userCache } from './cacheService';
import { requestDeduplication, createSupabaseRequestKey } from './requestDeduplication';

const supabase = createClientComponentClient();

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  deduplicate?: boolean;
}

class OptimizedSupabaseService {
  /**
   * Get current user ID for cache key generation
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.warn('Failed to get current user ID for cache:', error);
      return null;
    }
  }

  /**
   * Generate user-specific cache key
   */
  private async generateCacheKey(baseKey: string): Promise<string> {
    const userId = await this.getCurrentUserId();
    return userId ? `${userId}:${baseKey}` : baseKey;
  }

  /**
   * Optimized trip data fetching with caching and deduplication
   */
  async getTripDetails(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_details_${tripId}`);
    const requestKey = createSupabaseRequestKey('trips', { id: tripId });

    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      return data;
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Optimized participants fetching
   */
  async getTripParticipants(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_participants_${tripId}`);
    const requestKey = createSupabaseRequestKey(
      'trip_participants',
      { trip_id: tripId },
      'id,user_id,role,invitation_status,users(full_name,email,avatar_url)',
      { column: 'created_at', ascending: true }
    );

    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          id,
          user_id,
          role,
          invitation_status,
          created_at,
          users (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Optimized accommodations fetching
   */
  async getTripAccommodations(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_accommodations_${tripId}`);
    const requestKey = createSupabaseRequestKey(
      'accommodations',
      { trip_id: tripId },
      '*',
      { column: 'check_in_date', ascending: true }
    );

    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('trip_id', tripId)
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      return data;
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Optimized transportation fetching
   */
  async getTripTransportation(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_transportation_${tripId}`);
    const requestKey = createSupabaseRequestKey(
      'transportation',
      { trip_id: tripId },
      '*',
      { column: 'departure_time', ascending: true }
    );

    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('transportation')
        .select('*')
        .eq('trip_id', tripId)
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return data;
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Optimized expenses fetching
   */
  async getTripExpenses(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_expenses_${tripId}`);
    const requestKey = createSupabaseRequestKey(
      'expenses',
      { trip_id: tripId },
      '*,users(full_name)',
      { column: 'date', ascending: false }
    );

    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          users (
            full_name
          )
        `)
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Optimized itinerary fetching
   */
  async getTripItinerary(tripId: string, options: QueryOptions = {}) {
    const { cache = true, cacheTTL = 5 * 60 * 1000, deduplicate = true } = options;
    const cacheKey = await this.generateCacheKey(`trip_itinerary_${tripId}`);
    const requestKey = createSupabaseRequestKey('itinerary_days_activities', { trip_id: tripId });

    const fetchFn = async () => {
      const [daysResponse, activitiesResponse] = await Promise.all([
        supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', tripId)
          .order('day_date', { ascending: true }),
        supabase
          .from('activities')
          .select('*')
          .eq('trip_id', tripId)
          .order('start_time', { ascending: true })
      ]);

      if (daysResponse.error) throw daysResponse.error;
      if (activitiesResponse.error) throw activitiesResponse.error;

      return {
        days: daysResponse.data || [],
        activities: activitiesResponse.data || []
      };
    };

    if (cache) {
      const cached = tripCache.get(cacheKey);
      if (cached) return cached;
    }

    const result = deduplicate
      ? await requestDeduplication.deduplicate(requestKey, fetchFn)
      : await fetchFn();

    if (cache) {
      tripCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  }

  /**
   * Invalidate all cache for a specific trip
   */
  invalidateTripCache(tripId: string) {
    tripCache.invalidatePattern(`trip_${tripId}`);
    tripCache.invalidatePattern(`${tripId}`);
  }

  /**
   * Batch fetch multiple trip data types
   */
  async getTripDataBatch(tripId: string, dataTypes: string[], options: QueryOptions = {}) {
    const promises: Promise<any>[] = [];
    const results: Record<string, any> = {};

    if (dataTypes.includes('details')) {
      promises.push(
        this.getTripDetails(tripId, options).then(data => {
          results.details = data;
        })
      );
    }

    if (dataTypes.includes('participants')) {
      promises.push(
        this.getTripParticipants(tripId, options).then(data => {
          results.participants = data;
        })
      );
    }

    if (dataTypes.includes('accommodations')) {
      promises.push(
        this.getTripAccommodations(tripId, options).then(data => {
          results.accommodations = data;
        })
      );
    }

    if (dataTypes.includes('transportation')) {
      promises.push(
        this.getTripTransportation(tripId, options).then(data => {
          results.transportation = data;
        })
      );
    }

    if (dataTypes.includes('expenses')) {
      promises.push(
        this.getTripExpenses(tripId, options).then(data => {
          results.expenses = data;
        })
      );
    }

    if (dataTypes.includes('itinerary')) {
      promises.push(
        this.getTripItinerary(tripId, options).then(data => {
          results.itinerary = data;
        })
      );
    }

    await Promise.all(promises);
    return results;
  }
}

export const optimizedSupabaseService = new OptimizedSupabaseService();
export default OptimizedSupabaseService;
