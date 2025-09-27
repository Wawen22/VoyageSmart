/**
 * Unified Session Manager
 * Single source of truth for all authentication session management
 * Eliminates race conditions and conflicting storage mechanisms
 */

import { Session, User } from '@supabase/supabase-js';
import { createClientSupabase } from './supabase-client';
import { logger } from './logger';

// Storage keys
const SUPABASE_SESSION_KEY = 'sb-ijtfwzxwthunsujobvsk-auth-token';
const BACKUP_SESSION_KEY = 'voyage-smart-session-backup';
const LAST_SYNC_KEY = 'voyage-smart-last-sync';

/**
 * Unified Session Manager - Single source of truth for authentication
 */
export class UnifiedSessionManager {
  private static instance: UnifiedSessionManager | null = null;
  private supabase = createClientSupabase();
  private sessionListeners: Set<(session: Session | null) => void> = new Set();
  private currentSession: Session | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedSessionManager {
    if (!UnifiedSessionManager.instance) {
      UnifiedSessionManager.instance = new UnifiedSessionManager();
    }
    return UnifiedSessionManager.instance;
  }

  /**
   * Initialize session manager - MUST be called before use
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._performInitialization();
    await this.initializationPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      logger.debug('UnifiedSessionManager: Starting initialization');

      // Step 1: Try to restore session from storage
      const restoredSession = this._restoreSessionFromStorage();
      
      if (restoredSession && this._isSessionValid(restoredSession)) {
        logger.debug('UnifiedSessionManager: Found valid session in storage', {
          userId: restoredSession.user?.id?.slice(0, 8),
          expiresAt: restoredSession.expires_at ? new Date(restoredSession.expires_at * 1000).toISOString() : null
        });

        // Sync restored session back to Supabase
        await this._syncSessionToSupabase(restoredSession);
        this.currentSession = restoredSession;
      } else {
        // Step 2: Get session from Supabase if no valid stored session
        const { data: { session }, error } = await this.supabase.auth.getSession();
        
        if (error) {
          logger.error('UnifiedSessionManager: Error getting session from Supabase', { error: error.message });
          this.currentSession = null;
        } else {
          this.currentSession = session;
          if (session) {
            this._storeSession(session);
          }
        }
      }

      // Step 3: Set up auth state change listener
      this.supabase.auth.onAuthStateChange((event, session) => {
        logger.debug('UnifiedSessionManager: Auth state change', { event, hasSession: !!session });
        
        this.currentSession = session;
        if (session) {
          this._storeSession(session);
        } else {
          this._clearStoredSession();
        }

        // Notify all listeners
        this._notifyListeners(session);
      });

      this.isInitialized = true;
      logger.debug('UnifiedSessionManager: Initialization complete');

      // Notify listeners of current session
      this._notifyListeners(this.currentSession);

    } catch (error) {
      logger.error('UnifiedSessionManager: Initialization failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.currentSession = null;
      this.isInitialized = true;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Add session change listener
   */
  addSessionListener(listener: (session: Session | null) => void): () => void {
    this.sessionListeners.add(listener);
    
    // Immediately call with current session if initialized
    if (this.isInitialized) {
      listener(this.currentSession);
    }

    // Return unsubscribe function
    return () => {
      this.sessionListeners.delete(listener);
    };
  }

  /**
   * Force refresh session
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        logger.error('UnifiedSessionManager: Session refresh failed', { error: error.message });
        return null;
      }

      if (session) {
        this.currentSession = session;
        this._storeSession(session);
        this._notifyListeners(session);
      }

      return session;
    } catch (error) {
      logger.error('UnifiedSessionManager: Exception during session refresh', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.supabase.auth.signOut();
      this.currentSession = null;
      this._clearStoredSession();
      this._notifyListeners(null);
    } catch (error) {
      logger.error('UnifiedSessionManager: Sign out failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Restore session from storage
   */
  private _restoreSessionFromStorage(): Session | null {
    try {
      if (typeof window === 'undefined') return null;

      // Try primary storage first
      const primarySession = localStorage.getItem(SUPABASE_SESSION_KEY);
      if (primarySession) {
        const parsed = JSON.parse(primarySession);
        if (this._isSessionValid(parsed)) {
          return parsed;
        }
      }

      // Try backup storage
      const backupData = localStorage.getItem(BACKUP_SESSION_KEY);
      if (backupData) {
        const { session } = JSON.parse(backupData);
        if (session && this._isSessionValid(session)) {
          logger.info('UnifiedSessionManager: Restored session from backup');
          return session;
        }
      }

      return null;
    } catch (error) {
      logger.error('UnifiedSessionManager: Failed to restore session from storage', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  }

  /**
   * Store session in both primary and backup storage
   */
  private _storeSession(session: Session): void {
    try {
      if (typeof window === 'undefined') return;

      // Store in primary location (Supabase default)
      localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
      
      // Store backup with metadata
      const backupData = {
        session,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };
      localStorage.setItem(BACKUP_SESSION_KEY, JSON.stringify(backupData));
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      logger.debug('UnifiedSessionManager: Session stored', {
        userId: session.user?.id?.slice(0, 8),
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
      });
    } catch (error) {
      logger.error('UnifiedSessionManager: Failed to store session', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Clear stored session
   */
  private _clearStoredSession(): void {
    try {
      if (typeof window === 'undefined') return;

      localStorage.removeItem(SUPABASE_SESSION_KEY);
      localStorage.removeItem(BACKUP_SESSION_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);

      logger.debug('UnifiedSessionManager: Session storage cleared');
    } catch (error) {
      logger.error('UnifiedSessionManager: Failed to clear session storage', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Sync session back to Supabase internal storage
   */
  private async _syncSessionToSupabase(session: Session): Promise<void> {
    try {
      // This ensures Supabase's internal state matches our restored session
      await this.supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      logger.debug('UnifiedSessionManager: Session synced to Supabase');
    } catch (error) {
      logger.warn('UnifiedSessionManager: Failed to sync session to Supabase', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Check if session is valid
   */
  private _isSessionValid(session: Session): boolean {
    if (!session || !session.expires_at) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    // Consider session valid if it expires more than 1 minute from now
    return expiresAt > (now + 60);
  }

  /**
   * Notify all listeners of session change
   */
  private _notifyListeners(session: Session | null): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        logger.error('UnifiedSessionManager: Error in session listener', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });
  }
}

/**
 * Hook for using unified session manager
 */
export function useUnifiedSession() {
  const sessionManager = UnifiedSessionManager.getInstance();
  
  return {
    sessionManager,
    getCurrentSession: () => sessionManager.getCurrentSession(),
    addSessionListener: (listener: (session: Session | null) => void) => 
      sessionManager.addSessionListener(listener),
    refreshSession: () => sessionManager.refreshSession(),
    signOut: () => sessionManager.signOut()
  };
}
