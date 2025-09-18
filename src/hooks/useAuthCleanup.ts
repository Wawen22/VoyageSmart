import { useEffect } from 'react';
import { clearAuthCache, hasStaleAuthData } from '@/lib/cache-utils';
import { logger } from '@/lib/logger';

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
        logger.debug('Clearing stale auth data');
        await clearAuthCache();
        logger.debug('Stale auth data cleared');
      }
    } catch (error) {
      logger.error('Error clearing stale auth data', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  /**
   * Force clear all auth data (for logout scenarios)
   */
  const forceCleanAuth = async () => {
    try {
      logger.debug('Force clearing all auth data');
      await clearAuthCache();
      logger.debug('All auth data cleared');
    } catch (error) {
      logger.error('Error force clearing auth data', { error: error instanceof Error ? error.message : String(error) });
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
