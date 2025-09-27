/**
 * Session Persistence Utilities
 * Handles robust session storage and retrieval across page refreshes
 */

import { Session } from '@supabase/supabase-js';
import { logger } from './logger';

const SESSION_STORAGE_KEY = 'sb-ijtfwzxwthunsujobvsk-auth-token';
const SESSION_BACKUP_KEY = 'voyage-smart-session-backup';

/**
 * Enhanced session storage with backup mechanism
 */
export class SessionPersistence {
  /**
   * Store session with backup
   */
  static storeSession(session: Session | null): void {
    try {
      if (typeof window === 'undefined') return;

      if (session) {
        // Store in primary location (Supabase default)
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        
        // Store backup copy with additional metadata
        const backupData = {
          session,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(backupData));
        
        logger.debug('Session stored successfully', {
          userId: session.user?.id?.slice(0, 8),
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });
      } else {
        // Clear both primary and backup
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_BACKUP_KEY);
        logger.debug('Session cleared from storage');
      }
    } catch (error) {
      logger.error('Failed to store session', { error: error.message });
    }
  }

  /**
   * Retrieve session with fallback to backup
   */
  static retrieveSession(): Session | null {
    try {
      if (typeof window === 'undefined') return null;

      // Try primary storage first
      const primarySession = this.getSessionFromStorage(SESSION_STORAGE_KEY);
      if (primarySession && this.isSessionValid(primarySession)) {
        return primarySession;
      }

      // Fallback to backup storage
      const backupData = localStorage.getItem(SESSION_BACKUP_KEY);
      if (backupData) {
        const parsed = JSON.parse(backupData);
        const backupSession = parsed.session;
        
        if (backupSession && this.isSessionValid(backupSession)) {
          logger.info('Restored session from backup', {
            userId: backupSession.user?.id?.slice(0, 8),
            backupAge: Date.now() - parsed.timestamp
          });
          
          // Restore to primary storage
          this.storeSession(backupSession);
          return backupSession;
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to retrieve session', { error: error.message });
      return null;
    }
  }

  /**
   * Get session from specific storage key
   */
  private static getSessionFromStorage(key: string): Session | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      logger.warn(`Failed to parse session from ${key}`, { error: error.message });
      return null;
    }
  }

  /**
   * Check if session is valid (not expired)
   */
  private static isSessionValid(session: Session): boolean {
    if (!session || !session.expires_at) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    // Consider session valid if it expires more than 1 minute from now
    return expiresAt > (now + 60);
  }

  /**
   * Clear all session data
   */
  static clearAllSessions(): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_BACKUP_KEY);
      
      // Also clear any other auth-related storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.debug('All session data cleared');
    } catch (error) {
      logger.error('Failed to clear session data', { error: error.message });
    }
  }

  /**
   * Get session expiry information
   */
  static getSessionInfo(): { 
    hasSession: boolean; 
    expiresAt: Date | null; 
    timeUntilExpiry: number | null;
    isExpired: boolean;
  } {
    const session = this.retrieveSession();
    
    if (!session || !session.expires_at) {
      return {
        hasSession: false,
        expiresAt: null,
        timeUntilExpiry: null,
        isExpired: true
      };
    }

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    return {
      hasSession: true,
      expiresAt,
      timeUntilExpiry,
      isExpired: timeUntilExpiry <= 0
    };
  }

  /**
   * Monitor session changes and persist automatically
   */
  static startSessionMonitoring(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY) {
        logger.debug('Session storage changed externally', {
          newValue: event.newValue ? 'present' : 'null',
          oldValue: event.oldValue ? 'present' : 'null'
        });
      }
    };

    const handleBeforeUnload = () => {
      // Ensure session is persisted before page unload
      const session = this.getSessionFromStorage(SESSION_STORAGE_KEY);
      if (session) {
        this.storeSession(session);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }
}

/**
 * Hook for session persistence monitoring
 */
export function useSessionPersistence() {
  if (typeof window !== 'undefined') {
    return SessionPersistence.startSessionMonitoring();
  }
  return () => {};
}
