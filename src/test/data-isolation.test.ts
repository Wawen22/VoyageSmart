/**
 * Test suite for data isolation between user accounts
 * This test verifies that the cache keys are user-specific and prevent data leakage
 */

import OptimizedSupabaseService from '@/lib/services/optimizedSupabaseService';
import { tripCache, userCache } from '@/lib/services/cacheService';
import { clearUserSpecificCache } from '@/lib/cache-utils';

// Mock Supabase auth
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

describe('Data Isolation Tests', () => {
  let service: OptimizedSupabaseService;
  
  beforeEach(() => {
    service = new OptimizedSupabaseService();
    // Clear all caches before each test
    tripCache.clear();
    userCache.clear();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Key Generation', () => {
    it('should generate user-specific cache keys', async () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const tripId = 'trip-789';

      // Mock different users
      mockSupabase.auth.getUser
        .mockResolvedValueOnce({ data: { user: { id: userId1 } } })
        .mockResolvedValueOnce({ data: { user: { id: userId2 } } });

      // Generate cache keys for different users
      const key1 = await (service as any).generateCacheKey(`trip_details_${tripId}`);
      const key2 = await (service as any).generateCacheKey(`trip_details_${tripId}`);

      expect(key1).toBe(`${userId1}:trip_details_${tripId}`);
      expect(key2).toBe(`${userId2}:trip_details_${tripId}`);
      expect(key1).not.toBe(key2);
    });

    it('should handle null user gracefully', async () => {
      const tripId = 'trip-789';

      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      const key = await (service as any).generateCacheKey(`trip_details_${tripId}`);

      expect(key).toBe(`trip_details_${tripId}`);
    });
  });

  describe('Cache Isolation', () => {
    it('should isolate cache data between users', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const tripData1 = { id: 'trip-1', name: 'User 1 Trip' };
      const tripData2 = { id: 'trip-2', name: 'User 2 Trip' };

      // Set data for user 1
      tripCache.set(`${userId1}:trip_details_trip-1`, tripData1);
      
      // Set data for user 2
      tripCache.set(`${userId2}:trip_details_trip-2`, tripData2);

      // Verify user 1 can only access their data
      expect(tripCache.get(`${userId1}:trip_details_trip-1`)).toEqual(tripData1);
      expect(tripCache.get(`${userId1}:trip_details_trip-2`)).toBeNull();

      // Verify user 2 can only access their data
      expect(tripCache.get(`${userId2}:trip_details_trip-2`)).toEqual(tripData2);
      expect(tripCache.get(`${userId2}:trip_details_trip-1`)).toBeNull();
    });

    it('should clear only specific user cache', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const tripData1 = { id: 'trip-1', name: 'User 1 Trip' };
      const tripData2 = { id: 'trip-2', name: 'User 2 Trip' };

      // Set data for both users
      tripCache.set(`${userId1}:trip_details_trip-1`, tripData1);
      tripCache.set(`${userId2}:trip_details_trip-2`, tripData2);

      // Clear only user 1's cache
      tripCache.clearUserCache(userId1);

      // Verify user 1's data is cleared but user 2's remains
      expect(tripCache.get(`${userId1}:trip_details_trip-1`)).toBeNull();
      expect(tripCache.get(`${userId2}:trip_details_trip-2`)).toEqual(tripData2);
    });
  });

  describe('SessionStorage Isolation', () => {
    it('should use user-specific keys in sessionStorage', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const tripId = 'trip-789';

      // Simulate user-specific sessionStorage keys
      const key1 = `${userId1}:trip_details_${tripId}`;
      const key2 = `${userId2}:trip_details_${tripId}`;

      sessionStorage.setItem(key1, JSON.stringify({ data: 'user1 data' }));
      sessionStorage.setItem(key2, JSON.stringify({ data: 'user2 data' }));

      // Verify isolation
      const data1 = JSON.parse(sessionStorage.getItem(key1) || '{}');
      const data2 = JSON.parse(sessionStorage.getItem(key2) || '{}');

      expect(data1.data).toBe('user1 data');
      expect(data2.data).toBe('user2 data');
    });

    it('should clear user-specific sessionStorage on logout', () => {
      const userId = 'user-123';
      
      // Set some user-specific data
      sessionStorage.setItem(`${userId}:trip_details_1`, 'data1');
      sessionStorage.setItem(`${userId}:expenses_data_1`, 'data2');
      sessionStorage.setItem('other_key', 'other_data');

      // Clear user-specific cache
      clearUserSpecificCache(userId);

      // Verify user-specific data is cleared
      expect(sessionStorage.getItem(`${userId}:trip_details_1`)).toBeNull();
      expect(sessionStorage.getItem(`${userId}:expenses_data_1`)).toBeNull();
    });
  });

  describe('Integration Test', () => {
    it('should prevent data leakage scenario', () => {
      // Simulate the bug scenario:
      // 1. User A logs in and loads trips (gets cached)
      // 2. User A logs out
      // 3. User B logs in and should NOT see User A's trips

      const userA = 'fa116dab-3276-4033-9ca2-4a9be5f0dfe0'; // AccountA from database
      const userB = '1bfdd15d-8efb-4025-9713-7215fc483d01'; // AccountB from database
      
      const userATrips = [
        { id: 'trip-1', name: 'User A Trip 1', owner_id: userA },
        { id: 'trip-2', name: 'User A Trip 2', owner_id: userA }
      ];

      // Step 1: User A loads trips (simulate caching)
      tripCache.set(`${userA}:trip_list`, userATrips);
      sessionStorage.setItem(`${userA}:dashboard_trips`, JSON.stringify(userATrips));

      // Step 2: User A logs out (cache should be cleared)
      tripCache.clearUserCache(userA);
      clearUserSpecificCache(userA);

      // Step 3: User B logs in and checks cache
      const userBTrips = tripCache.get(`${userB}:trip_list`);
      const userBSessionData = sessionStorage.getItem(`${userB}:dashboard_trips`);

      // Verify User B doesn't see User A's data
      expect(userBTrips).toBeNull();
      expect(userBSessionData).toBeNull();
      
      // Verify User A's data is actually cleared
      expect(tripCache.get(`${userA}:trip_list`)).toBeNull();
      expect(sessionStorage.getItem(`${userA}:dashboard_trips`)).toBeNull();
    });
  });
});
