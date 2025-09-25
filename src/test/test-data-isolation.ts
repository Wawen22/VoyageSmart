/**
 * Test script to verify data isolation between user accounts
 */

import { createClientSupabase } from '@/lib/supabase-client';

export async function testDataIsolation() {
  const supabase = createClientSupabase();
  
  console.log('🧪 Testing Data Isolation...');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.log('❌ No authenticated user found');
    return { success: false, error: 'No authenticated user' };
  }
  
  console.log(`✅ Current user: ${user.email} (ID: ${user.id})`);
  
  // Test 1: Check trips query
  console.log('\n--- Test 1: Trips Query ---');
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false });
    
  if (tripsError) {
    console.log('❌ Error fetching trips:', tripsError.message);
    return { success: false, error: tripsError.message };
  }
  
  console.log(`📊 Found ${trips?.length || 0} trips`);
  
  if (trips && trips.length > 0) {
    const ownTrips = trips.filter(trip => trip.owner_id === user.id);
    const otherTrips = trips.filter(trip => trip.owner_id !== user.id);
    
    console.log(`  - Own trips: ${ownTrips.length}`);
    console.log(`  - Other users' trips: ${otherTrips.length}`);
    
    if (otherTrips.length > 0) {
      console.log('❌ DATA LEAKAGE DETECTED - Can see other users\' trips:');
      otherTrips.forEach(trip => {
        console.log(`    - "${trip.name}" (Owner: ${trip.owner_id})`);
      });
    } else {
      console.log('✅ No data leakage - only seeing own trips');
    }
  } else {
    console.log('✅ No trips found (expected for new user)');
  }
  
  // Test 2: Check trip participations
  console.log('\n--- Test 2: Trip Participations ---');
  const { data: participations, error: participationsError } = await supabase
    .from('trip_participants')
    .select('trip_id, invitation_status, created_at')
    .eq('user_id', user.id);
    
  if (participationsError) {
    console.log('❌ Error fetching participations:', participationsError.message);
  } else {
    console.log(`📊 Found ${participations?.length || 0} participations`);
    
    if (participations && participations.length > 0) {
      const acceptedParticipations = participations.filter(p => p.invitation_status === 'accepted');
      console.log(`  - Accepted participations: ${acceptedParticipations.length}`);
      
      acceptedParticipations.forEach(p => {
        console.log(`    - Trip ID: ${p.trip_id} (Status: ${p.invitation_status})`);
      });
    } else {
      console.log('✅ No participations found (expected for new user)');
    }
  }
  
  // Test 3: Test RLS policy directly
  console.log('\n--- Test 3: RLS Policy Test ---');
  try {
    // Try to query trips with explicit owner filter
    const { data: explicitOwnTrips, error: explicitError } = await supabase
      .from('trips')
      .select('id, name, owner_id')
      .eq('owner_id', user.id);
      
    if (explicitError) {
      console.log('❌ Error with explicit owner query:', explicitError.message);
    } else {
      console.log(`📊 Explicit owner query returned ${explicitOwnTrips?.length || 0} trips`);
    }
    
    // Try to query trips NOT owned by current user (should return empty due to RLS)
    const { data: notOwnTrips, error: notOwnError } = await supabase
      .from('trips')
      .select('id, name, owner_id')
      .neq('owner_id', user.id);
      
    if (notOwnError) {
      console.log('❌ Error with not-owner query:', notOwnError.message);
    } else {
      console.log(`📊 Not-owner query returned ${notOwnTrips?.length || 0} trips`);
      
      if (notOwnTrips && notOwnTrips.length > 0) {
        console.log('❌ RLS POLICY VIOLATION - Can see trips not owned by current user');
        notOwnTrips.forEach(trip => {
          console.log(`    - "${trip.name}" (Owner: ${trip.owner_id})`);
        });
      } else {
        console.log('✅ RLS policies working correctly');
      }
    }
  } catch (error) {
    console.log('❌ Error testing RLS policies:', error);
  }
  
  // Summary
  console.log('\n--- Summary ---');
  const totalTripsVisible = trips?.length || 0;
  const ownTripsCount = trips?.filter(trip => trip.owner_id === user.id).length || 0;
  const otherTripsCount = totalTripsVisible - ownTripsCount;
  
  const isDataIsolated = otherTripsCount === 0;
  
  console.log(`Total trips visible: ${totalTripsVisible}`);
  console.log(`Own trips: ${ownTripsCount}`);
  console.log(`Other users' trips: ${otherTripsCount}`);
  console.log(`Data isolation: ${isDataIsolated ? '✅ WORKING' : '❌ BROKEN'}`);
  
  return {
    success: isDataIsolated,
    totalTrips: totalTripsVisible,
    ownTrips: ownTripsCount,
    otherTrips: otherTripsCount,
    participations: participations?.length || 0
  };
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testDataIsolation = testDataIsolation;
}
