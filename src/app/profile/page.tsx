'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { RocketIcon, TagIcon, LockIcon, SparklesIcon } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const { subscription, upgradeSubscription } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
  });

  // Set initial form data when user is available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        avatarUrl: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await updateProfile({
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl,
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
          <div className="sm:hidden">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary mb-6">
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="mt-1 block w-full border border-input rounded-md shadow-sm py-2 px-3 bg-secondary text-muted-foreground sm:text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-foreground">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatarUrl"
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-input bg-background text-foreground rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter a URL to an image for your profile picture
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex justify-center py-2 px-4 border border-input shadow-sm text-sm font-medium rounded-md text-foreground bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Subscription Information */}
        <div className="mt-6 bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-foreground flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                Subscription Plan
              </h3>
              {subscription && (
                <Badge
                  variant={subscription.tier !== 'free' ? 'default' : 'outline'}
                  className={`text-sm ${subscription.tier === 'ai' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : ''}`}
                >
                  {subscription.tier === 'premium'
                    ? 'Premium'
                    : subscription.tier === 'ai'
                      ? 'AI Assistant'
                      : 'Free'}
                </Badge>
              )}
            </div>

            <div className="mt-2 space-y-4">
              {subscription ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Current Plan</p>
                      <p className="text-sm text-muted-foreground capitalize">{subscription.tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Status</p>
                      <p className="text-sm text-muted-foreground capitalize">{subscription.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Valid Until</p>
                      <p className="text-sm text-muted-foreground">{formatDate(subscription.validUntil.toISOString())}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Features</p>
                      <p className="text-sm text-muted-foreground">
                        {subscription.tier === 'premium' ? (
                          'Unlimited trips, Accommodations, Transportation'
                        ) : subscription.tier === 'ai' ? (
                          'All Premium features + AI Assistant, Itinerary Wizard'
                        ) : (
                          'Up to 3 trips'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {subscription.tier === 'premium' ? (
                        <div className="flex items-center text-sm text-primary">
                          <RocketIcon className="h-4 w-4 mr-2" />
                          <span>You're enjoying all premium features!</span>
                        </div>
                      ) : subscription.tier === 'ai' ? (
                        <div className="flex items-center text-sm text-purple-500">
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          <span>You're enjoying all premium and AI features!</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <LockIcon className="h-4 w-4 mr-2" />
                          <span>Upgrade to unlock premium features</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {subscription.tier === 'free' && (
                          <button
                            type="button"
                            onClick={() => upgradeSubscription('premium')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                          >
                            Upgrade to Premium
                          </button>
                        )}
                        {subscription.tier !== 'ai' && (
                          <button
                            type="button"
                            onClick={() => upgradeSubscription('ai')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                          >
                            {subscription.tier === 'free' ? 'Get AI Assistant' : 'Upgrade to AI Assistant'}
                          </button>
                        )}
                        <Link
                          href="/subscription"
                          className="inline-flex items-center justify-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                          Manage Subscription
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading subscription information...</p>
              )}
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-6 bg-card shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-foreground">Delete Account</h3>
            <div className="mt-2 max-w-xl text-sm text-muted-foreground">
              <p>
                Once you delete your account, all of your data will be permanently removed.
                This action cannot be undone.
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive sm:text-sm transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
