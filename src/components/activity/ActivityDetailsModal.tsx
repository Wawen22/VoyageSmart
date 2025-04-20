'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ActivityDetails from './ActivityDetails';

interface Activity {
  id: string;
  trip_id: string;
  day_id: string;
  name: string;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  booking_reference: string | null;
  priority: number;
  cost: number | null;
  currency: string;
  notes: string | null;
  status: string;
}

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onEdit?: (activity: Activity) => void;
}

export default function ActivityDetailsModal({
  isOpen,
  onClose,
  activity,
  onEdit
}: ActivityDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Details</DialogTitle>
        </DialogHeader>
        <ActivityDetails 
          activity={activity} 
          onEdit={onEdit} 
        />
      </DialogContent>
    </Dialog>
  );
}
