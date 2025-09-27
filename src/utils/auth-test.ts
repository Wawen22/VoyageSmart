import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

interface AuthTestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface AuthTestSuite {
  sessionPersistence: AuthTestResult;
  tokenRefresh: AuthTestResult;
  storageIntegrity: AuthTestResult;
  crossTabSync: AuthTestResult;
}

/**
 * Comprehensive authentication stability test suite
 * Use this to verify authentication persistence and token management
 */
export class AuthTester {
  private supabase = createClientSupabase();

  /**
   * Test session persistence across page refreshes
   */
  async testSessionPersistence(): Promise<AuthTestResult> {
    try {
      logger.info('Testing session persistence...');

      // Get current session
      const { data: { session: initialSession }, error: initialError } = await this.supabase.auth.getSession();
      
      if (initialError) {
        return {
          success: false,
          message: 'Failed to get initial session',
          details: initialError
        };
      }

      if (!initialSession) {
        return {
          success: false,
          message: 'No active session found for testing'
        };
      }

      // Simulate page refresh by creating a new client instance
      const newSupabase = createClientSupabase();
      const { data: { session: refreshedSession }, error: refreshError } = await newSupabase.auth.getSession();

      if (refreshError) {
        return {
          success: false,
          message: 'Failed to get session after simulated refresh',
          details: refreshError
        };
      }

      if (!refreshedSession) {
        return {
          success: false,
          message: 'Session not persisted after simulated refresh'
        };
      }

      // Verify session integrity
      const sessionMatches = initialSession.user.id === refreshedSession.user.id;

      return {
        success: sessionMatches,
        message: sessionMatches 
          ? 'Session persistence test passed' 
          : 'Session user ID mismatch after refresh',
        details: {
          initialUserId: initialSession.user.id,
          refreshedUserId: refreshedSession.user.id,
          initialExpiry: new Date(initialSession.expires_at! * 1000).toISOString(),
          refreshedExpiry: new Date(refreshedSession.expires_at! * 1000).toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception during session persistence test',
        details: error
      };
    }
  }

  /**
   * Test token refresh functionality
   */
  async testTokenRefresh(): Promise<AuthTestResult> {
    try {
      logger.info('Testing token refresh...');

      // Get current session
      const { data: { session: initialSession }, error: initialError } = await this.supabase.auth.getSession();
      
      if (initialError || !initialSession) {
        return {
          success: false,
          message: 'No active session for token refresh test',
          details: initialError
        };
      }

      const initialExpiry = initialSession.expires_at!;

      // Force token refresh
      const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession();

      if (refreshError) {
        return {
          success: false,
          message: 'Token refresh failed',
          details: refreshError
        };
      }

      if (!refreshedSession) {
        return {
          success: false,
          message: 'No session returned after refresh'
        };
      }

      const newExpiry = refreshedSession.expires_at!;
      const expiryExtended = newExpiry > initialExpiry;

      return {
        success: expiryExtended,
        message: expiryExtended 
          ? 'Token refresh test passed' 
          : 'Token expiry not extended after refresh',
        details: {
          userId: refreshedSession.user.id,
          initialExpiry: new Date(initialExpiry * 1000).toISOString(),
          newExpiry: new Date(newExpiry * 1000).toISOString(),
          extensionSeconds: newExpiry - initialExpiry
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception during token refresh test',
        details: error
      };
    }
  }

  /**
   * Test localStorage storage integrity
   */
  async testStorageIntegrity(): Promise<AuthTestResult> {
    try {
      logger.info('Testing storage integrity...');

      // Check for auth tokens in localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') && key.includes('auth')
      );

      if (authKeys.length === 0) {
        return {
          success: false,
          message: 'No auth tokens found in localStorage'
        };
      }

      // Verify token structure
      const authData = authKeys.map(key => {
        try {
          const value = localStorage.getItem(key);
          return {
            key,
            hasValue: !!value,
            isValidJson: value ? (() => {
              try {
                JSON.parse(value);
                return true;
              } catch {
                return false;
              }
            })() : false
          };
        } catch {
          return {
            key,
            hasValue: false,
            isValidJson: false
          };
        }
      });

      const validTokens = authData.filter(token => token.hasValue && token.isValidJson);

      return {
        success: validTokens.length > 0,
        message: validTokens.length > 0 
          ? 'Storage integrity test passed' 
          : 'No valid auth tokens in storage',
        details: {
          totalAuthKeys: authKeys.length,
          validTokens: validTokens.length,
          authData
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception during storage integrity test',
        details: error
      };
    }
  }

  /**
   * Test cross-tab session synchronization
   */
  async testCrossTabSync(): Promise<AuthTestResult> {
    try {
      logger.info('Testing cross-tab sync...');

      // This test simulates cross-tab behavior by triggering storage events
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        return {
          success: false,
          message: 'No active session for cross-tab test',
          details: error
        };
      }

      // Create a promise that resolves when auth state changes
      const authStateChangePromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000); // 5 second timeout
        
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event) => {
          if (event === 'TOKEN_REFRESHED') {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve(true);
          }
        });
      });

      // Trigger a storage event to simulate cross-tab activity
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sb-ijtfwzxwthunsujobvsk-auth-token',
        newValue: localStorage.getItem('sb-ijtfwzxwthunsujobvsk-auth-token'),
        storageArea: localStorage
      }));

      // Force a token refresh to trigger auth state change
      await this.supabase.auth.refreshSession();

      const syncDetected = await authStateChangePromise;

      return {
        success: syncDetected,
        message: syncDetected 
          ? 'Cross-tab sync test passed' 
          : 'Cross-tab sync not detected within timeout',
        details: {
          userId: session.user.id,
          syncDetected
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Exception during cross-tab sync test',
        details: error
      };
    }
  }

  /**
   * Run complete authentication test suite
   */
  async runTestSuite(): Promise<AuthTestSuite> {
    logger.info('Starting authentication stability test suite...');

    const results: AuthTestSuite = {
      sessionPersistence: await this.testSessionPersistence(),
      tokenRefresh: await this.testTokenRefresh(),
      storageIntegrity: await this.testStorageIntegrity(),
      crossTabSync: await this.testCrossTabSync()
    };

    const passedTests = Object.values(results).filter(result => result.success).length;
    const totalTests = Object.keys(results).length;

    logger.info('Authentication test suite completed', {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    });

    return results;
  }
}

/**
 * Utility function to run auth tests from browser console
 */
export async function runAuthTests(): Promise<AuthTestSuite> {
  const tester = new AuthTester();
  return await tester.runTestSuite();
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).runAuthTests = runAuthTests;
}
