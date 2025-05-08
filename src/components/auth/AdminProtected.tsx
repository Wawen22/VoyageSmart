'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Spinner } from '@/components/ui/spinner';

interface AdminProtectedProps {
  children: ReactNode;
}

/**
 * Componente che protegge le rotte admin, permettendo l'accesso solo agli utenti con ruolo admin
 */
export function AdminProtected({ children }: AdminProtectedProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  useEffect(() => {
    // Se l'utente non è autenticato e non stiamo caricando, reindirizza alla pagina di login
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Se l'utente è autenticato ma non è admin e non stiamo caricando, reindirizza alla dashboard
    if (!authLoading && !adminLoading && user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  // Mostra un loader mentre verifichiamo l'autenticazione e il ruolo admin
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-2 text-muted-foreground">Verifica autorizzazioni...</span>
      </div>
    );
  }

  // Se l'utente non è autenticato o non è admin, non mostrare nulla (verrà reindirizzato)
  if (!user || !isAdmin) {
    return null;
  }

  // Se l'utente è autenticato ed è admin, mostra il contenuto
  return <>{children}</>;
}
