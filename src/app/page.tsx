'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-primary-600">Voyage Smart</h1>
          <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
            Your complete travel planning solution. Plan trips, manage expenses, and collaborate with friends all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Plan Your Trips</h2>
            <p className="text-gray-600 mb-4">
              Create detailed itineraries, add accommodations, and organize transportation all in one place.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Track Expenses</h2>
            <p className="text-gray-600 mb-4">
              Keep track of your travel budget, split expenses with friends, and see who owes what.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Collaborate</h2>
            <p className="text-gray-600 mb-4">
              Invite friends and family to join your trip planning, make decisions together, and share memories.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center font-medium"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition-colors text-center font-medium"
          >
            Sign Up
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 Voyage Smart. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
