/**
 * Debug script to test RLS policies and authentication context
 */

import { createClientSupabase } from '@/lib/supabase-client';

export async function debugRLSPolicies() {
  const supabase = createClientSupabase();
  
  console.log('=== RLS DEBUG TEST ===');
  
  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Current user:', user?.id, user?.email);
  console.log('User error:', userError);
  
  if (!user) {
    console.log('❌ No authenticated user found');
    return;
  }
  
  // Test direct database query to see what trips are returned
  console.log('\n--- Testing trips query ---');
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, name, owner_id, created_at')
    .order('created_at', { ascending: false });
    
  console.log('Trips returned:', trips?.length || 0);
  console.log('Trips error:', tripsError);
  
  if (trips && trips.length > 0) {
    console.log('Trip details:');
    trips.forEach((trip, index) => {
      console.log(`  ${index + 1}. ${trip.name} (ID: ${trip.id})`);
      console.log(`     Owner: ${trip.owner_id}`);
      console.log(`     Is mine: ${trip.owner_id === user.id ? '✅' : '❌'}`);
    });
  }
  
  // Test if we can see trips we shouldn't
  console.log('\n--- Testing RLS enforcement ---');
  const { data: allTrips, error: allTripsError } = await supabase
    .from('trips')
    .select('id, name, owner_id')
    .neq('owner_id', user.id); // Try to get trips NOT owned by current user
    
  console.log('Trips NOT owned by me:', allTrips?.length || 0);
  console.log('Should be 0 if RLS is working correctly');
  
  if (allTrips && allTrips.length > 0) {
    console.log('❌ RLS POLICY VIOLATION - Can see other users trips:');
    allTrips.forEach(trip => {
      console.log(`  - ${trip.name} (Owner: ${trip.owner_id})`);
    });
  } else {
    console.log('✅ RLS policies working correctly');
  }
  
  // Test trip participants
  console.log('\n--- Testing trip participants ---');
  const { data: participants, error: participantsError } = await supabase
    .from('trip_participants')
    .select('trip_id, user_id, invitation_status')
    .eq('user_id', user.id)
    .eq('invitation_status', 'accepted');
    
  console.log('My accepted trip participations:', participants?.length || 0);
  console.log('Participants error:', participantsError);
  
  return {
    user,
    trips,
    allTrips,
    participants
  };
}

// Function to run from browser console
(window as any).debugRLS = debugRLSPolicies;
