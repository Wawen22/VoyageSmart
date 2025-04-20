'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlusIcon, CheckIcon, XIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function JoinTripPage() {
  const params = useParams();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  
  console.log('Join page loaded with code:', code);
  
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [trip, setTrip] = useState<any | null>(null);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching invitation with code:', code);

        // Fetch invitation details
        const { data: invitationData, error: invitationError } = await supabase
          .from('trip_invitations')
          .select(`
            *,
            trips:trip_id (
              id,
              name,
              destination,
              start_date,
              end_date,
              owner_id,
              users:owner_id (
                full_name
              )
            )
          `)
          .eq('invite_code', code)
          .eq('status', 'pending')
          .eq('is_public_link', true)
          .single();

        console.log('Query result:', invitationData, 'Error:', invitationError);

        if (invitationError) {
          console.error('Error fetching invitation:', invitationError);
          if (invitationError.code === 'PGRST116') {
            throw new Error('Invitation not found or has expired');
          }
          throw invitationError;
        }

        if (!invitationData) {
          console.error('No invitation data found');
          throw new Error('Invitation not found or has expired');
        }

        // Check if invitation has expired
        const expiresAt = new Date(invitationData.expires_at);
        const now = new Date();
        if (expiresAt < now) {
          throw new Error('This invitation has expired');
        }

        setInvitation(invitationData);
        setTrip(invitationData.trips);

        // If user is logged in, check if they're already a participant
        if (user) {
          const { data: participantData, error: participantError } = await supabase
            .from('trip_participants')
            .select('*')
            .eq('trip_id', invitationData.trip_id)
            .eq('user_id', user.id)
            .single();

          if (participantData && !participantError) {
            // User is already a participant, redirect to trip page
            router.push(`/trips/${invitationData.trip_id}`);
            return;
          }
        }
      } catch (err: any) {
        console.error('Error fetching invitation details:', err);
        setError(err.message || 'Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchInvitationDetails();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [code, user, router]);

  const handleAcceptInvitation = async () => {
    if (!user) {
      // If user is not logged in, redirect to login page with return URL
      const returnUrl = `/join/${code}`;
      console.log('Redirecting to login with returnUrl:', returnUrl);
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!invitation || !trip) {
      setError('Invitation details not found. Please try again.');
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      // Check if user is already a participant
      const { data: existingParticipant, error: participantError } = await supabase
        .from('trip_participants')
        .select('*')
        .eq('trip_id', invitation.trip_id)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        // User is already a participant, redirect to trip page
        router.push(`/trips/${invitation.trip_id}`);
        return;
      }

      if (participantError && participantError.code !== 'PGRST116') {
        throw participantError;
      }

      // Add user as a participant
      const { error: addError } = await supabase
        .from('trip_participants')
        .insert([
          {
            trip_id: invitation.trip_id,
            user_id: user.id,
            role: invitation.role,
            invitation_status: 'accepted',
          },
        ]);

      if (addError) throw addError;

      // Show success message
      toast({
        title: 'Success!',
        description: 'You have joined the trip successfully.',
      });

      // Redirect to trip page
      router.push(`/trips/${invitation.trip_id}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-xl text-center">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <AlertCircleIcon className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl text-center">Trip Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{trip?.name || 'Unnamed Trip'}</h3>
              {trip?.destination && (
                <p className="text-muted-foreground">{trip.destination}</p>
              )}
              <div className="flex flex-col space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{formatDate(trip?.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span>{formatDate(trip?.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organized by:</span>
                  <span>{trip?.users?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Role:</span>
                  <span className="capitalize">{invitation?.role || 'Participant'}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-start space-x-2">
                <UserPlusIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>
                    By accepting this invitation, you'll be able to view trip details, 
                    participate in the itinerary, and share expenses with other participants.
                  </p>
                </div>
              </div>
            </div>

            {!user && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary">
                <p className="font-medium">You need to sign in or create an account to join this trip.</p>
                <p className="text-sm mt-1">Don't worry, we'll remember this invitation after you sign in.</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive">
                <p>{error}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleDeclineInvitation}
            disabled={declining || accepting}
            className="flex items-center"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={declining || accepting}
            className="flex items-center"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {!user ? 'Sign in to Accept' : (accepting ? 'Accepting...' : 'Accept Invitation')}
          </Button>
        </CardFooter>
      </Card>

      {/* Add links to sign up directly from this page */}
      {!user && (
        <div className="mt-4 text-center">
          <p className="text-muted-foreground mb-2">Don't have an account yet?</p>
          <div className="flex space-x-4 justify-center">
            <Link href={`/register?returnUrl=${encodeURIComponent(`/join/${code}`)}`}>
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
            <Link href={`/login?returnUrl=${encodeURIComponent(`/join/${code}`)}`}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
