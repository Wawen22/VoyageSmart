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
    <div className="flex items-center space-x-2 min-w-0">
      <Select
        value={role}
        onValueChange={handleRoleChange}
        disabled={updating || !canChangeRole}
      >
        <SelectTrigger className="w-[110px] sm:w-[130px] md:w-[140px] min-w-[90px] max-w-[160px] text-xs sm:text-sm h-8 sm:h-10">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent
          align="end"
          side="bottom"
          className="min-w-[110px] max-w-[180px] z-[60]"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          <SelectItem value="participant" className="text-xs sm:text-sm">
            Participant
          </SelectItem>
          <SelectItem value="admin" className="text-xs sm:text-sm">
            Admin
          </SelectItem>
          {isOwner && (
            <SelectItem value="owner" className="text-xs sm:text-sm">
              Owner (Transfer)
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {updating && (
        <LoaderIcon className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground flex-shrink-0" />
      )}

      {success && !updating && (
        <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
      )}
    </div>
  );
}
