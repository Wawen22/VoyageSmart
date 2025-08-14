import { useEffect } from 'react';
import { clearAuthCache, hasStaleAuthData } from '@/lib/cache-utils';

/**
 * Hook to handle authentication cleanup and cache management
 */
export function useAuthCleanup() {
  
  /**
   * Clear stale authentication data
   */
  const clearStaleAuth = async () => {
    try {
      if (hasStaleAuthData()) {
        console.log('useAuthCleanup: Clearing stale auth data...');
        await clearAuthCache();
        console.log('useAuthCleanup: Stale auth data cleared');
      }
    } catch (error) {
      console.error('useAuthCleanup: Error clearing stale auth data:', error);
    }
  };

  /**
   * Force clear all auth data (for logout scenarios)
   */
  const forceCleanAuth = async () => {
    try {
      console.log('useAuthCleanup: Force clearing all auth data...');
      await clearAuthCache();
      console.log('useAuthCleanup: All auth data cleared');
    } catch (error) {
      console.error('useAuthCleanup: Error force clearing auth data:', error);
    }
  };

  return {
    clearStaleAuth,
    forceCleanAuth,
    hasStaleAuthData
  };
}

/**
 * Hook to automatically clear stale auth data on component mount
 */
export function useAutoAuthCleanup(enabled: boolean = true) {
  const { clearStaleAuth } = useAuthCleanup();

  useEffect(() => {
    if (enabled) {
      clearStaleAuth();
    }
  }, [enabled, clearStaleAuth]);
}
