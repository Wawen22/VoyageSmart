'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import {
  CheckIcon,
  XIcon,
  UserPlusIcon,
  AlertCircleIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  ShieldIcon,
  ArrowRightIcon,
  LoaderIcon,
} from 'lucide-react';

export default function InviteAcceptPage() {
  const params = useParams();
  // Ensure we're getting the correct parameters
  const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
  // For the code, make sure we're not getting any extra characters
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const router = useRouter();
  const { user, signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any | null>(null);
  const [trip, setTrip] = useState<any | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

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
              description,
              image_url,
              users:owner_id (
                id,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('trip_id', tripId)
          .eq('invite_code', code)
          .single();

        if (invitationError) {
          if (invitationError.code === 'PGRST116') {
            throw new Error('Invitation not found or has expired');
          }
          throw invitationError;
        }

        if (!invitationData) {
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

        // Get participant count
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select('id')
          .eq('trip_id', tripId);

        if (!participantsError && participantsData) {
          setParticipantCount(participantsData.length);
        }
      } catch (err: any) {
        console.error('Error fetching invitation details:', err);
        setError(err.message || 'Failed to load invitation details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [tripId, code]);

  // Add effect to check if user is already a participant or should be added automatically when they log in
  useEffect(() => {
    if (user && invitation) {
      const checkAndAddParticipant = async () => {
        try {
          setLoading(true);

          // Check if user is already a participant
          const { data: existingParticipant, error: participantError } = await supabase
            .from('trip_participants')
            .select('*')
            .eq('trip_id', tripId)
            .eq('user_id', user.id)
            .single();

          if (existingParticipant) {
            // User is already a participant, show a message
            toast({
              title: "Already a participant",
              description: "You are already a participant in this trip. Redirecting to trip page...",
              action: <ToastAction altText="OK">OK</ToastAction>,
            });

            // Redirect to trip page after a short delay
            setTimeout(() => {
              router.push(`/trips/${tripId}`);
            }, 1000);
            return;
          }

          // If user is already registered but not a participant, add them automatically
          if (user.email && invitation.email === user.email) {
            console.log('User is already registered. Adding them automatically...');

            // Add user as a participant
            const { error: addParticipantError } = await supabase
              .from('trip_participants')
              .insert([{
                trip_id: tripId,
                user_id: user.id,
                role: invitation.role,
                invitation_status: 'accepted',
              }]);

            if (addParticipantError) throw addParticipantError;

            // Update invitation status
            const { error: updateInvitationError } = await supabase
              .from('trip_invitations')
              .update({ status: 'accepted' })
              .eq('id', invitation.id);

            if (updateInvitationError) throw updateInvitationError;

            // Show success message
            toast({
              title: "Welcome aboard!",
              description: "You've been automatically added to this trip. Redirecting to trip page...",
              action: <ToastAction altText="OK">OK</ToastAction>,
            });

            // Redirect to trip page after a short delay
            setTimeout(() => {
              router.push(`/trips/${tripId}`);
            }, 1500);
            return;
          }

          // If the email doesn't match or it's a link invitation, just show the invitation page
          console.log('User is registered but email doesn\'t match invitation or it\'s a link invitation');

        } catch (err) {
          console.error('Error checking or adding participant:', err);
          // Don't show error to user, just let them proceed with manual acceptance
        } finally {
          setLoading(false);
        }
      };

      checkAndAddParticipant();
    }
  }, [user, invitation, tripId, router]);

  const handleAcceptInvitation = async () => {
    if (!user) {
      // If user is not logged in, redirect to login page with return URL
      const returnUrl = `/invite/${tripId}/${code}`;
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

        // Show success message
        toast({
          title: "Already joined",
          description: "You are already a participant in this trip. Redirecting to trip page...",
          action: <ToastAction altText="OK">OK</ToastAction>,
        });

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

      // Show success message
      toast({
        title: "Success!",
        description: "You have joined the trip successfully. Redirecting to trip page...",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });

      // Redirect to trip page
      router.push(`/trips/${tripId}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
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

      // Show success message
      toast({
        title: "Invitation declined",
        description: "You have declined the invitation.",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });

      // Redirect to home page
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error declining invitation:', err);
      setError(err.message || 'Failed to decline invitation. Please try again.');
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

  const getDurationInDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + (diffDays === 1 ? ' day' : ' days');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">
          {user ? 'Checking your access to this trip...' : 'Loading invitation details...'}
        </p>
        {user && (
          <p className="text-xs text-muted-foreground mt-2 max-w-xs text-center">
            If you're already registered with the email this invitation was sent to, you'll be automatically added to the trip.
          </p>
        )}
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
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        {/* Trip Image */}
        <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
          {trip?.image_url ? (
            <Image
              src={trip.image_url}
              alt={trip.name || 'Trip'}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-end">
            <div className="p-4 text-white">
              <h2 className="text-2xl font-bold">{trip?.name || 'Unnamed Trip'}</h2>
              {trip?.destination && (
                <div className="flex items-center mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <p>{trip.destination}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pt-4 pb-2">
          <CardTitle className="text-xl text-center">You've been invited!</CardTitle>
          <CardDescription className="text-center">
            Join this trip and start planning together
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Trip Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Duration:</span>
                </div>
                <span className="font-medium">
                  {getDurationInDays(trip?.start_date, trip?.end_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Dates:</span>
                </div>
                <span className="font-medium">
                  {formatDate(trip?.start_date)} - {formatDate(trip?.end_date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Organized by:</span>
                </div>
                <span className="font-medium">{trip?.users?.full_name || 'Unknown'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserPlusIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Participants:</span>
                </div>
                <span className="font-medium">{participantCount} people</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldIcon className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">Your Role:</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {invitation?.role || 'Participant'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Trip Description */}
            {trip?.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">About this trip:</h3>
                <p className="text-sm">{trip.description}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-start space-x-2">
                <UserPlusIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">What you'll get:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Access to trip details and itinerary</li>
                    <li>Ability to add and edit activities</li>
                    <li>Expense tracking and sharing</li>
                    <li>Collaboration with other participants</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Login Notice */}
            {!user && (
              <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary">
                <p className="font-medium">You need to sign in or create an account to join this trip.</p>
                <p className="text-sm mt-1">Don't worry, we'll remember this invitation after you sign in.</p>
              </div>
            )}

            {/* Auto-join Notice */}
            {user && user.email && invitation && invitation.email === user.email && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 text-green-700 dark:text-green-300 animate-pulse-once">
                <p className="font-medium">You're registered with the same email as this invitation!</p>
                <p className="text-sm mt-1">Click "Accept Invitation" to join this trip immediately.</p>
              </div>
            )}

            {/* Error Message */}
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
            {declining ? (
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XIcon className="h-4 w-4 mr-2" />
            )}
            Decline
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={declining || accepting}
            className="flex items-center"
          >
            {accepting ? (
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : !user ? (
              <ArrowRightIcon className="h-4 w-4 mr-2" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-2" />
            )}
            {!user ? 'Sign in to Accept' : 'Accept Invitation'}
          </Button>
        </CardFooter>
      </Card>

      {/* Sign Up Links */}
      {!user && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground mb-3">Don't have an account yet?</p>
          <div className="flex space-x-4 justify-center">
            <Link href={`/register?returnUrl=${encodeURIComponent(`/invite/${tripId}/${code}`)}`}>
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
            <Link href={`/login?returnUrl=${encodeURIComponent(`/invite/${tripId}/${code}`)}`}>
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
