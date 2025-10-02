'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClientSupabase } from '@/lib/supabase-client';
import { Shield, Download, Trash2, Eye, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  getConsentSettings,
  updateConsentSettings,
  getThirdPartyServices,
  type ConsentSettings,
} from '@/lib/services/gdprService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState<ConsentSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    aiProcessing: false,
    thirdPartySharing: false,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    // Load current consent settings
    const currentConsents = getConsentSettings();
    setConsents(currentConsents);
  }, []);

  const handleConsentChange = (key: keyof ConsentSettings, value: boolean) => {
    const newConsents = { ...consents, [key]: value };
    setConsents(newConsents);
    updateConsentSettings({ [key]: value });
    toast.success('Privacy preferences updated');
  };

  const handleExportData = async () => {
    try {
      setLoading(true);

      // Get the session token from Supabase
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to export data');
      }

      const response = await fetch('/api/gdpr/export-data', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voyagesmart-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Your data has been exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Your account has been deleted');
      router.push('/');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const thirdPartyServices = getThirdPartyServices();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to access privacy settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Privacy & Data Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your privacy preferences and data</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Consent Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy Preferences
              </CardTitle>
              <CardDescription>
                Control how your data is used across VoyageSmart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Necessary */}
              <div className="flex items-start justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Necessary</h4>
                  <p className="text-sm text-muted-foreground">
                    Essential for the website to function. Cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                    Always Active
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Help us improve by allowing anonymous usage analytics
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized offers and travel recommendations
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.marketing}
                      onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* AI Processing */}
              <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">AI Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered features like itinerary generation
                  </p>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consents.aiProcessing}
                      onChange={(e) => handleConsentChange('aiProcessing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third Party Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Third-Party Data Sharing
              </CardTitle>
              <CardDescription>
                Services that process your data to provide VoyageSmart features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {thirdPartyServices.map((service, index) => (
                  <div key={index} className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground mb-1">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{service.purpose}</p>
                        <a
                          href={service.privacyPolicy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View Privacy Policy →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download all your personal data in JSON format (GDPR Right to Data Portability)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportData}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Exporting...' : 'Export My Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data (GDPR Right to Erasure)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>All your trips and itineraries</li>
                        <li>Expense records and financial data</li>
                        <li>Accommodations and transportation bookings</li>
                        <li>AI preferences and conversation history</li>
                        <li>Subscription information</li>
                      </ul>
                      <div className="space-y-3 pt-4">
                        <div>
                          <Label htmlFor="delete-confirmation">
                            Type <strong>DELETE MY ACCOUNT</strong> to confirm
                          </Label>
                          <Input
                            id="delete-confirmation"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE MY ACCOUNT"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="delete-password">Enter your password</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your password"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirmation !== 'DELETE MY ACCOUNT' || !deletePassword}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

