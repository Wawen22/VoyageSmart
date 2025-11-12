import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XIcon,
  TrashIcon,
  ArrowRightIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type BulkActionsProps = {
  selectedCount: number;
  onMarkComplete: () => void;
  onChangePriority: (priority: number) => void;
  onMoveToDay: (dayId: string) => void;
  onDelete: () => void;
  onCancel: () => void;
  availableDays: { id: string; label: string }[];
  isLoading?: boolean;
};

export default function BulkActions({
  selectedCount,
  onMarkComplete,
  onChangePriority,
  onMoveToDay,
  onDelete,
  onCancel,
  availableDays,
  isLoading = false
}: BulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<number>(2);

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleMove = () => {
    if (selectedDayId) {
      onMoveToDay(selectedDayId);
      setShowMoveDialog(false);
      setSelectedDayId('');
    }
  };

  const handleChangePriority = () => {
    onChangePriority(selectedPriority);
    setShowPriorityDialog(false);
  };

  return (
    <>
      {/* Bulk Actions Toolbar */}
      <div className="
        fixed bottom-0 left-0 right-0 z-40
        glass-card border-t border-white/20
        px-4 py-4 sm:px-6
        animate-slide-in-up
        md:relative md:rounded-2xl md:border md:mb-4
      ">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          {/* Selected Count */}
          <div className="flex items-center gap-2">
            <div className="
              w-8 h-8 rounded-full
              bg-blue-500/20 border border-blue-500/50
              flex items-center justify-center
            ">
              <span className="text-sm font-bold text-blue-600">
                {selectedCount}
              </span>
            </div>
            <span className="text-sm font-medium hidden sm:inline">
              {selectedCount} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mark Complete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkComplete}
              disabled={isLoading}
              className="hover:bg-green-500/10 hover:text-green-600"
            >
              <CheckCircleIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Complete</span>
            </Button>

            {/* Change Priority */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPriorityDialog(true)}
              disabled={isLoading}
              className="hover:bg-orange-500/10 hover:text-orange-600"
            >
              <AlertCircleIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Priority</span>
            </Button>

            {/* Move to Day */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMoveDialog(true)}
              disabled={isLoading}
              className="hover:bg-blue-500/10 hover:text-blue-600"
            >
              <ArrowRightIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Move</span>
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
              className="hover:bg-red-500/10 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            {/* Cancel */}
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="ml-2"
            >
              <XIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-card border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activities</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} {selectedCount === 1 ? 'activity' : 'activities'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Day Dialog */}
      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent className="glass-card border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Move Activities</AlertDialogTitle>
            <AlertDialogDescription>
              Select the day to move {selectedCount} {selectedCount === 1 ? 'activity' : 'activities'} to:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedDayId} onValueChange={setSelectedDayId}>
              <SelectTrigger className="bg-background/30 border-white/20">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map(day => (
                  <SelectItem key={day.id} value={day.id}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDayId('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMove}
              disabled={!selectedDayId}
            >
              Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Priority Dialog */}
      <AlertDialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <AlertDialogContent className="glass-card border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Priority</AlertDialogTitle>
            <AlertDialogDescription>
              Set priority for {selectedCount} {selectedCount === 1 ? 'activity' : 'activities'}:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={selectedPriority.toString()}
              onValueChange={(v) => setSelectedPriority(parseInt(v))}
            >
              <SelectTrigger className="bg-background/30 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">High Priority</SelectItem>
                <SelectItem value="2">Medium Priority</SelectItem>
                <SelectItem value="3">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePriority}>
              Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
