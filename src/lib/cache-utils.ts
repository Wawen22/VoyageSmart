/**
 * Utility functions for managing application cache and storage
 */

/**
 * Clear application-related data from localStorage while preserving authentication
 * @param preserveAuth - Whether to preserve authentication tokens (default: true)
 */
export function clearLocalStorage(preserveAuth: boolean = true): void {
  try {
    const localStorageKeys = Object.keys(localStorage);

    // Define keys to preserve for authentication
    const authKeysToPreserve = preserveAuth ? [
      'sb-ijtfwzxwthunsujobvsk-auth-token', // Supabase auth token
      'supabase.auth.token', // Legacy auth token format
    ] : [];

    const keysToRemove = localStorageKeys.filter(key => {
      // Preserve essential auth keys if requested
      if (preserveAuth && authKeysToPreserve.some(authKey => key.includes(authKey))) {
        return false;
      }

      // Remove application cache and non-essential data
      return (
        key.startsWith('chat_messages_') ||
        key.startsWith('weather-') ||
        key.startsWith('app-') ||
        key.includes('cache') ||
        key.includes('trip') ||
        // Remove user-specific cache keys (format: userId:key)
        /^[a-f0-9-]{36}:/.test(key) ||
        // Remove non-auth supabase keys
        (key.startsWith('supabase') && !authKeysToPreserve.some(authKey => key.includes(authKey)))
      );
    });

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    // Silently handle errors
  }
}

/**
 * Clear all sessionStorage data
 */
export function clearSessionStorage(): void {
  try {
    sessionStorage.clear();
    console.log('Cleared all sessionStorage data');
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
}

/**
 * Clear user-specific cache data when switching accounts
 * @param userId - Specific user ID to clear cache for
 * @param preserveAuth - Whether to preserve authentication tokens (default: true)
 */
export function clearUserSpecificCache(userId?: string, preserveAuth: boolean = true): void {
  try {
    // Clear sessionStorage (all user-specific data is stored here)
    sessionStorage.clear();

    // Clear user-specific localStorage items
    const localStorageKeys = Object.keys(localStorage);
    const userPattern = userId ? new RegExp(`^${userId}:`) : /^[a-f0-9-]{36}:/;

    // Define auth keys to preserve
    const authKeysToPreserve = preserveAuth ? [
      'sb-ijtfwzxwthunsujobvsk-auth-token',
      'supabase.auth.token',
    ] : [];

    const keysToRemove = localStorageKeys.filter(key => {
      // Preserve auth keys if requested
      if (preserveAuth && authKeysToPreserve.some(authKey => key.includes(authKey))) {
        return false;
      }

      return (
        userPattern.test(key) ||
        key.includes('trip') ||
        key.includes('cache')
      );
    });

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear Redux caches (these are in-memory caches in the Redux slices)
    clearReduxCaches(userId);

    console.log(`Cleared ${keysToRemove.length} user-specific cache entries`);
  } catch (error) {
    console.warn('Error clearing user-specific cache:', error);
  }
}

/**
 * Clear Redux in-memory caches for a specific user
 */
export function clearReduxCaches(userId?: string): void {
  try {
    // Import the cache objects from Redux slices
    // Note: These are imported dynamically to avoid circular dependencies
    if (typeof window !== 'undefined') {
      // Clear transportation cache
      const transportationModule = require('@/lib/features/transportationSlice');
      if (transportationModule.clearUserCache) {
        transportationModule.clearUserCache(userId);
      }

      // Clear accommodation cache
      const accommodationModule = require('@/lib/features/accommodationSlice');
      if (accommodationModule.clearUserCache) {
        accommodationModule.clearUserCache(userId);
      }

      // Clear itinerary cache
      const itineraryModule = require('@/lib/features/itinerarySlice');
      if (itineraryModule.clearUserCache) {
        itineraryModule.clearUserCache(userId);
      }
    }
  } catch (error) {
    console.warn('Error clearing Redux caches:', error);
  }
}

/**
 * Clear IndexedDB databases (used by Supabase)
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      const supabaseDatabases = databases.filter(db => 
        db.name && (
          db.name.includes('supabase') || 
          db.name.includes('auth') ||
          db.name.includes('session')
        )
      );

      for (const db of supabaseDatabases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`Deleted IndexedDB: ${db.name}`);
        }
      }

      console.log(`Cleared ${supabaseDatabases.length} IndexedDB databases`);
    }
  } catch (error) {
    console.warn('Could not clear IndexedDB:', error);
  }
}

/**
 * Clear all browser caches (localStorage, sessionStorage, IndexedDB)
 * @param preserveAuth - Whether to preserve authentication tokens (default: false for complete reset)
 */
export async function clearAllCache(preserveAuth: boolean = false): Promise<void> {
  console.log('Starting complete cache clear...', { preserveAuth });

  clearLocalStorage(preserveAuth);
  clearSessionStorage();

  // Only clear IndexedDB if not preserving auth
  if (!preserveAuth) {
    await clearIndexedDB();
  }

  console.log('Complete cache clear finished');
}

/**
 * Clear only authentication-related cache
 */
export async function clearAuthCache(): Promise<void> {
  try {
    // Clear auth-specific localStorage items
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session') ||
      key.includes('token')
    );

    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear auth-related IndexedDB
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      const authDatabases = databases.filter(db => 
        db.name && (
          db.name.includes('supabase') || 
          db.name.includes('auth')
        )
      );

      for (const db of authDatabases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    }

    console.log('Auth cache cleared successfully');
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
}

/**
 * Check if there are any stale auth tokens in storage
 */
export function hasStaleAuthData(): boolean {
  try {
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session')
    );

    return authKeys.length > 0 || sessionStorage.length > 0;
  } catch (error) {
    console.error('Error checking for stale auth data:', error);
    return false;
  }
}

/**
 * Force a hard page refresh to clear any remaining state
 */
export function forceRefresh(): void {
  window.location.reload();
}

/**
 * Navigate to a page with a hard refresh (clears all state)
 */
export function hardNavigate(url: string): void {
  window.location.href = url;
}
