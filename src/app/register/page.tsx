 'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
import { signUpUser } from '@/lib/auth-utils';

export default function Register() {
  const router = useRouter(); // Initialize useRouter
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Log the return URL for debugging
    if (returnUrl) {
      console.log('Registration page loaded with returnUrl:', returnUrl);
    }
  }, [returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Attempting to sign up with:', { email, fullName });

      // Sign up the user
      const data = await signUpUser(email, password, fullName);

      console.log('Sign up successful, user:', data?.user);

      // Show success message asking user to confirm email
      setSuccess('Registration successful! Please check your email to confirm your account.');
      setLoading(false); // Stop loading indicator

      // Clear form fields after successful registration
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptTerms(false);

      // If there's a returnUrl, add it to the login redirect
      if (returnUrl) {
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}&registered=true`);
      } else {
        // No automatic redirect here, user needs to confirm email first.
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card rounded-lg shadow-md border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Create an Account</h1>
          <p className="mt-2 text-muted-foreground">Join Voyage Smart to start planning your trips</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-4">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary mb-4">
            <p>{success}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

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
            <p className="mt-1 text-xs text-muted-foreground">Must be at least 6 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary border-input bg-background rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="font-medium text-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:text-primary/90 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/90 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-input rounded-md shadow-sm text-sm font-medium text-foreground bg-secondary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
