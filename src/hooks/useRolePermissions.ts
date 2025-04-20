import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type Role = 'owner' | 'admin' | 'participant';

export interface RolePermissions {
  canEditTrip: boolean;
  canDeleteTrip: boolean;
  canInviteParticipants: boolean;
  canRemoveParticipants: boolean;
  canManageRoles: boolean;
  canAddActivities: boolean;
  canEditActivities: boolean;
  canDeleteActivities: boolean;
  canAddExpenses: boolean;
  canEditExpenses: boolean;
  canDeleteExpenses: boolean;
}

const DEFAULT_PERMISSIONS: Record<Role, RolePermissions> = {
  owner: {
    canEditTrip: true,
    canDeleteTrip: true,
    canInviteParticipants: true,
    canRemoveParticipants: true,
    canManageRoles: true,
    canAddActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canAddExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: true,
  },
  admin: {
    canEditTrip: true,
    canDeleteTrip: false,
    canInviteParticipants: true,
    canRemoveParticipants: true,
    canManageRoles: false,
    canAddActivities: true,
    canEditActivities: true,
    canDeleteActivities: true,
    canAddExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: true,
  },
  participant: {
    canEditTrip: false,
    canDeleteTrip: false,
    canInviteParticipants: false,
    canRemoveParticipants: false,
    canManageRoles: false,
    canAddActivities: true,
    canEditActivities: true,
    canDeleteActivities: false,
    canAddExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: false,
  },
};

export interface UseRolePermissionsResult {
  role: Role | null;
  permissions: RolePermissions | null;
  isOwner: boolean;
  isAdmin: boolean;
  isParticipant: boolean;
  loading: boolean;
  error: string | null;
}

export function useRolePermissions(tripId: string): UseRolePermissionsResult {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !tripId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First check if user is the owner
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('owner_id')
          .eq('id', tripId)
          .single();

        if (tripError && tripError.code !== 'PGRST116') {
          throw tripError;
        }

        if (tripData && tripData.owner_id === user.id) {
          setRole('owner');
          setPermissions(DEFAULT_PERMISSIONS.owner);
          setLoading(false);
          return;
        }

        // If not owner, check participant role
        const { data: participantData, error: participantError } = await supabase
          .from('trip_participants')
          .select('role')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .single();

        if (participantError) {
          if (participantError.code === 'PGRST116') {
            // Not a participant
            setRole(null);
            setPermissions(null);
          } else {
            throw participantError;
          }
        } else if (participantData) {
          const userRole = participantData.role as Role;
          setRole(userRole);
          setPermissions(DEFAULT_PERMISSIONS[userRole] || DEFAULT_PERMISSIONS.participant);
        }
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message || 'Failed to fetch user role');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, tripId]);

  return {
    role,
    permissions,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isParticipant: !!role,
    loading,
    error,
  };
}
