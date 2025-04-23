import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with admin privileges
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
