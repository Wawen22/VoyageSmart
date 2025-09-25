/**
 * Test RLS functionality after re-enabling
 */

import { createClientSupabase } from '@/lib/supabase-client';
import { logger } from '@/lib/logger';

export async function testRLSEnabled() {
  const supabase = createClientSupabase();
  
  try {
    logger.info('🧪 Testing RLS Enabled Functionality');
    
    // 1. Test auth context
    const { data: authTest, error: authError } = await supabase
      .rpc('test_current_auth');
      
    logger.info('Auth context test:', { 
      authTest: authTest?.[0],
      error: authError?.message 
    });
    
    // 2. Test trips query with RLS
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
      
    logger.info('RLS trips query result:', {
      tripCount: trips?.length || 0,
      error: tripsError?.message,
      trips: trips?.map(t => ({
        id: t.id,
        name: t.name,
        owner_id: t.owner_id
      }))
    });
    
    // 3. Test current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    logger.info('Current user session:', {
      userId: user?.id,
      email: user?.email,
      error: userError?.message
    });
    
    return {
      authWorking: authTest?.[0]?.has_auth || false,
      tripCount: trips?.length || 0,
      userAuthenticated: !!user,
      errors: {
        auth: authError?.message,
        trips: tripsError?.message,
        user: userError?.message
      }
    };
    
  } catch (error) {
    logger.error('RLS test failed:', { error });
    return {
      authWorking: false,
      tripCount: 0,
      userAuthenticated: false,
      errors: { general: error instanceof Error ? error.message : String(error) }
    };
  }
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testRLSEnabled = testRLSEnabled;
}
