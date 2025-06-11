'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Users, Shield, Crown, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  onActionCompleted: () => void;
}

export function BulkActionsModal({ isOpen, onClose, selectedUserIds, onActionCompleted }: BulkActionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [formData, setFormData] = useState({
    role: 'user',
    tier: 'free',
    status: 'active',
    valid_until: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;

    setLoading(true);
    try {
      let requestData: any = {
        action,
        userIds: selectedUserIds
      };

      // Add specific data based on action
      switch (action) {
        case 'updateRole':
          requestData.data = { role: formData.role };
          break;
        case 'updateSubscription':
          requestData.data = {
            tier: formData.tier,
            status: formData.status,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
          };
          break;
        case 'resetSubscription':
          // No additional data needed
          break;
        case 'delete':
          // No additional data needed
          break;
      }

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'voyagesmart-admin'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: `Bulk action completed. ${data.summary.successful} users updated, ${data.summary.failed} failed.`
      });

      onActionCompleted();
      onClose();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAction('');
      setFormData({
        role: 'user',
        tier: 'free',
        status: 'active',
        valid_until: ''
      });
      onClose();
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'updateRole':
        return <Shield className="h-4 w-4" />;
      case 'updateSubscription':
        return <Crown className="h-4 w-4" />;
      case 'resetSubscription':
        return <RefreshCw className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getActionDescription = (actionType: string) => {
    switch (actionType) {
      case 'updateRole':
        return 'Change the role for selected users';
      case 'updateSubscription':
        return 'Update subscription details for selected users';
      case 'resetSubscription':
        return 'Reset all selected users to Free plan';
      case 'delete':
        return 'Permanently delete selected users and all their data';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Actions
          </DialogTitle>
          <DialogDescription>
            Perform actions on {selectedUserIds.length} selected user{selectedUserIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Selection */}
          <div className="space-y-3">
            <Label>Select Action</Label>
            <RadioGroup value={action} onValueChange={setAction}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="updateRole" id="updateRole" />
                <Label htmlFor="updateRole" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  Update Role
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="updateSubscription" id="updateSubscription" />
                <Label htmlFor="updateSubscription" className="flex items-center gap-2 cursor-pointer">
                  <Crown className="h-4 w-4" />
                  Update Subscription
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resetSubscription" id="resetSubscription" />
                <Label htmlFor="resetSubscription" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Reset to Free Plan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="flex items-center gap-2 cursor-pointer text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete Users
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Description */}
          {action && (
            <Alert>
              <div className="flex items-center gap-2">
                {getActionIcon(action)}
                <AlertDescription>
                  {getActionDescription(action)}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Action-specific forms */}
          {action === 'updateRole' && (
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'updateSubscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Select value={formData.tier} onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="ai">AI Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until (optional)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>
          )}

          {action === 'delete' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. All user data including trips, activities, and expenses will be permanently deleted.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !action}
              variant={action === 'delete' ? 'destructive' : 'default'}
            >
              {loading ? 'Processing...' : `Apply to ${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
