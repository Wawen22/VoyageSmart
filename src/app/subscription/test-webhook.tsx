'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TestWebhook() {
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [debugLoading, setDebugLoading] = useState(false);
  const [tier, setTier] = useState('premium');
  const [action, setAction] = useState('update');
  const [activeTab, setActiveTab] = useState('update');
  const [result, setResult] = useState<any>(null);
  const [debugResult, setDebugResult] = useState<any>(null);

  const handleTestWebhook = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tier,
          action,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        console.error('Error response from webhook:', data);
        throw new Error(data.error || data.details || 'Error testing webhook');
      }

      toast({
        title: 'Test Webhook Successful',
        description: `Your subscription has been ${action === 'check' ? 'checked' : 'updated to ' + tier} for testing purposes.`,
        variant: 'default',
      });

      // Aggiorna i dati della sottoscrizione senza ricaricare la pagina
      if (action !== 'check') {
        await refreshSubscription();
      }
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Error',
        description: error.message || 'There was an error testing the webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch('/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'check',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        console.error('Error response from webhook:', data);
        throw new Error(data.error || data.details || 'Error checking subscription');
      }

      toast({
        title: 'Subscription Check',
        description: 'Your subscription details have been retrieved.',
        variant: 'default',
      });

      // Aggiorna i dati della sottoscrizione
      await refreshSubscription();
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'There was an error checking the subscription',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDebugTest = async () => {
    if (!user) return;

    try {
      setDebugLoading(true);
      setDebugResult(null);

      // Ottieni la sessione corrente per il token di accesso
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No active session found');
      }

      const response = await fetch('/api/stripe/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setDebugResult(data);

      if (!response.ok) {
        console.error('Error response from debug API:', data);
        throw new Error(data.error || data.details || 'Error debugging subscription');
      }

      toast({
        title: 'Debug Test Successful',
        description: 'The debug test completed successfully.',
        variant: 'default',
      });

      // Aggiorna i dati della sottoscrizione
      await refreshSubscription();
    } catch (error: any) {
      console.error('Error in debug test:', error);
      toast({
        title: 'Error',
        description: error.message || 'There was an error in the debug test',
        variant: 'destructive',
      });
    } finally {
      setDebugLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Test Webhook</CardTitle>
        <CardDescription>
          Use this to test the webhook functionality without making a real payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="update">Update Subscription</TabsTrigger>
            <TabsTrigger value="check">Check Subscription</TabsTrigger>
            <TabsTrigger value="debug">Debug API</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tier">Subscription Tier</Label>
                <Select
                  value={tier}
                  onValueChange={setTier}
                >
                  <SelectTrigger id="tier">
                    <SelectValue placeholder="Select a tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="ai">AI Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                  value={action}
                  onValueChange={setAction}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Update Subscription</SelectItem>
                    <SelectItem value="create">Create Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleTestWebhook}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : `Test ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="check" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will check your current subscription status in the database.
            </p>

            <Button
              onClick={handleCheckSubscription}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Subscription Status'}
            </Button>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will test the database connection and permissions to help diagnose issues.
            </p>

            <Button
              onClick={handleDebugTest}
              disabled={debugLoading}
              className="w-full"
            >
              {debugLoading ? 'Testing...' : 'Run Debug Test'}
            </Button>

            {debugResult && (
              <div className="mt-4 space-y-2">
                <Label>Debug Result:</Label>
                <Textarea
                  value={JSON.stringify(debugResult, null, 2)}
                  readOnly
                  className="font-mono text-xs h-40"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {activeTab !== 'debug' && result && (
          <div className="mt-4 space-y-2">
            <Label>Result:</Label>
            <Textarea
              value={JSON.stringify(result, null, 2)}
              readOnly
              className="font-mono text-xs h-40"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
