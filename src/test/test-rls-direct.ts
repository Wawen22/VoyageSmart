/**
 * Direct RLS testing script
 * This script tests RLS policies by simulating different user contexts
 */

import { createClientSupabase } from '@/lib/supabase-client';

export async function testRLSPoliciesDirectly() {
  console.log('🧪 Testing RLS Policies Directly...');
  
  const supabase = createClientSupabase();
  
  // Test 1: Check current authentication
  console.log('\n--- Test 1: Current Authentication ---');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ No authenticated user found');
    return { success: false, error: 'No authenticated user' };
  }
  
  console.log(`✅ Current user: ${user.email} (ID: ${user.id})`);
  
  // Test 2: Test auth.uid() function
  console.log('\n--- Test 2: Database auth.uid() Test ---');
  try {
    const { data: authUid, error: authUidError } = await supabase
      .rpc('get_current_user_id');
      
    if (authUidError) {
      console.log('❌ Error getting auth.uid():', authUidError.message);
    } else {
      console.log(`📊 Database auth.uid(): ${authUid}`);
      console.log(`📊 Client user.id: ${user.id}`);
      
      if (authUid === user.id) {
        console.log('✅ Auth context matches between client and database');
      } else {
        console.log('❌ AUTH MISMATCH: Client and database user IDs differ');
        return { success: false, error: 'Auth context mismatch' };
      }
    }
  } catch (error) {
    console.log('❌ Error testing auth.uid():', error);
  }
  
  // Test 3: Test RLS policies with test function
  console.log('\n--- Test 3: RLS Policy Test ---');
  try {
    const { data: rlsTest, error: rlsTestError } = await supabase
      .rpc('test_trip_access');
      
    if (rlsTestError) {
      console.log('❌ Error testing RLS policies:', rlsTestError.message);
    } else {
      console.log(`📊 RLS test returned ${rlsTest?.length || 0} trips`);
      
      if (rlsTest && rlsTest.length > 0) {
        console.log('\nTrip Access Analysis:');
        rlsTest.forEach((trip, index) => {
          console.log(`  ${index + 1}. "${trip.trip_name}" (ID: ${trip.trip_id})`);
          console.log(`     Owner: ${trip.owner_id}`);
          console.log(`     Is Owner: ${trip.is_owner}`);
          console.log(`     Is Participant: ${trip.is_participant}`);
          console.log(`     Can Access: ${trip.can_access}`);
          
          if (!trip.can_access) {
            console.log('     ❌ VIOLATION: User should not see this trip!');
          } else if (trip.is_owner) {
            console.log('     ✅ Access granted: User is owner');
          } else if (trip.is_participant) {
            console.log('     ✅ Access granted: User is participant');
          } else {
            console.log('     ❓ Access granted but reason unclear');
          }
          console.log('');
        });
      } else {
        console.log('✅ No trips returned (expected for user with no trips/participations)');
      }
    }
  } catch (error) {
    console.log('❌ Error testing RLS policies:', error);
  }
  
  // Test 4: Direct trips query (should be filtered by RLS)
  console.log('\n--- Test 4: Direct Trips Query ---');
  try {
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, name, owner_id, created_at')
      .order('created_at', { ascending: false });
      
    if (tripsError) {
      console.log('❌ Error querying trips:', tripsError.message);
    } else {
      console.log(`📊 Direct query returned ${trips?.length || 0} trips`);
      
      if (trips && trips.length > 0) {
        const ownTrips = trips.filter(trip => trip.owner_id === user.id);
        const otherTrips = trips.filter(trip => trip.owner_id !== user.id);
        
        console.log(`  - Own trips: ${ownTrips.length}`);
        console.log(`  - Other users' trips: ${otherTrips.length}`);
        
        if (otherTrips.length > 0) {
          console.log('❌ RLS POLICY VIOLATION: Can see other users\' trips');
          otherTrips.forEach(trip => {
            console.log(`    - "${trip.name}" (Owner: ${trip.owner_id})`);
          });
          return { success: false, error: 'RLS policy violation detected' };
        } else {
          console.log('✅ RLS policies working: Only seeing authorized trips');
        }
      } else {
        console.log('✅ No trips returned (expected for user with no access)');
      }
    }
  } catch (error) {
    console.log('❌ Error with direct trips query:', error);
  }
  
  // Test 5: Check trip_participants table
  console.log('\n--- Test 5: Trip Participants Check ---');
  try {
    const { data: participations, error: participationsError } = await supabase
      .from('trip_participants')
      .select('trip_id, invitation_status, created_at')
      .eq('user_id', user.id);
      
    if (participationsError) {
      console.log('❌ Error querying participations:', participationsError.message);
    } else {
      console.log(`📊 User has ${participations?.length || 0} participations`);
      
      if (participations && participations.length > 0) {
        const acceptedParticipations = participations.filter(p => p.invitation_status === 'accepted');
        console.log(`  - Accepted: ${acceptedParticipations.length}`);
        console.log(`  - Other statuses: ${participations.length - acceptedParticipations.length}`);
      }
    }
  } catch (error) {
    console.log('❌ Error checking participations:', error);
  }
  
  console.log('\n--- Summary ---');
  console.log('✅ RLS Policy test completed');
  
  return { success: true };
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testRLSPoliciesDirectly = testRLSPoliciesDirectly;
}
