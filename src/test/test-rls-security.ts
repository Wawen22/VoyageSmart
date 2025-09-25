/**
 * Test RLS security - verify unauthenticated users can't access data
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export async function testRLSSecurity() {
  // Create a client without authentication (anonymous)
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  try {
    logger.info('🔒 Testing RLS Security (Anonymous Access)');
    
    // 1. Try to access trips without authentication
    const { data: trips, error: tripsError } = await anonSupabase
      .from('trips')
      .select('*');
      
    logger.info('Anonymous trips query result:', {
      tripCount: trips?.length || 0,
      error: tripsError?.message,
      shouldBeEmpty: true
    });
    
    // 2. Test auth context for anonymous user
    const { data: authTest, error: authError } = await anonSupabase
      .rpc('test_current_auth');
      
    logger.info('Anonymous auth context:', {
      authTest: authTest?.[0],
      error: authError?.message
    });
    
    return {
      anonymousBlocked: (trips?.length || 0) === 0,
      tripCount: trips?.length || 0,
      authWorking: authTest?.[0]?.has_auth || false,
      errors: {
        trips: tripsError?.message,
        auth: authError?.message
      }
    };
    
  } catch (error) {
    logger.error('RLS security test failed:', { error });
    return {
      anonymousBlocked: false,
      tripCount: -1,
      authWorking: false,
      errors: { general: error instanceof Error ? error.message : String(error) }
    };
  }
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testRLSSecurity = testRLSSecurity;
}
