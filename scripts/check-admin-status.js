// Script to check if a user has admin role
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function checkAdminStatus(userId) {
  try {
    console.log(`Checking admin status for user ID: ${userId}`);
    
    // Query the users table to get the user's preferences
    const { data, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
    
    if (!data) {
      console.log('User not found');
      return false;
    }
    
    console.log('User preferences:', data.preferences);
    
    // Check if the user has admin role
    const isAdmin = data.preferences?.role === 'admin';
    console.log(`User is admin: ${isAdmin}`);
    
    return isAdmin;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function setAdminRole(userId) {
  try {
    console.log(`Setting admin role for user ID: ${userId}`);
    
    // Update the user's preferences to include admin role
    const { data, error } = await supabase
      .from('users')
      .update({
        preferences: {
          role: 'admin'
        }
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user data:', error);
      return false;
    }
    
    console.log('User updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as a command line argument');
  process.exit(1);
}

// Check if we should set the admin role
const shouldSetAdmin = process.argv.includes('--set-admin');

async function run() {
  const isAdmin = await checkAdminStatus(userId);
  
  if (!isAdmin && shouldSetAdmin) {
    console.log('User is not an admin. Setting admin role...');
    const success = await setAdminRole(userId);
    
    if (success) {
      console.log('Admin role set successfully');
      // Check again to confirm
      await checkAdminStatus(userId);
    } else {
      console.error('Failed to set admin role');
    }
  }
  
  process.exit(0);
}

run();
