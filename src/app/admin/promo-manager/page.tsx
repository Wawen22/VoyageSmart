'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftIcon, RefreshCcw, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
      <div className="container py-10">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Accesso Admin</CardTitle>
              <CardDescription>Inserisci il token di amministrazione per accedere</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token Admin</Label>
                  <Input
                    id="token"
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Inserisci il token di amministrazione"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={authenticate} className="w-full">Accedi</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Torna alla Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Gestione Codici Promo</h1>
        <p className="text-muted-foreground">
          Crea e gestisci codici promozionali per gli utenti
        </p>
      </div>

      {/* Create Promo Code Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Crea Nuovo Codice Promo</CardTitle>
          <CardDescription>Compila il form per creare un nuovo codice promozionale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Codice Promo</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="es. SUMMER2023"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Piano</Label>
              <Select value={tier} onValueChange={(value: any) => setTier(value)}>
                <SelectTrigger id="tier">
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
              <Label htmlFor="maxUses">Utilizzi Massimi (opzionale)</Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses === null ? '' : maxUses}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Lascia vuoto per illimitati"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Data di Scadenza (opzionale)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createPromoCode} disabled={loading}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Crea Codice Promo
          </Button>
        </CardFooter>
      </Card>

      {/* Promo Codes List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Codici Promo Attivi</CardTitle>
            <CardDescription>Gestisci i tuoi codici promozionali</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchPromoCodes} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Caricamento in corso...</p>
          ) : promoCodes.length === 0 ? (
            <p className="text-center py-4">Nessun codice promo trovato</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Codice</th>
                    <th className="text-left py-3 px-2">Piano</th>
                    <th className="text-left py-3 px-2">Utilizzi</th>
                    <th className="text-left py-3 px-2">Scadenza</th>
                    <th className="text-left py-3 px-2">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo.id} className="border-b">
                      <td className="py-3 px-2 font-medium">{promo.code}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          promo.tier === 'premium' ? 'bg-amber-100 text-amber-800' :
                          promo.tier === 'ai' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {promo.tier === 'premium' ? 'Premium' :
                           promo.tier === 'ai' ? 'AI Assistant' : 'Free'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {promo.used_count} / {promo.max_uses === null ? '∞' : promo.max_uses}
                      </td>
                      <td className="py-3 px-2">{formatDate(promo.expires_at)}</td>
                      <td className="py-3 px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePromoCode(promo.id)}
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
    </div>
  );
}
