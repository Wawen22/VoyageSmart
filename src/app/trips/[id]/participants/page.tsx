'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import ParticipantRoleManager from '@/components/trips/ParticipantRoleManager';
import {
  UserIcon,
  UsersIcon,
  UserPlusIcon,
  XIcon,
  MailIcon,
  SearchIcon,
  ShieldIcon,
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
  avatar_url?: string;
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

export default function ParticipantsPage() {
  const { id } = useParams();
  const tripId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const { permissions, isOwner, isAdmin, loading: permissionsLoading } = useRolePermissions(tripId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trip, setTrip] = useState<any | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

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
          .eq('id', tripId)
          .single();

        if (tripError) throw tripError;
        setTrip(tripData);

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
              email,
              avatar_url
            )
          `)
          .eq('trip_id', tripId);

        if (participantsError) throw participantsError;

        // Format participants data with proper type handling
        const formattedParticipants = participantsData.map(p => {
          const userData = (Array.isArray(p.users) ? p.users[0] : p.users) as { full_name: string; email: string; avatar_url: string } | null;
          return {
            id: p.id,
            user_id: p.user_id,
            trip_id: p.trip_id,
            role: p.role,
            invitation_status: p.invitation_status,
            created_at: p.created_at,
            full_name: userData?.full_name || 'Unknown',
            email: userData?.email || '',
            avatar_url: userData?.avatar_url || '',
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
          .eq('trip_id', tripId)
          .eq('status', 'pending');

        if (invitationsError) throw invitationsError;

        // Format invitations data with proper type handling
        const formattedInvitations = invitationsData
          .filter(inv => !inv.email.startsWith('link_invitation_') && !inv.email.startsWith('public_link_'))
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
      } catch (err: any) {
        console.error('Error fetching trip details:', err);
        setError('Failed to load trip details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, user]);

  const handleRemoveParticipant = async (participantId: string, userId: string) => {
    // Don't allow removing self if you're not the owner
    if (userId === user?.id && !isOwner) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove yourself from the trip. Please contact the trip owner.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow removing the owner
    const isUserOwner = participants.find(p => p.user_id === userId && p.role === 'owner');
    if (isUserOwner) {
      toast({
        title: "Cannot remove owner",
        description: "You cannot remove the trip owner. Transfer ownership first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRemoving(participantId);

      // Remove the participant
      const { error } = await supabase
        .from('trip_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      // Update the participants list
      setParticipants(participants.filter(p => p.id !== participantId));

      toast({
        title: "Participant removed",
        description: "The participant has been removed from the trip",
        action: <ToastAction altText="OK">OK</ToastAction>,
      });

      // If removing self, redirect to dashboard
      if (userId === user?.id) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error removing participant:', err);
      toast({
        title: "Error",
        description: "Failed to remove participant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemoving(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      // Get the invitation details first
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Instead of updating, delete the invitation
      // This avoids the unique constraint violation
      const { error } = await supabase
        .from('trip_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      // Remove the invitation from the list
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));

      toast({
        title: "Invitation cancelled",
        description: `The invitation for ${invitation.email} has been cancelled`,
        action: <ToastAction altText="OK">OK</ToastAction>,
      });
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to cancel invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = (participantId: string, newRole: string) => {
    // Update the local state
    setParticipants(
      participants.map(p =>
        p.id === participantId ? { ...p, role: newRole } : p
      )
    );
  };

  const filteredParticipants = participants.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvitations = pendingInvitations.filter(inv =>
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-destructive mb-6 max-w-md w-full">
          <p>{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/trips/${tripId}`)}
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
          <BackButton href={`/trips/${tripId}`} label="Back to Trip" />

          {permissions?.canInviteParticipants && (
            <Button
              onClick={() => router.push(`/trips/${tripId}/invite`)}
              size="sm"
              className="flex items-center gap-2"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Invite People</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          )}
        </div>

        <div className="max-w-7xl mx-auto py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Participants</h1>
            {trip && (
              <p className="text-sm text-muted-foreground">
                {trip.name} • {trip.destination || 'No destination'}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Participants List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Participants ({participants.length})</span>
                </CardTitle>
              </div>
              <CardDescription>
                People who are participating in this trip
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredParticipants.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No participants match your search' : 'No participants yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {participant.avatar_url ? (
                            <Image
                              src={participant.avatar_url}
                              alt={participant.full_name || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-primary/10">
                              <UserIcon className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{participant.full_name}</p>
                          <p className="text-xs text-muted-foreground">{participant.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Role Manager */}
                        <ParticipantRoleManager
                          tripId={tripId}
                          participantId={participant.id}
                          userId={participant.user_id}
                          currentRole={participant.role}
                          onRoleChange={(newRole) => handleRoleChange(participant.id, newRole)}
                        />

                        {/* Remove Button */}
                        {(isOwner || (isAdmin && participant.role !== 'owner' && participant.user_id !== user?.id)) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveParticipant(participant.id, participant.user_id)}
                            disabled={removing === participant.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MailIcon className="h-5 w-5" />
                  <span>Pending Invitations ({pendingInvitations.length})</span>
                </CardTitle>
                <CardDescription>
                  People who have been invited but haven't joined yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredInvitations.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No invitations match your search' : 'No pending invitations'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 border border-border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {invitation.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Invited by {invitation.inviter_name}
                            </span>
                          </div>
                        </div>

                        {(isOwner || isAdmin) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  );
}
