'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export default function ConfirmEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'signup') {
          setStatus('error');
          setError('Invalid confirmation link');
          return;
        }

        // Confirm the email
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });

        if (error) {
          logger.error('Error confirming email', { error: error.message });
          setStatus('error');
          setError(error.message);
          return;
        }

        setStatus('success');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?confirmed=true');
        }, 3000);
      } catch (err) {
        logger.error('Error confirming email', { error: err });
        setStatus('error');
        setError('An unexpected error occurred');
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Email Confirmation</h1>
          
          {status === 'loading' && (
            <div className="mt-4">
              <p className="text-gray-600">Confirming your email...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                <p>Your email has been confirmed successfully!</p>
                <p className="mt-2">You will be redirected to the login page shortly.</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Click here if you are not redirected automatically
                </Link>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                <p>Error confirming your email:</p>
                <p className="font-medium">{error}</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-500"
                >
                  Return to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
