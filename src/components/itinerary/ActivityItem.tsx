import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { MapPinIcon, ClockIcon, DollarSignIcon, FileIcon, TrashIcon, EditIcon, MoveIcon, EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Activity = {
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
};

type ActivityItemProps = {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMove?: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
};

export default function ActivityItem({ activity, onEdit, onDelete, onMove, onViewDetails }: ActivityItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(parseISO(timeString), 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return null;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
      default:
        return 'Low';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 3:
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const getPriorityBorderColor = (priority: number) => {
    switch (priority) {
      case 1:
        return '#ef4444'; // red-500
      case 2:
        return '#f97316'; // orange-500
      case 3:
      default:
        return '#3b82f6'; // blue-500
    }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(activity.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div
      className="border border-l-4 rounded-md p-3 hover:shadow-md transition-all hover-lift animate-fade-in"
      style={{ borderLeftColor: getPriorityBorderColor(activity.priority) }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-medium text-foreground truncate">{activity.name}</h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {activity.start_time && (
              <span className="inline-flex items-center text-xs text-muted-foreground">
                <ClockIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                {formatTime(activity.start_time)}
                {activity.end_time && ` - ${formatTime(activity.end_time)}`}
              </span>
            )}

            {activity.location && (
              <span className="inline-flex items-center text-xs text-muted-foreground">
                <MapPinIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="truncate max-w-[150px]">{activity.location}</span>
              </span>
            )}
          </div>
        </div>

        <Badge className={`text-xs ${getPriorityColor(activity.priority)}`}>
          {getPriorityLabel(activity.priority)}
        </Badge>
      </div>

      {activity.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{activity.notes}</p>
      )}

      <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {activity.cost && (
            <span className="inline-flex items-center">
              <DollarSignIcon className="h-3 w-3 mr-1" />
              {formatCurrency(activity.cost, activity.currency)}
            </span>
          )}
          {activity.booking_reference && (
            <span className="inline-flex items-center">
              <FileIcon className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[80px]">{activity.booking_reference}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => onViewDetails(activity)}
              aria-label="View details"
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-primary hover:bg-primary/10 transition-colors"
            onClick={() => onEdit(activity)}
            aria-label="Edit activity"
          >
            <EditIcon className="h-3.5 w-3.5" />
          </Button>

          {onMove && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-primary hover:bg-primary/10 transition-colors"
              onClick={() => onMove(activity)}
              aria-label="Move activity"
            >
              <MoveIcon className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-colors ${confirmDelete ? 'text-destructive bg-destructive/10 animate-pulse-once' : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'}`}
            onClick={handleDeleteClick}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete activity'}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
