'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminProtectedProps {
  children: ReactNode;
}

/**
 * Componente che protegge le rotte admin, permettendo l'accesso solo agli utenti con ruolo admin
 */
export function AdminProtected({ children }: AdminProtectedProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, error } = useIsAdmin();

  console.log('AdminProtected - State:', {
    user: !!user,
    isAdmin,
    authLoading,
    adminLoading,
    userId: user?.id,
    error
  });

  // Mostra un loader mentre verifichiamo l'autenticazione e il ruolo admin
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Verifica autorizzazioni...</p>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra messaggio di login
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Accesso Richiesto</h2>
          <p className="text-muted-foreground">Devi effettuare il login per accedere a questa sezione.</p>
          <Button asChild>
            <Link href="/login">Vai al Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Se c'è un errore nel controllo admin, mostra un messaggio
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-500">Errore nel controllo autorizzazioni</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Torna alla Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Se l'utente non è admin, mostra messaggio di accesso negato
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Accesso Negato</h2>
          <p className="text-muted-foreground">Non hai i permessi necessari per accedere a questa sezione.</p>
          <Button asChild>
            <Link href="/dashboard">Torna alla Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Se l'utente è autenticato ed è admin, mostra il contenuto
  return <>{children}</>;
}
