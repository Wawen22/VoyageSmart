'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEmail } from '@/hooks/useEmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import {
  UserPlusIcon,
  XIcon,
  RefreshCwIcon,
  UsersIcon,
  AlertCircleIcon,
} from 'lucide-react';

type Participant = {
  id: string;
  user_id: string;
  trip_id: string;
  role: string;
  invitation_status: string;
  created_at: string;
  // Joined fields
  full_name?: string;
  email?: string;
};

type Invitation = {
  id: string;
  trip_id: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
  expires_at: string;
  invite_code: string;
  invited_by: string;
  // Joined fields
  inviter_name?: string;
};

export default function InvitePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [trip, setTrip] = useState<any | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const { sendInvitationEmail, sendTripUpdatedEmail } = useEmail();

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('participant');

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) return;

        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

        // Check if user is the owner
        const isOwner = tripData.owner_id === user.id;
        setIsOwner(isOwner);

        if (!isOwner) {
          setError('You do not have permission to invite participants to this trip');
          return;
        }

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            id,
            user_id,
            trip_id,
            role,
            invitation_status,
            created_at,
            users:user_id (
              full_name,
              email
            )
          `)
          .eq('trip_id', id);

        if (participantsError) throw participantsError;

        // Format participants data with proper type handling
        const formattedParticipants = participantsData.map(p => {
          const userData = (Array.isArray(p.users) ? p.users[0] : p.users) as { full_name: string; email: string } | null;
          return {
            id: p.id,
            user_id: p.user_id,
            trip_id: p.trip_id,
            role: p.role,
            invitation_status: p.invitation_status,
            created_at: p.created_at,
            full_name: userData?.full_name || 'Unknown',
            email: userData?.email || '',
          };
        });

        setParticipants(formattedParticipants);

        // Fetch pending invitations
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('trip_invitations')
          .select(`
            id,
            trip_id,
            email,
            status,
            role,
            created_at,
            expires_at,
            invite_code,
            invited_by,
            users:invited_by (
              full_name
            )
          `)
          .eq('trip_id', id)
          .eq('status', 'pending');

        if (invitationsError) throw invitationsError;

        // Format invitations data with proper type handling
        const formattedInvitations = invitationsData
          .filter(inv => !inv.email.startsWith('link_invitation_'))
          .map(inv => {
            const userData = (Array.isArray(inv.users) ? inv.users[0] : inv.users) as { full_name: string } | null;
            return {
              id: inv.id,
              trip_id: inv.trip_id,
              email: inv.email,
              status: inv.status,
              role: inv.role,
              created_at: inv.created_at,
              expires_at: inv.expires_at,
              invite_code: inv.invite_code,
              invited_by: inv.invited_by,
              inviter_name: userData?.full_name || 'Unknown',
            };
          });

        setPendingInvitations(formattedInvitations);
      } catch (err) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [id, user]);

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setLoading(true);

      // Update the invitation status to 'cancelled'
      const { error } = await supabase
        .from('trip_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      // Remove the invitation from the list
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipantManually = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      setError('Please enter an email address');
      return;
    }

    if (!isValidEmail(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      setError(null);
      setSuccess(null);

      // Check if the user is already a participant
      const existingParticipant = participants.find(p => p.email?.toLowerCase() === inviteEmail.toLowerCase());
      if (existingParticipant) {
        setError('This user is already a participant in this trip');
        setInviting(false);
        return;
      }

      // Check if the user is already registered in the system
      const { data: existingUsers, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('email', inviteEmail.toLowerCase())
        .limit(1);

      if (userError) {
        console.error('Error checking if user exists:', userError);
        // Continue with the normal invitation flow
      }

      // If the user is already registered, add them directly to the trip
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('User already registered, adding directly to trip:', existingUser);

        try {
          // Add the user as a participant
          const { data: participantData, error: participantError } = await supabase
            .from('trip_participants')
            .insert([
              {
                trip_id: id,
                user_id: existingUser.id,
                role: inviteRole,
                invitation_status: 'accepted',
              },
            ])
            .select();

          if (participantError) {
            throw participantError;
          }

          // Send notification email to the user
          try {
            const baseUrl = window.location.origin;
            const tripLink = `${baseUrl}/trips/${id}`;

            // Send email notification
            await sendTripUpdatedEmail({
              to: existingUser.email,
              tripName: trip?.name || 'Trip',
              updaterName: user?.full_name || 'Trip Organizer',
              changes: ['You have been added as a participant'],
              tripLink: tripLink,
            });
          } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Continue even if email fails
          }

          // Show success message
          setSuccess(`${existingUser.full_name || existingUser.email} has been added to the trip automatically.`);
          toast({
            title: "Participant added",
            description: `${existingUser.full_name || existingUser.email} has been added to the trip automatically.`,
            action: <ToastAction altText="OK">OK</ToastAction>,
          });

          // Reset form
          setInviteEmail('');
          setInviting(false);
          return;
        } catch (err) {
          console.error('Error adding existing user to trip:', err);
          // If there's an error, continue with the normal invitation flow
        }
      }

      // Generate a unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 15);

      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create an invitation for this email
      const { data: invitationData, error: invitationError } = await supabase
        .from('trip_invitations')
        .insert([
          {
            trip_id: id,
            email: inviteEmail,
            status: 'pending',
            role: inviteRole,
            invited_by: user?.id,
            invite_code: inviteCode,
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select();

      if (invitationError) {
        // Check if it's a duplicate invitation
        if (invitationError.code === '23505') { // Unique constraint violation
          setError(`An invitation has already been sent to ${inviteEmail}. Please ask them to check their email.`);
        } else {
          throw invitationError;
        }
        setInviting(false);
        return;
      }

      // Add the new invitation to the list
      if (invitationData && invitationData[0]) {
        const newInvitation: Invitation = {
          ...invitationData[0],
          inviter_name: user?.full_name || 'Unknown',
        };

        setPendingInvitations([...pendingInvitations, newInvitation]);

        // Send email notification
        const baseUrl = window.location.origin;
        const inviteLink = `${baseUrl}/invite/${id}/${newInvitation.invite_code}`;

        try {
          // Send invitation email
          await sendInvitationEmail({
            to: inviteEmail,
            inviterName: user?.full_name || 'Trip Organizer',
            tripName: trip?.name || 'Trip',
            inviteLink: inviteLink,
          });

          // Show success message for invitation
          setSuccess(`Invitation sent to ${inviteEmail}. They need to register and accept the invitation.`);
          toast({
            title: "Invitation created",
            description: `${inviteEmail} needs to register before they can join this trip.`,
            action: <ToastAction altText="OK">OK</ToastAction>,
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Still show success for invitation creation even if email fails
          setSuccess(`Invitation created for ${inviteEmail}, but we couldn't send an email notification.`);
          toast({
            title: "Invitation created",
            description: `${inviteEmail} has been invited, but email notification failed. Error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
            variant: "destructive",
            action: <ToastAction altText="OK">OK</ToastAction>,
          });
        }

        // Reset form
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Error adding participant:', err);

      // Provide more specific error messages
      if (err instanceof Error) {
        setError(`Failed to add participant: ${err.message}`);
      } else {
        setError('Failed to add participant. Please try again.');
      }

      // Show error toast for better visibility
      toast({
        title: "Error",
        description: "Failed to add participant. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setLoading(true);

      // Get the invitation
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        setError('Invitation not found');
        return;
      }

      // Update the expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Update the invitation
      const { error } = await supabase
        .from('trip_invitations')
        .update({
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) throw error;

      // Send email notification
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/invite/${id}/${invitation.invite_code}`;

      try {
        // Send invitation email
        await sendInvitationEmail({
          to: invitation.email,
          inviterName: user?.full_name || 'Trip Organizer',
          tripName: trip?.name || 'Trip',
          inviteLink: inviteLink,
        });

        toast({
          title: "Invitation resent",
          description: `The invitation has been resent to ${invitation.email}`,
          action: <ToastAction altText="OK">OK</ToastAction>,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        toast({
          title: "Invitation updated",
          description: `The invitation has been updated, but we couldn't send an email to ${invitation.email}. Error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
          variant: "destructive",
          action: <ToastAction altText="OK">OK</ToastAction>,
        });
      }
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError('Failed to resend invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatDate = (dateString: string) => {
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

  if (error && !isOwner) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/trips/${id}`)}
        >
          Back to Trip
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto py-2 px-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <BackButton href={`/trips/${id}`} label="Back to Trip" />
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Invite Participants</h1>
            {trip && (
              <p className="text-sm text-muted-foreground">
                {trip.name} • {trip.destination || 'No destination'}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Invite Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Add Participants</CardTitle>
                <CardDescription>
                  Add registered users or invite new participants to join this trip
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAddParticipantManually}>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircleIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">Important:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>If the person is already registered, they will be added to the trip automatically</li>
                            <li>If not, an invitation will be created and they will need to register and accept it</li>
                            {process.env.NODE_ENV === 'development' && (
                              <li className="text-amber-600 dark:text-amber-400 font-medium mt-2">
                                Development mode: Emails are simulated and not actually sent
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manualEmail">Email Address</Label>
                      <Input
                        id="manualEmail"
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manualRole">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="participant">Participant</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Admins can edit trip details and manage participants
                      </p>
                    </div>

                    {error && (
                      <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive">
                        <p>{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="bg-primary/10 border-l-4 border-primary p-4 text-primary">
                        <p>{success}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/trips/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting || !inviteEmail}
                    className={inviting ? 'animate-pulse' : ''}
                  >
                    {inviting ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                        Adding...
                      </>
                    ) : 'Add Participant'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Pending Invitations */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Pending Invitations</span>
                </CardTitle>
                <CardDescription>
                  People who have been invited but haven't joined yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      No pending invitations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="p-4 border border-border rounded-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Invited on {formatDate(invitation.created_at)}
                            </p>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {invitation.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResendInvitation(invitation.id)}
                              title="Resend invitation"
                            >
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              title="Cancel invitation"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
