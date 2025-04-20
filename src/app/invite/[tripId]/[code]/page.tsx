'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, XIcon, UserPlusIcon, AlertCircleIcon } from 'lucide-react';

export default function InviteAcceptPage() {
  const params = useParams();
  // Ensure we're getting the correct parameters
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  // For the code, make sure we're not getting any extra characters
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  console.log('Params:', params);
  console.log('Extracted tripId:', tripId);
  console.log('Extracted code:', code);
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [trip, setTrip] = useState<any | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    // Ensure we have valid parameters
    if (!tripId || !code) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const fetchInvitationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching invitation with tripId:', tripId, 'and code:', code);

        // Log the parameters for debugging
        console.log('Querying database with tripId:', tripId, 'and code:', code);

        // Fetch invitation details - don't filter by status to see if it exists at all
        const { data: invitationData, error: invitationError } = await supabase
          .from('trip_invitations')
          .select(`
            *,
            trips:trip_id (
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
          .eq('trip_id', tripId)
          .eq('invite_code', code)
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

        // Check if invitation is not pending
        if (invitationData.status !== 'pending') {
          if (invitationData.status === 'accepted') {
            throw new Error('This invitation has already been accepted');
          } else if (invitationData.status === 'declined') {
            throw new Error('This invitation has been declined');
          } else if (invitationData.status === 'cancelled') {
            throw new Error('This invitation has been cancelled');
          }
        }

        // Check if invitation has expired
        const expiresAt = new Date(invitationData.expires_at);
        const now = new Date();
        if (expiresAt < now) {
          throw new Error('This invitation has expired');
        }

        setInvitation(invitationData);
        setTrip(invitationData.trips);
      } catch (err: any) {
        console.error('Error fetching invitation details:', err);
        setError(err.message || 'Failed to load invitation details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [tripId, code]);

  // Add effect to check if user is already a participant when they log in
  useEffect(() => {
    if (user && invitation) {
      const checkParticipation = async () => {
        try {
          // Check if user is already a participant
          const { data: existingParticipant } = await supabase
            .from('trip_participants')
            .select('*')
            .eq('trip_id', tripId)
            .eq('user_id', user.id)
            .single();

          if (existingParticipant) {
            // User is already a participant, show a message
            setError('You are already a participant in this trip. Redirecting to trip page...');

            // Redirect to trip page after a short delay
            setTimeout(() => {
              router.push(`/trips/${tripId}`);
            }, 2000);
          }
        } catch (err) {
          // Not a participant, which is fine in this case
          console.log('User is not yet a participant in this trip');
        }
      };

      checkParticipation();
    }
  }, [user, invitation, tripId, router]);

  const handleAcceptInvitation = async () => {
    if (!user) {
      // If user is not logged in, redirect to login page with return URL
      const returnUrl = `/invite/${tripId}/${code}`;
      console.log('Redirecting to login with returnUrl:', returnUrl);
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!invitation) {
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
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        // User is already a participant, just update the invitation status if it's a personal invitation
        if (!invitation.email.startsWith('link_invitation_') && invitation.email === user.email) {
          const { error: updateInvitationError } = await supabase
            .from('trip_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);

          if (updateInvitationError) throw updateInvitationError;
        }

        // Redirect to trip page
        router.push(`/trips/${tripId}`);
        return;
      }

      // Add user as a participant
      const { error: addParticipantError } = await supabase
        .from('trip_participants')
        .insert([
          {
            trip_id: tripId,
            user_id: user.id,
            role: invitation.role,
            invitation_status: 'accepted',
          },
        ]);

      if (addParticipantError) throw addParticipantError;

      // Update invitation status if it's a personal invitation
      if (!invitation.email.startsWith('link_invitation_') && invitation.email === user.email) {
        const { error: updateInvitationError } = await supabase
          .from('trip_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);

        if (updateInvitationError) throw updateInvitationError;
      }

      // Redirect to trip page
      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      setDeclining(true);
      setError(null);

      // Only update invitation status if it's a personal invitation
      if (!invitation.email.startsWith('link_invitation_') && user && invitation.email === user.email) {
        const { error: updateInvitationError } = await supabase
          .from('trip_invitations')
          .update({ status: 'declined' })
          .eq('id', invitation.id);

        if (updateInvitationError) throw updateInvitationError;
      }

      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      setError(err.message || 'Failed to decline invitation. Please try again.');
    } finally {
      setDeclining(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <CardContent>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircleIcon className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
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
            <Link href={`/register?returnUrl=${encodeURIComponent(`/invite/${tripId}/${code}`)}`}>
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
            <Link href={`/login?returnUrl=${encodeURIComponent(`/invite/${tripId}/${code}`)}`}>
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
