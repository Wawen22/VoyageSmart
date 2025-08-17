/**
 * Utility functions for managing application cache and storage
 */

/**
 * Clear all application-related data from localStorage
 */
export function clearLocalStorage(): void {
  try {
    const localStorageKeys = Object.keys(localStorage);
    const keysToRemove = localStorageKeys.filter(key => 
      key.startsWith('supabase') || 
      key.startsWith('chat_messages_') || 
      key.startsWith('weather-') ||
      key.startsWith('app-') ||
      key.includes('cache') ||
      key.includes('trip') ||
      key.includes('auth') ||
      key.includes('session')
    );

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
 */
export async function clearAllCache(): Promise<void> {
  console.log('Starting complete cache clear...');
  
  clearLocalStorage();
  clearSessionStorage();
  await clearIndexedDB();
  
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
