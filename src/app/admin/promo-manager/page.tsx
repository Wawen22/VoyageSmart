'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftIcon, RefreshCcw, PlusCircle, Trash2, ShieldIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AdminProtected } from '@/components/auth/AdminProtected';

// Simplified PromoCode type
type PromoCode = {
  id: string;
  code: string;
  tier: 'free' | 'premium' | 'ai';
  max_uses: number | null;
  used_count: number;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
};

export default function SimplePromoManager() {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [tier, setTier] = useState<'free' | 'premium' | 'ai'>('ai');
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');

  // Authentication with simple token
  const authenticate = () => {
    // Simple hardcoded token for demo purposes
    if (token === 'voyagesmart-admin') {
      setIsAuthenticated(true);
      fetchPromoCodes();
      toast({
        title: 'Successo',
        description: 'Autenticazione riuscita!',
        variant: 'default',
      });
    } else {
      setError('Token non valido. Riprova.');
      toast({
        title: 'Errore',
        description: 'Token non valido',
        variant: 'destructive',
      });
    }
  };

  // Fetch promo codes
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/promo-codes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'voyagesmart-admin'
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei codici promo');
      }

      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Errore',
        description: 'Errore nel caricamento dei codici promo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create promo code
  const createPromoCode = async () => {
    try {
      if (!code) {
        toast({
          title: 'Errore',
          description: 'Inserisci un codice promo',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'voyagesmart-admin'
        },
        body: JSON.stringify({
          code,
          tier,
          max_uses: maxUses,
          expires_at: expiresAt || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione del codice promo');
      }

      toast({
        title: 'Successo',
        description: 'Codice promo creato con successo!',
        variant: 'default',
      });

      // Reset form
      setCode('');
      setTier('ai');
      setMaxUses(null);
      setExpiresAt('');

      // Refresh list
      fetchPromoCodes();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Errore',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete promo code
  const deletePromoCode = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'voyagesmart-admin'
        }
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del codice promo');
      }

      toast({
        title: 'Successo',
        description: 'Codice promo eliminato con successo!',
        variant: 'default',
      });

      // Refresh list
      fetchPromoCodes();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Errore',
        description: 'Errore nell\'eliminazione del codice promo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nessuna scadenza';
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-16 px-4 md:px-6">
        <div className="max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-8 hover:bg-muted/50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>

          <h1 className="text-2xl font-bold text-center mb-6">Gestione Codici Promo</h1>

          <Card className="shadow-md border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-center">Accesso Admin</CardTitle>
              <CardDescription className="text-center">
                Inserisci il token di amministrazione per accedere alla gestione dei codici promozionali
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="font-medium">Token Admin</Label>
                  <Input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Inserisci il token di amministrazione"
                    className="focus-visible:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        authenticate();
                      }
                    }}
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t bg-muted/20">
              <Button
                onClick={authenticate}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Autenticazione...' : 'Accedi'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AdminProtected>
      <div className="container py-10 px-4 md:px-6 mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mr-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>

          <div className="flex items-center text-purple-500 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <ShieldIcon className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Area Amministratore</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mt-4">Gestione Codici Promo</h1>
        <p className="text-muted-foreground mt-2">
          Crea e gestisci codici promozionali per gli utenti
        </p>
      </div>

      {/* Create Promo Code Form */}
      <Card className="mb-8 shadow-md border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Crea Nuovo Codice Promo</CardTitle>
          <CardDescription>Compila il form per creare un nuovo codice promozionale</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code" className="font-medium">Codice Promo</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="es. SUMMER2023"
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier" className="font-medium">Piano</Label>
              <Select value={tier} onValueChange={(value: any) => setTier(value)}>
                <SelectTrigger id="tier" className="focus-visible:ring-primary">
                  <SelectValue placeholder="Seleziona piano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="ai">AI Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses" className="font-medium">Utilizzi Massimi <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses === null ? '' : maxUses}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Lascia vuoto per illimitati"
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt" className="font-medium">Data di Scadenza <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="focus-visible:ring-primary"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t bg-muted/20">
          <Button onClick={createPromoCode} disabled={loading} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" />
            Crea Codice Promo
          </Button>
        </CardFooter>
      </Card>

      {/* Promo Codes List */}
      <Card className="shadow-md border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl">Codici Promo Attivi</CardTitle>
            <CardDescription>Gestisci i tuoi codici promozionali</CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPromoCodes}
            disabled={loading}
            className="h-9 w-9 rounded-md hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Caricamento in corso...</p>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Nessun codice promo trovato</p>
              <p className="text-sm text-muted-foreground mt-2">Crea il tuo primo codice promozionale utilizzando il form sopra</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Codice</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Piano</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Utilizzi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Scadenza</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-medium">{promo.code}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          promo.tier === 'premium' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          promo.tier === 'ai' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {promo.tier === 'premium' ? 'Premium' :
                           promo.tier === 'ai' ? 'AI Assistant' : 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-muted/30 px-2 py-1 rounded text-xs">
                          {promo.used_count} / {promo.max_uses === null ? '∞' : promo.max_uses}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(promo.expires_at)}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePromoCode(promo.id)}
                          className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminProtected>
  );
}
