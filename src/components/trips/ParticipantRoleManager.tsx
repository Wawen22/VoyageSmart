import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { ShieldIcon, CheckIcon, LoaderIcon } from 'lucide-react';

interface ParticipantRoleManagerProps {
  tripId: string;
  participantId: string;
  userId: string;
  currentRole: string;
  onRoleChange?: (newRole: string) => void;
}

export default function ParticipantRoleManager({
  tripId,
  participantId,
  userId,
  currentRole,
  onRoleChange,
}: ParticipantRoleManagerProps) {
  const { user } = useAuth();
  const { permissions, isOwner, loading: permissionsLoading } = useRolePermissions(tripId);
  const [role, setRole] = useState(currentRole);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  // Prevent changing own role or if user doesn't have permission
  const canChangeRole = 
    !permissionsLoading && 
    permissions?.canManageRoles && 
    user?.id !== userId;

  const handleRoleChange = async (newRole: string) => {
    if (!canChangeRole) return;
    
    try {
      setUpdating(true);
      setSuccess(false);
      
      const { error } = await supabase
        .from('trip_participants')
        .update({ role: newRole })
        .eq('id', participantId);
      
      if (error) throw error;
      
      setRole(newRole);
      setSuccess(true);
      
      if (onRoleChange) {
        onRoleChange(newRole);
      }
      
      toast({
        title: "Role updated",
        description: `Participant role has been updated to ${newRole}`,
        action: <ToastAction altText="OK">OK</ToastAction>,
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update participant role",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex items-center space-x-2">
        <ShieldIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{currentRole}</span>
      </div>
    );
  }

  if (!canChangeRole) {
    return (
      <div className="flex items-center space-x-2">
        <ShieldIcon className="h-4 w-4 text-muted-foreground" />
        <span className="capitalize">{currentRole}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={role}
        onValueChange={handleRoleChange}
        disabled={updating || !canChangeRole}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="participant">Participant</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          {isOwner && <SelectItem value="owner">Owner (Transfer)</SelectItem>}
        </SelectContent>
      </Select>
      
      {updating && (
        <LoaderIcon className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      
      {success && !updating && (
        <CheckIcon className="h-4 w-4 text-green-500" />
      )}
    </div>
  );
}
