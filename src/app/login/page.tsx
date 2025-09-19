'use client';

import Link from 'next/link';
import { NavbarLogo } from '@/components/ui/OptimizedLogo';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; // Import useAuth
import { supabase } from '@/lib/supabase'; // Keep for resetPassword
import RateLimitInfo from '@/components/ui/RateLimitInfo';
import { useAutoAuthCleanup } from '@/hooks/useAuthCleanup';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Home } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { signIn, user } = useAuth(); // Get signIn and user from auth context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [showRateLimitInfo, setShowRateLimitInfo] = useState<boolean>(false);
  const searchParams = useSearchParams();

  // Automatically clear stale auth data when component mounts
  useAutoAuthCleanup(!user);

  useEffect(() => {
    // Check if user just registered
    const registered = searchParams.get('registered');
    const returnUrl = searchParams.get('returnUrl');
    const redirect = searchParams.get('redirect'); // Add support for redirect parameter

    if (registered === 'true') {
      if ((returnUrl && returnUrl.includes('/invite/')) || (redirect && redirect.includes('/invite/'))) {
        setSuccess('Registration successful! Please log in to accept the invitation.');
      } else {
        setSuccess('Registration successful! You can now log in with your credentials.');
      }
    }

    // Log the return URL for debugging
    if (returnUrl) {
      console.log('Login page loaded with returnUrl:', returnUrl);
    }
    if (redirect) {
      console.log('Login page loaded with redirect:', redirect);
    }
  }, [searchParams]);



  // Add effect to redirect if user is logged in
  useEffect(() => {
    // If a user object exists (from AuthProvider), redirect away from login
    if (user) {
      console.log('Login Page: User detected via context, redirecting...');

      // Get the return URL - check both returnUrl and redirect parameters
      const returnUrl = searchParams.get('returnUrl');
      const redirect = searchParams.get('redirect');
      const redirectTo = returnUrl || redirect || '/dashboard';

      console.log('Redirecting to:', redirectTo);

      // Use setTimeout to ensure the state update has completed before redirecting
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
    // We only care if the user object becomes available
  }, [user, router, searchParams]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [cooldownTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');

    // Check if we're in cooldown period
    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before trying again.`);
      return;
    }

    // Check if too many attempts in short time
    const now = Date.now();
    if (now - lastAttemptTime < 3000) { // 3 seconds between attempts
      setError('Please wait a moment before trying again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setLastAttemptTime(now);

      console.log('Attempting to sign in with:', { email });

      // Sign in the user using the context's signIn function
      await signIn(email, password);

      // The AuthProvider's onAuthStateChange and middleware will handle the redirect
      console.log('Sign in successful - letting auth system handle redirect');

      // Show success message
      setSuccess('Login successful! Redirecting...');

      // Let the auth system handle the redirect - no manual redirect needed
    } catch (err: any) {
      console.error('Login error:', err);

      // Handle rate limit errors with cooldown
      if (err.message?.includes('Too many login attempts') ||
          err.message?.includes('rate limit') ||
          err.message?.includes('too many requests')) {
        setCooldownTime(60); // 60 second cooldown
        setError('Too many login attempts. Please wait 60 seconds before trying again.');
        setShowRateLimitInfo(true); // Show info modal
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }

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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-20 glass-card rounded-full p-3 hover:scale-110 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/20"
        title="Back to Home"
      >
        <Home className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      </Link>

      {/* Animated Background with Glass Orbs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="glass-grid-pattern absolute inset-0"></div>

        {/* Floating Glass Orbs */}
        <div className="glass-orb glass-orb-primary absolute top-20 left-20 w-32 h-32 glass-orb-float"></div>
        <div className="glass-orb glass-orb-secondary absolute bottom-20 right-20 w-40 h-40 glass-orb-float" style={{ animationDelay: '-4s' }}></div>
        <div className="glass-orb glass-orb-primary absolute top-1/2 left-10 w-24 h-24 glass-orb-float" style={{ animationDelay: '-2s' }}></div>
        <div className="glass-orb glass-orb-secondary absolute bottom-1/3 right-10 w-28 h-28 glass-orb-float" style={{ animationDelay: '-6s' }}></div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-3xl p-8 space-y-6 animate-glass-fade-in shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="glass-card rounded-2xl p-4 inline-block">
                <NavbarLogo className="h-12 w-auto" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold gradient-text-primary">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to continue your journey</p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="glass-card rounded-xl p-4 bg-emerald-500/10 border-emerald-500/20 animate-glass-slide-up">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="glass-card rounded-xl p-4 bg-red-500/10 border-red-500/20 animate-glass-slide-up">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              {(error.includes('Too many login attempts') || error.includes('rate limit')) && (
                <button
                  onClick={() => setShowRateLimitInfo(true)}
                  className="mt-2 text-sm text-red-500 hover:text-red-600 underline hover:no-underline transition-colors"
                >
                  Learn more about rate limiting
                </button>
              )}
            </div>
          )}

          {/* Rate Limit Info */}
          {showRateLimitInfo && (
            <div className="animate-glass-slide-up">
              <RateLimitInfo
                isVisible={showRateLimitInfo}
                onClose={() => setShowRateLimitInfo(false)}
              />
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-card w-full pl-10 pr-4 py-3 rounded-xl border-0 bg-black/10 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-black/15 dark:focus:bg-white/10 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-card w-full pl-10 pr-12 py-3 rounded-xl border-0 bg-black/10 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-black/15 dark:focus:bg-white/10 transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || cooldownTime > 0}
                className="glass-button-primary w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : cooldownTime > 0 ? (
                  `Wait ${cooldownTime}s`
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/20 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 glass-card rounded-full text-muted-foreground bg-black/10 dark:bg-white/5">
                New to VoyageSmart?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href={(() => {
              const returnUrl = searchParams.get('returnUrl');
              const redirect = searchParams.get('redirect');
              const redirectParam = returnUrl || redirect;
              return redirectParam
                ? `/register?returnUrl=${encodeURIComponent(redirectParam)}`
                : '/register';
            })()}
            className="glass-button w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-foreground transition-all duration-300 hover:scale-[1.02] hover:bg-black/15 dark:hover:bg-white/10"
          >
            Create Account
          </Link>

          {/* Back to Home Link */}
          <div className="text-center mt-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 underline hover:no-underline"
            >
              ← Back to VoyageSmart
            </Link>
          </div>
        </div>
      </div>

      <RateLimitInfo
        isVisible={showRateLimitInfo}
        onClose={() => setShowRateLimitInfo(false)}
      />
    </div>
  );
}
