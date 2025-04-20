'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Trip = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  budget_total: number | null;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

type Participant = {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email: string;
};

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        
        if (!user) return;
        
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        
        if (tripError) throw tripError;
        
        setTrip(tripData);
        setIsOwner(tripData.owner_id === user.id);
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            role,
            users (
              full_name,
              email
            )
          `)
          .eq('trip_id', id);
        
        if (participantsError) throw participantsError;
        
        // Format participants data
        const formattedParticipants = participantsData.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          role: p.role,
          full_name: p.users?.full_name || 'Unknown',
          email: p.users?.email || 'Unknown',
        }));
        
        setParticipants(formattedParticipants);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading trip details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 mb-6 max-w-md w-full">
          <p>{error || 'Trip not found'}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-primary-600 hover:text-primary-500"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 text-primary-600 hover:text-primary-500"
              >
                ← Back
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
            </div>
            
            {isOwner && (
              <Link
                href={`/trips/${id}/edit`}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Trip
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trip Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-2">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Trip Details</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Overview of your trip information
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Destination</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {trip.destination || 'Not specified'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Dates</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(trip.start_date)} to {formatDate(trip.end_date)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatCurrency(trip.budget_total)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Privacy</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {trip.is_private ? 'Private' : 'Public'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {trip.description || 'No description provided'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Participants */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">Participants</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  People joining this trip
                </p>
              </div>
              
              {isOwner && (
                <Link
                  href={`/trips/${id}/invite`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Invite
                </Link>
              )}
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {participants.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6">
                    <p className="text-sm text-gray-500">No participants yet</p>
                  </li>
                ) : (
                  participants.map((participant) => (
                    <li key={participant.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-800 font-medium">
                              {participant.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{participant.email}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {participant.role}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Trip Actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg lg:col-span-3">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Trip Actions</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage your trip activities
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Link href={`/trips/${id}/itinerary`}>
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-gray-900">Itinerary</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Plan your daily activities and schedule
                    </p>
                  </div>
                </Link>
                
                <Link href={`/trips/${id}/accommodations`}>
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-gray-900">Accommodations</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage hotels and places to stay
                    </p>
                  </div>
                </Link>
                
                <Link href={`/trips/${id}/transportation`}>
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-gray-900">Transportation</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Track flights, trains, and other transport
                    </p>
                  </div>
                </Link>
                
                <Link href={`/trips/${id}/expenses`}>
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
                    <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Track and split trip expenses
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
