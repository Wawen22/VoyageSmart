 'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useRouter and useSearchParams
import { signUpUser } from '@/lib/auth-utils';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Home } from 'lucide-react';

export default function Register() {
  const router = useRouter(); // Initialize useRouter
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
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
      setError('You must accept the Terms of Service');
      return;
    }

    if (!acceptPrivacy) {
      setError('You must accept the Privacy Policy');
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

      // Store marketing consent if accepted
      if (acceptMarketing) {
        localStorage.setItem('consent-marketing', 'true');
      }

      // Clear form fields after successful registration
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAcceptTerms(false);
      setAcceptPrivacy(false);
      setAcceptMarketing(false);

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
    <div className="min-h-screen flex items-start justify-center overflow-auto py-4">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-20 glass-card rounded-full p-3 hover:scale-110 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/20"
        title="Back to Home"
      >
        <Home className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
      </Link>

      {/* Animated Background with Glass Orbs */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="glass-grid-pattern absolute inset-0"></div>

        {/* Floating Glass Orbs */}
        <div className="glass-orb glass-orb-primary absolute top-20 left-20 w-32 h-32 glass-orb-float"></div>
        <div className="glass-orb glass-orb-secondary absolute bottom-20 right-20 w-40 h-40 glass-orb-float" style={{ animationDelay: '-4s' }}></div>
        <div className="glass-orb glass-orb-primary absolute top-1/2 left-10 w-24 h-24 glass-orb-float" style={{ animationDelay: '-2s' }}></div>
        <div className="glass-orb glass-orb-secondary absolute bottom-1/3 right-10 w-28 h-28 glass-orb-float" style={{ animationDelay: '-6s' }}></div>
      </div>

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl mx-4 ">
        <div className="glass-card rounded-3xl p-6 md:p-8 lg:p-10 space-y-5 md:space-y-6 animate-glass-fade-in shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-3 md:space-y-4">
            <div className="flex justify-center">
              <div className="glass-card rounded-2xl p-3 md:p-4 inline-block">
                <Image
                  src="/images/logo-voyage_smart.png"
                  alt="Voyage Smart Logo"
                  width={180}
                  height={52}
                  className="h-10 md:h-12 w-auto"
                  priority
                />
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold gradient-text-primary">Join VoyageSmart</h1>
              <p className="text-sm md:text-base text-muted-foreground">Start planning your perfect trips today</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card rounded-xl p-4 bg-red-500/10 border-red-500/20 animate-glass-slide-up">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="glass-card rounded-xl p-4 bg-emerald-500/10 border-emerald-500/20 animate-glass-slide-up">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div className="space-y-1.5 md:space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-foreground">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="glass-card w-full pl-10 pr-4 py-3 rounded-xl border-0 bg-black/10 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-black/15 dark:focus:bg-white/10 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5 md:space-y-2">
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
            <div className="space-y-1.5 md:space-y-2">
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
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5 md:space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-card w-full pl-10 pr-12 py-3 rounded-xl border-0 bg-black/10 dark:bg-white/5 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-black/15 dark:focus:bg-white/10 transition-all duration-300"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <div className="relative">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-2 border-black/30 dark:border-white/20 bg-black/10 dark:bg-white/5 rounded-md backdrop-blur-sm transition-all duration-300"
                  />
                  {acceptTerms && (
                    <Check className="absolute inset-0 h-5 w-5 text-primary pointer-events-none" />
                  )}
                </div>
              </div>
              <div className="text-sm">
                <label htmlFor="terms" className="font-medium text-foreground cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms-of-service" className="text-primary hover:text-primary/80 transition-colors underline">
                    Terms of Service
                  </Link>
                  <span className="text-destructive ml-1">*</span>
                </label>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <div className="relative">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    required
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-2 border-black/30 dark:border-white/20 bg-black/10 dark:bg-white/5 rounded-md backdrop-blur-sm transition-all duration-300"
                  />
                  {acceptPrivacy && (
                    <Check className="absolute inset-0 h-5 w-5 text-primary pointer-events-none" />
                  )}
                </div>
              </div>
              <div className="text-sm">
                <label htmlFor="privacy" className="font-medium text-foreground cursor-pointer">
                  I agree to the{' '}
                  <Link href="/privacy-policy" className="text-primary hover:text-primary/80 transition-colors underline">
                    Privacy Policy
                  </Link>
                  <span className="text-destructive ml-1">*</span>
                </label>
              </div>
            </div>

            {/* Marketing Consent (Optional) */}
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5 mt-1">
                <div className="relative">
                  <input
                    id="marketing"
                    name="marketing"
                    type="checkbox"
                    checked={acceptMarketing}
                    onChange={(e) => setAcceptMarketing(e.target.checked)}
                    className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary/50 border-2 border-black/30 dark:border-white/20 bg-black/10 dark:bg-white/5 rounded-md backdrop-blur-sm transition-all duration-300"
                  />
                  {acceptMarketing && (
                    <Check className="absolute inset-0 h-5 w-5 text-primary pointer-events-none" />
                  )}
                </div>
              </div>
              <div className="text-sm">
                <label htmlFor="marketing" className="font-medium text-muted-foreground cursor-pointer">
                  I want to receive travel tips, special offers, and updates via email (optional)
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-4 md:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/20 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 glass-card rounded-full text-muted-foreground bg-black/10 dark:bg-white/5">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="glass-button w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-foreground transition-all duration-300 hover:scale-[1.02] hover:bg-black/15 dark:hover:bg-white/10"
          >
            Sign In
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
    </div>
  );
}
