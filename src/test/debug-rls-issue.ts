/**
 * Debug script to investigate RLS authentication issues
 */

import { createClientSupabase } from '@/lib/supabase-client';

export async function debugRLSIssue() {
  console.log('🔍 Debugging RLS Authentication Issue...');
  
  const supabase = createClientSupabase();
  
  // Step 1: Check client authentication
  console.log('\n--- Step 1: Client Authentication ---');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ No authenticated user found');
    return { success: false, error: 'No authenticated user' };
  }
  
  console.log(`✅ Client user: ${user.email} (ID: ${user.id})`);
  
  // Step 2: Check session and token
  console.log('\n--- Step 2: Session and Token ---');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.log('❌ No valid session found');
    return { success: false, error: 'No valid session' };
  }
  
  console.log(`✅ Session valid, expires: ${new Date(session.expires_at! * 1000).toISOString()}`);
  console.log(`Token length: ${session.access_token.length}`);
  
  // Step 3: Test database auth.uid()
  console.log('\n--- Step 3: Database auth.uid() Test ---');
  try {
    const { data: dbUid, error: dbUidError } = await supabase
      .rpc('test_auth_uid');
      
    if (dbUidError) {
      console.log('❌ Error calling test_auth_uid():', dbUidError.message);
    } else {
      console.log(`Database auth.uid(): ${dbUid}`);
      console.log(`Client user.id: ${user.id}`);
      console.log(`Match: ${dbUid === user.id ? '✅' : '❌'}`);
      
      if (dbUid !== user.id) {
        console.log('🚨 ROOT CAUSE: auth.uid() mismatch explains RLS failure');
        
        if (dbUid === null) {
          console.log('💡 auth.uid() is NULL - JWT token not being passed correctly');
        } else {
          console.log('💡 auth.uid() returns different user - session confusion');
        }
      }
    }
  } catch (error) {
    console.log('❌ Error testing database auth:', error);
  }
  
  // Step 4: Test direct trips query with RLS disabled
  console.log('\n--- Step 4: Direct Trips Query (RLS Disabled) ---');
  try {
    const { data: allTrips, error: tripsError } = await supabase
      .from('trips')
      .select('id, name, owner_id')
      .limit(10);
      
    if (tripsError) {
      console.log('❌ Error querying trips:', tripsError.message);
    } else {
      console.log(`📊 Found ${allTrips?.length || 0} trips total`);
      
      if (allTrips) {
        const ownTrips = allTrips.filter(trip => trip.owner_id === user.id);
        const otherTrips = allTrips.filter(trip => trip.owner_id !== user.id);
        
        console.log(`  - Own trips: ${ownTrips.length}`);
        console.log(`  - Other users' trips: ${otherTrips.length}`);
        
        if (otherTrips.length > 0) {
          console.log('⚠️  RLS is disabled - can see other users\' trips');
          console.log('This is why client-side filtering is needed');
        }
      }
    }
  } catch (error) {
    console.log('❌ Error with trips query:', error);
  }
  
  // Step 5: Test participations
  console.log('\n--- Step 5: User Participations ---');
  try {
    const { data: participations, error: participationsError } = await supabase
      .from('trip_participants')
      .select('trip_id, invitation_status')
      .eq('user_id', user.id);
      
    if (participationsError) {
      console.log('❌ Error querying participations:', participationsError.message);
    } else {
      console.log(`📊 User has ${participations?.length || 0} participations`);
      
      if (participations && participations.length > 0) {
        const accepted = participations.filter(p => p.invitation_status === 'accepted');
        console.log(`  - Accepted: ${accepted.length}`);
        console.log(`  - Other statuses: ${participations.length - accepted.length}`);
      }
    }
  } catch (error) {
    console.log('❌ Error checking participations:', error);
  }
  
  // Step 6: Recommendations
  console.log('\n--- Step 6: Recommendations ---');
  
  const { data: dbUid } = await supabase.rpc('test_auth_uid').catch(() => ({ data: null }));
  
  if (dbUid === null) {
    console.log('🔧 SOLUTION: Fix JWT token passing to database');
    console.log('   - Check Supabase client configuration');
    console.log('   - Verify token is included in database requests');
    console.log('   - Consider using service role for admin operations');
  } else if (dbUid !== user.id) {
    console.log('🔧 SOLUTION: Fix session management');
    console.log('   - Clear all browser storage');
    console.log('   - Force fresh login');
    console.log('   - Check for session conflicts');
  } else {
    console.log('🔧 SOLUTION: RLS policies may be too restrictive');
    console.log('   - Review policy conditions');
    console.log('   - Test with simpler policies');
  }
  
  console.log('\n✅ RLS Debug completed');
  
  return {
    success: true,
    clientUserId: user.id,
    databaseUserId: dbUid,
    authMatch: dbUid === user.id,
    hasSession: !!session,
    tokenValid: !!session?.access_token
  };
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugRLSIssue = debugRLSIssue;
}
