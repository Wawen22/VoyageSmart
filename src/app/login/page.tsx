'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; // Import useAuth
import { supabase } from '@/lib/supabase'; // Keep for resetPassword

export default function Login() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth(); // Get signIn, user, and loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user just registered
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccess('Registration successful! You can now log in with your credentials.');
    }
  }, [searchParams]);

  // Add effect to redirect if user is logged in
  useEffect(() => {
    // If a user object exists (from AuthProvider), redirect away from login
    if (user) {
      console.log('Login Page: User detected via context, redirecting to dashboard...');
      router.push('/dashboard');
    }
    // We only care if the user object becomes available
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('Attempting to sign in with:', { email });

      // Sign in the user using the context's signIn function
      await signIn(email, password);

      // The AuthProvider's onAuthStateChange or middleware should handle the redirect now.
      // The explicit push below might still be useful for immediate feedback,
      // but the core redirection relies on the state update.
      console.log('Sign in initiated via context');

      // Show success message (optional, as redirection should be quick)
      setSuccess('Login successful! Redirecting...');

      // Explicit redirection removed. Middleware should handle this based on auth state.
      // router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Login to Voyage Smart</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        {success && (
          <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary mb-4">
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-4">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-primary hover:text-primary/90 font-medium transition-colors"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Don't have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/register"
              className="w-full flex justify-center py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
