import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * Hook personalizzato per verificare se l'utente corrente ha il ruolo di admin
 * @returns Un oggetto con lo stato di admin dell'utente e lo stato di caricamento
 */
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query the users table to get the user's preferences
        const { data, error } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user preferences:', error);
          setError(error.message);
          setIsAdmin(false);
          return;
        }

        // Check if the user has admin role in preferences
        const hasAdminRole = data?.preferences?.role === 'admin';
        console.log(`User ${user.id} admin status:`, hasAdminRole);
        setIsAdmin(hasAdminRole);
      } catch (err: any) {
        console.error('Unexpected error checking admin status:', err);
        setError(err.message);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading, error };
}
